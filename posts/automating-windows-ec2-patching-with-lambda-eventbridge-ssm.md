# Automating Windows EC2 Patching with Lambda, EventBridge, and SSM Automation

> How I replaced a years-old manual Windows EC2 patching ritual (RDP in, download the KB, patch, reboot, and sanity check) with a fully automated pipeline using Lambda, EventBridge, and an SSM Automation Document.

- Type: Post
- Published: 2025-10-13
- Tags: aws, windows
- Source: https://irfanadziri.dev/posts/automating-windows-ec2-patching-with-lambda-eventbridge-ssm/

---

Every second Tuesday of the month, Microsoft drops Patch Tuesday. For years before I touched it, the response at my team was the same ritual: RDP into the Windows EC2 via SSM, download the relevant KB manually, apply it, reboot, run a sanity check, and take a backup before and after. Whoever owned that task did it by hand, every month, without fail. Then it got handed to me. I did it manually for a few cycles before deciding that no engineer should spend part of their Thursday doing something a Lambda function can do better.

---

## Why Thursday, Not Tuesday

Patch Thursday is a real pattern in enterprise Windows administration. Microsoft releases patches on the second Tuesday, but organisations with any production exposure don’t apply them immediately. They wait 48 hours to let the community surface any regressions. Applying on the Thursday after give engineers time to catch the “this patch breaks X” posts on the forums before they’ve already applied it to a server that matters.

So the schedule I needed wasn’t a simple cron. It was: **the Thursday that falls two days after the second Tuesday of the month**. That’s not something EventBridge can express natively.

---

## The Architecture

The solution has three components:

1. **EventBridge** fires a trigger every Thursday
2. **Lambda** receives that trigger, calculates whether today is the correct Thursday, and starts the SSM Automation if it is
3. **SSM Automation Document** runs the actual patching workflow: pre-patch backup, patch, reboot, sanity check, and post-patch backup

This keeps EventBridge simple and puts the date logic where it belongs: in code.

```
EventBridge (every Thursday)
    → Lambda (is this the right Thursday?)
        → SSM Automation Document
            → Step 1: Pre-patch AMI backup
            → Step 2: Run patch baseline
            → Step 3: Reboot
            → Step 4: Sanity check
            → Step 5: Post-patch AMI backup
```

---

## Step 1: The Date Calculation in Lambda

The Lambda function does one thing before touching SSM: verify today is the Thursday after the second Tuesday of the current month.

```python
import boto3
import datetime

def get_patch_thursday(year: int, month: int) -> datetime.date:
    first = datetime.date(year, month, 1)
    # weekday(): Monday=0, Tuesday=1, Thursday=3
    days_to_first_tuesday = (1 - first.weekday()) % 7
    first_tuesday = first + datetime.timedelta(days=days_to_first_tuesday)
    second_tuesday = first_tuesday + datetime.timedelta(weeks=1)
    return second_tuesday + datetime.timedelta(days=2)

def handler(event, context):
    today = datetime.date.today()
    patch_thursday = get_patch_thursday(today.year, today.month)

    if today != patch_thursday:
        print(f"Today is {today}. Patch Thursday is {patch_thursday}. Skipping.")
        return {"status": "skipped"}

    print(f"Today is Patch Thursday ({today}). Starting SSM Automation.")
    start_automation()
    return {"status": "started"}
```

The `(1 - first.weekday()) % 7` expression handles the edge case where the 1st of the month is already a Tuesday - without the modulo it would return 0 and land on the 1st rather than the 8th.

---

## Step 2: EventBridge Rule

The rule fires every Thursday at a fixed time, early enough that the patch window completes during business hours so someone is around if something goes wrong. (Make sure business stakeholders are informed earlier HAHA)

```json
{
  "ScheduleExpression": "cron(0 1 ? * 5 *)",
  "Description": "Fire every Thursday at 01:00 UTC for Windows EC2 patch check"
}
```

Weekday `5` in EventBridge cron is Thursday (Sunday=1, Monday=2, …, Thursday=5). The Lambda function filters down to the correct Thursday.

---

## Step 3: The SSM Automation Document

This is where the actual work happens. The document mirrors the old manual steps exactly. I just turned each step of the runbook into an SSM action.

```yaml
schemaVersion: "0.3"
description: "Automated Windows EC2 monthly patching"
parameters:
  InstanceId:
    type: String
    description: Target Windows EC2 instance ID
mainSteps:
  - name: PrePatchBackup
    action: aws:createImage
    inputs:
      InstanceId: "{{ InstanceId }}"
      ImageName: "pre-patch-{{ InstanceId }}-{{ global:DATE_TIME }}"
      NoReboot: true
    outputs:
      - Name: PrePatchAmiId
        Selector: $.ImageId
        Type: String

  - name: ApplyPatchBaseline
    action: aws:runCommand
    inputs:
      DocumentName: AWS-RunPatchBaseline
      InstanceIds:
        - "{{ InstanceId }}"
      Parameters:
        Operation: Install
        RebootOption: NoReboot

  - name: RebootInstance
    action: aws:executeAwsApi
    inputs:
      Service: ec2
      Api: RebootInstances
      InstanceIds:
        - "{{ InstanceId }}"

  - name: WaitForInstanceReady
    action: aws:waitForAwsResourceProperty
    inputs:
      Service: ssm
      Api: DescribeInstanceInformation
      Filters:
        - Key: InstanceIds
          Values:
            - "{{ InstanceId }}"
      PropertySelector: "$.InstanceInformationList[0].PingStatus"
      DesiredValues:
        - Online
    timeoutSeconds: 600

  - name: SanityCheck
    action: aws:runCommand
    inputs:
      DocumentName: AWS-RunPowerShellScript
      InstanceIds:
        - "{{ InstanceId }}"
      Parameters:
        commands:
          - |
            $services = Get-Service | Where-Object { $_.StartType -eq 'Automatic' -and $_.Status -ne 'Running' }
            if ($services) {
              Write-Output "WARNING: The following auto-start services are not running:"
              $services | Select-Object Name, Status | Format-Table
              exit 1
            }
            Write-Output "Sanity check passed. All automatic services are running."

  - name: PostPatchBackup
    action: aws:createImage
    inputs:
      InstanceId: "{{ InstanceId }}"
      ImageName: "post-patch-{{ InstanceId }}-{{ global:DATE_TIME }}"
      NoReboot: true
    outputs:
      - Name: PostPatchAmiId
        Selector: $.ImageId
        Type: String
```

