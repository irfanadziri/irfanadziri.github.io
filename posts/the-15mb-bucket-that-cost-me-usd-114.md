# The 15 MB Bucket That Cost Me USD 114: Litestream, S3 LIST Calls and Vibe-Coded Defaults

> Two tiny Litestream replicas ran up 928 GB of S3 data transfer in two weeks. How it happened, why no alert stopped it, how AWS waived the bill, and what I changed about building with AI.

- Type: Post
- Published: 2026-11-14
- Tags: aws, cost, homelab
- Source: https://irfanadziri.dev/posts/the-15mb-bucket-that-cost-me-usd-114/

---

Two of my homelab apps each backed up a SQLite database of a few megabytes to S3 with [Litestream](https://litestream.io). In October that cost me USD 105.04 in S3 charges, plus tax, for buckets that held about 15 MB each. Storage came to USD 0.02. The rest was data transfer and API requests that I never pictured when I set it up, because I never read the docs on what Litestream does in the background. An AI assistant wrote the config, it worked, and I moved on.

This is the write-up: how a tiny bucket generates hundreds of gigabytes of traffic, why none of my alerts stopped it, how I got the bill waived, and what I now do differently when I build with AI.

---

## 1. The Setup

Both apps follow the same pattern: a single Bun process, SQLite in WAL mode, running in an LXC container on Proxmox at home. Litestream replicates the database to an S3 bucket in `ap-southeast-5`, so a dead disk costs seconds of data, not a day.

The architecture decision record for the first app said it plainly:

> Two users, a few hundred writes a day at most. Litestream gives point-in-time recovery for pennies.

That line was true for storage. It was not true for anything else.

The config that shipped:

```yaml
dbs:
  - path: /opt/app/data/app.db
    replica:
      url: s3://app-backup/litestream
      region: ap-southeast-5

snapshot:
  interval: 24h
  retention: 720h   # 30 days of point-in-time restore
```

It looks reasonable. A daily snapshot, kept for a month. What it doesn’t show is what Litestream does between snapshots, because that part comes from defaults.

## 2. How a 15 MB Bucket Becomes 126 GB a Day

Litestream 0.5 doesn’t just upload changes. It writes small files and then compacts them through levels, and it lists the bucket to do that.

**What the config didn't show: amber is where the cost came from.** App writes to SQLite → Litestream uploads changes as small L0 files, within about a second. Litestream uploads changes as small L0 files, within about a second → Every 30s (default): compact recent L0 files into one L1 file. Every 30s (default): compact recent L0 files into one L1 file → To compact, LIST the files at that level. To compact, LIST the files at that level → New L1 file kept until it falls outside snapshot retention: 30 days. New L1 file kept until it falls outside snapshot retention: 30 days → More L1 files each day, so every LIST returns more pages. More L1 files each day, so every LIST returns more pages → To compact, LIST the files at that level. To compact, LIST the files at that level → Each 1,000-key page of LIST response is a few hundred KB, billed as data transfer out. Friction points: Every 30s (default): compact recent L0 files into one L1 file; To compact, LIST the files at that level; New L1 file kept until it falls outside snapshot retention: 30 days; More L1 files each day, so every LIST returns more pages; Each 1,000-key page of LIST response is a few hundred KB, billed as data transfer out.

The pieces, in order:

- **Compaction every 30 seconds** is Litestream’s default for level 1. That is 2,880 runs a day per database, each one listing files.
- **L1 files outlive their usefulness.** Old L1 files are only deleted once the daily snapshot they precede falls outside snapshot retention. With `retention: 720h`, a 30-second file survives for 30 days.
- **The pile grows every day.** By the end of October one bucket held 36,000 current objects and the other 27,000. Each 30-second compaction paged through all of them.
- **LIST responses count as data transfer out.** A page of 1,000 keys is a few hundred KB of XML. My traffic averaged about 440,000 LIST calls a day at around 286 KB each: about 126 GB a day, from buckets holding 15 MB.

None of this is a Litestream bug. The defaults are sensible for a database that wants fine-grained point-in-time recovery over a short window. Combined with a 30-day retention I set without thinking about file counts, they produced a cost curve that grew every day.

## 3. The Numbers

| Dimension                     | Value                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------- |
| **Bucket size**               | About 15 MB each                                                             |
| **October data transfer out** | 928 GB, of which 828 GB billable after the 100 GB free allowance (USD 89.46) |
| **October Tier 1 requests**   | 3.45 million, mostly LIST (USD 15.51)                                        |
| **October Tier 2 requests**   | 127,000 (USD 0.05)                                                           |
| **October storage**           | USD 0.02                                                                     |
| **October S3 total**          | USD 105.04, plus USD 8.41 tax                                                |
| **Peak daily cost**           | About USD 15 and still climbing                                              |
| **Projected monthly cost**    | USD 750–1,000 once both buckets reached 30 days of files                     |

The data transfer charge didn’t start until 23 October. The first week used up the free 100 GB, which hid the problem for exactly as long as it would have been cheap to fix.

**October 2026: two weeks from first bucket to a USD 15-a-day bill.** Timeline, October to November 2026: 17 Oct, the first app's bucket is created. 19 Oct, the only budget alert fires at USD 0.79 of USD 1.00. 21 Oct, the second app's bucket is created. 23 Oct, the free 100 GB of data transfer is used up and charges start. 31 Oct, about USD 15 a day and rising. 1 Nov, found while estimating backup costs; compaction slowed, then Litestream removed. 13 Nov, AWS waives the October invoice.

## 4. Why Nothing Stopped It

I had two safety nets. Both worked exactly as configured, and neither helped.

- **AWS Budgets** had one alert, at 75% of USD 1. It fired on 19 October at USD 0.79, a figure that looked like any normal month. An actual-spend alert fires once per period, so as the bill climbed to USD 114 it stayed silent.
- **AWS Cost Anomaly Detection** recorded the S3 anomaly at the start, with an impact of USD 6.50. AWS dates it from 16 October, a day before my first bucket existed, which I put down to its daily windows rather than anything I ran. The default subscription only emails when impact reaches **USD 100 and 40%**, so I never heard about it.

The lesson isn’t “turn on alerts”. I had alerts. It’s that one low threshold is a single shot, and the default anomaly threshold is set for accounts far larger than a homelab.

What I run now:

| Alert                      | Setting                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Budget, actual spend**   | Email at USD 5, 20 and 50                                                                                           |
| **Budget, forecast**       | Email at USD 20                                                                                                     |
| **Cost Anomaly Detection** | My own subscription, daily, at USD 5 of impact                                                                      |
| **Daily cost report**      | Yesterday’s spend by service and the month to date, on my phone at 9 AM, flagged above USD 1 a day or USD 5 a month |

Either the USD 5 anomaly alert or the daily report would have caught this around 17 October, for a few dollars.

## 5. The Fix

The immediate fix was a small config change. Compacting every 5 minutes instead of 30 seconds cuts LIST calls about tenfold, and 7-day retention lets old files age out:

```yaml
levels:
  - interval: 5m
  - interval: 1h
  - interval: 6h

snapshot:
  interval: 24h
  retention: 168h
```

I kept three levels, the same count as the defaults. Retention cleans up level by level, and the docs don’t say what happens to files left at a level you remove, so I didn’t find out.

Then I asked the question I should have asked at the start: what is this backup for? Both apps run on Proxmox, and Proxmox Backup Server already snapshots every container nightly to S3. For apps with one or two users, losing at most a day is acceptable. So I removed Litestream entirely, emptied and deleted both buckets with all their versions (235,441 objects), and deleted the IAM users through Terraform. S3 spend dropped to about zero the next day.

## 6. Getting the Bill Waived

I opened a billing case in the AWS console, which is free on the Basic support plan. The first reply was automated. A human replied five days later, after a follow-up asking for manual review.

What the billing agent asked for, in order:

- **Why the invoice was unpaid.** The payment method on file had lapsed, and I told them the invoice would stay unpaid while the request was under review.
- **What I had put in place,** with the exact budget amounts and thresholds. They checked the budget existed in my account before moving on.
- **Confirmation that I’m liable for future usage** under the AWS Customer Agreement.
- **Which October usage was intended,** so they could separate it from the unintended part.

On 13 November AWS waived the whole October invoice: USD 114.43, which covered the S3 charges and their tax plus about USD 1 of other usage. What I think helped: I owned the mistake, I didn’t dispute AWS’s metering, I explained the mechanism with numbers, the resources were already gone, and the alerts existed before I said they did. When one of my drafts read like I was blaming AWS’s default anomaly threshold, I rewrote it as my own setting to fix.

## 7. What I Changed About Building With AI

The honest root cause is not Litestream or S3. I vibe-coded the backup layer. An AI assistant proposed Litestream, wrote the config, and it worked on the first try. I never opened the Litestream docs, so I never learned it compacts on a 30-second timer, and I never asked what “30 days of retention” means in file count. The docs even have a cost section that calls request costs the “primary driver”, lists LIST operations for cleanup and maintenance, and says storage is “usually minimal”. That was the whole story, written down before I started.

An AI writes config that works. It doesn’t own the bill, and it won’t tell you about a default it didn’t think to mention. What I do now:

- **Read the docs for anything that runs unattended against a paid API.** At minimum the configuration reference and every default interval.
- **Ask what a setting costs over time, not just whether it works.** Retention, polling and compaction intervals are cost settings, not just correctness settings.
- **Watch the first week.** For any new background job that touches the cloud, check Cost Explorer by usage type after a day and after a week. Here, a single check on day two would have shown a growing curve.
- **Don’t judge a bucket by its size.** Requests and data transfer can be most of the bill. Group costs by `USAGE_TYPE`, not just by service.
- **Question the architecture claim.** “For pennies” was written about storage and never checked against request volume.

The AI did what I asked. I didn’t ask enough.

## Closing Thoughts

The expensive mistakes in a homelab aren’t the dramatic ones. They’re the quiet defaults in a tool that works perfectly, multiplied by time. My setup caught the problem the way most setups do: by accident, while I was estimating something else. Now there are four alerts and a daily report between me and the next one, and a rule that I read the docs for anything that runs while I sleep.

### Further Reading

- [Litestream configuration reference](https://litestream.io/reference/config/): compaction levels, snapshot retention and L0 retention
- [Amazon S3 pricing](https://aws.amazon.com/s3/pricing/): request charges and data transfer out, including the free 100 GB
- [AWS Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html): monitors, subscriptions and alert thresholds
- [AWS Budgets](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/budgets-managing-costs.html): actual and forecast alerts
