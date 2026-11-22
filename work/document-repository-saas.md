# What shipped was smaller than what I built

> A document repository for researchers, built solo and entirely through the AWS console, including an asynchronous text-extraction pipeline (SQS · Lambda · Textract) I designed and then deliberately cut for cost, folding extraction back into the application once the expected load didn't justify a serverless fan-out. The same platform was rebuilt as infrastructure-as-code in the role that followed.

- Type: Case study
- Role: Sole developer (internship)
- Period: Feb 2024 → May 2024
- Employer: an AWS-partner software house
- Stack: vue, cognito, s3, dynamodb, opensearch, ses, cloudfront, vpc
- Source: https://irfanadziri.dev/work/document-repository-saas/

---

This was an internship at a software house that builds and implements cloud systems for public-sector clients, and it was the first thing I built on AWS that other people actually used. The brief was a document repository for researchers: somewhere to put papers and reports, and (the part that made it more than a file share) a way to find them again by what was written inside them rather than by whatever someone had thought to type into the filename. I built it alone, front to back.

Every resource in it was created by hand in the console. No CloudFormation, no Terraform, nothing version-controlled below the application layer. That’s worth stating rather than glossing, because the entire point of the role that came next was undoing it.

## The pipeline I designed for it

Searching on metadata (title, uploader, date) is a table query and needs no infrastructure worth describing. Searching the _contents_ is what changes the shape of the system: the text has to come out of every document before anyone can look for it, extraction takes real time, and doing that while a user waits on an upload response holds up against a two-page test PDF and nothing larger.

So the upload path did as little as possible. The file went to S3, a record went to DynamoDB, the response came straight back. Everything expensive happened after the browser had moved on. S3 raised an event onto SQS, a Lambda picked it up, Textract pulled the text out, and the result went into OpenSearch. Cognito handled authentication, CloudFront sat in front, SES carried the notifications for the review step that documents passed through before becoming visible to everyone.

**As first built: the asynchronous ingest path, before it was cut for cost.** researcher → cloudfront (upload). cloudfront → vue app: cognito auth. vue app: cognito auth → s3: document store (put object). vue app: cognito auth → dynamodb: metadata (write record). s3: document store connects loosely to sqs: ingest queue (event). sqs: ingest queue → lambda: ingest worker. lambda: ingest worker → textract (extract text). lambda: ingest worker → opensearch (index). lambda: ingest worker → ses (notify). vue app: cognito auth → opensearch (query).

## And then it came out again

The extraction pipeline did not survive to launch, and that was a decision, not an accident. SQS, Lambda, and Textract came out before final deployment, and the extraction folded back into the application itself: the same work done synchronously in the upload path instead of fanned out to a queue and a serverless worker. OpenSearch, Cognito, DynamoDB, S3, SES, and the CloudFront edge all stayed.

The queue-behind-the-upload reasoning above is a sound _pattern_, and I’d make the same argument again for a system under real upload pressure. This wasn’t that system. Expected concurrency was low enough that a single upload could carry the extraction cost inline without anyone waiting on a queue, and standing up SQS, a Lambda, and per-page Textract calls to serve that load was infrastructure the budget didn’t need to buy. So the shipped version was smaller than the one I first drew: right-sized to the load and the cost constraint, not beaten by them. I’d still rather record that the architecture that ran differed from the one I designed, and why, than present the drawing as the thing that shipped. As the sole developer, that call was mine to make.

## Where it went

It shipped, and it went into use. Then it got rebuilt properly.

When the internship converted into the infrastructure role at the same company, this platform became one of the largest of the seven I was responsible for, re-expressed as a nine-stack nested CloudFormation architecture, with the VPC, the autoscaling compute tier behind an ALB, the WAF-fronted CloudFront edge, the Cognito pool, the DynamoDB tables, the SES identity, and the OpenSearch domain moved inside the VPC. Same system, no longer assembled by clicking. That rebuild is CASE 07, and it’s the reason I have templates for this platform and no console screenshots worth anything.

## What this wasn’t

It wasn’t infrastructure as code. Every resource was created by hand in the console, with nothing version-controlled below the application layer. And the system that ran wasn’t the one I first drew: the SQS, Lambda and Textract extraction pipeline came out before launch, and extraction folded back into the upload path. What shipped was right-sized to its load, and smaller than the design.

## What I’d change

I’d build it as code from the first resource. Clicking it together in the console was the fastest way for an intern to ship, and it did ship, but it left nothing to review, repeat or roll back. The role that came next started by re-expressing the whole platform as nine nested CloudFormation stacks; starting there would have made that rebuild a refactor instead.