A few things worth calling out:

- **`NoReboot: true` on the AMI steps** - the pre-patch backup uses it so the instance stays up during snapshot. The post-patch backup uses it for the same reason; SSM has already rebooted the instance in a controlled step.
- **`AWS-RunPatchBaseline` with `NoReboot`** - by default, AWS’s patch baseline document reboots after applying. Setting `RebootOption: NoReboot` hands reboot control back to the automation document so it happens as its own tracked step, not silently inside the patch step.
- **`WaitForInstanceReady`** - SSM loses contact with the instance during reboot. This step polls until the SSM agent comes back online before proceeding. Without it, the sanity check step fires against an instance that’s still coming up and fails intermittently.
- **Sanity check** - the PowerShell checks that all services configured to start automatically are actually running. It’s not exhaustive, but it catches the most common post-patch regression: a service that was running before the patch isn’t running after. If the check fails, the automation halts with a non-zero exit and the post-patch backup is never taken - which is a useful signal that something needs attention. This sanity check can be customized depending on requirements.

---

## Step 4: Triggering SSM from Lambda

The `start_automation` function passes the instance ID and lets SSM handle execution:

```python
def start_automation():
    ssm = boto3.client("ssm")
    ssm.start_automation_execution(
        DocumentName="WindowsEC2MonthlyPatch",
        Parameters={
            "InstanceId": ["i-0abc1234def56789"]
        }
    )
```

> **Note:** Step 1 and Step 4 are not two separate Lambda functions. They belong in the same one. The date check and the SSM trigger are both in `handler()`. The steps are split here for readability, but in the actual deployment it is a single Lambda file.

---

## IAM Permissions

The Lambda execution role needs:

```json
{
  "Effect": "Allow",
  "Action": ["ssm:StartAutomationExecution"],
  "Resource": "arn:aws:ssm:REGION:ACCOUNT_ID:automation-definition/WindowsEC2MonthlyPatch:*"
}
```

The SSM Automation Document itself runs with a separate IAM role that needs:

```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:CreateImage",
    "ec2:DescribeImages",
    "ec2:RebootInstances",
    "ssm:SendCommand",
    "ssm:DescribeInstanceInformation",
    "ssm:GetCommandInvocation"
  ],
  "Resource": "*"
}
```

Keep these two roles separate. The Lambda role should only be able to start the automation, not perform EC2 or SSM operations directly.

---

## Network Requirement: S3 Access

`AWS-RunPatchBaseline` doesn’t pull patches from the internet directly. It downloads them from AWS-managed S3 buckets in the same region as the instance. If the EC2 sits in a private subnet with no outbound internet route, patching will silently fail at the download step.

The fix is an S3 VPC endpoint (Gateway type, free) attached to the route table of the instance’s subnet:

```
com.amazonaws.REGION.s3
```

This lets the instance reach the patch content buckets without routing through a NAT Gateway or internet gateway. If a NAT Gateway for other outbound traffic is already there, S3 access will work through that too, but the VPC endpoint is cleaner and avoids the per-GB NAT cost for patch downloads.

Confirm the instance can reach the required S3 buckets by running this from the instance before the first automation run:

```powershell
Invoke-WebRequest -Uri "https://s3.REGION.amazonaws.com" -UseBasicParsing
```

If it times out, the network path isn’t there. Fix the endpoint or route before wiring up the automation.

---

## What Changed

Before automation, patching took around 45 minutes per server: SSM RDP session, KB download, patch application, wait for reboot, sanity walkthrough, two manual AMI snapshots. The process solely depended if I remember to do it.

Now the Lambda fires, verifies the date, and hands off to SSM. The automation document runs the same sequence in under 20 minutes with full execution logs in SSM and AMI snapshots in EC2. If the sanity check fails, the automation stops and the missing post-patch AMI is the signal to investigate. No one needs to remember the date, no one needs to be at their desk.

The manual runbook still exists: it’s useful if the automation itself needs to be bypassed for a specific month. But it’s documentation now, not a monthly obligation.

---

### Further Reading

- [AWS Systems Manager Automation actions reference](https://docs.aws.amazon.com/systems-manager/latest/userguide/automation-actions.html) - full list of SSM Automation step types including `aws:createImage`, `aws:runCommand`, and `aws:waitForAwsResourceProperty`
- [AWS-RunPatchBaseline document](https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager-aws-runpatchbaseline.html) - parameters and reboot behaviour for the managed patch baseline runner
- [EventBridge cron expression syntax](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html#cron-based) - weekday numbering and cron field ordering (differs from standard Unix cron)
- [Microsoft Patch Tuesday](https://msrc.microsoft.com/update-guide/) - the source; also where it is checked if a given month’s patches have known issues before applying
