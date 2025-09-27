# Pulumi setup to publish web-build artifact to S3 + CloudFront

Goal: Use Pulumi to provision the infra (private S3 + CloudFront with OAC) and wire your GitHub workflow to push the web-build artifact to S3 and publish via a public CloudFront URL.

Prereqs

- Pulumi CLI installed and logged in to your Pulumi backend.
- AWS account with permissions to create S3, CloudFront, IAM.
- Node.js workspace with Pulumi AWS packages available.

1. Create a Pulumi project for the web

- Create a new Pulumi project directory (e.g., infra/web).
- Initialize a TypeScript AWS project (aws-typescript).
- Plan resources:
  - S3 bucket: private, all public access blocked, server-side encryption enabled (SSE-S3 is fine).
  - CloudFront distribution with:
    - Origin: the S3 bucket using Origin Access Control (OAC) and SigV4.
    - Default root object: index.html.
    - Compression enabled.
    - Custom error responses mapping 403/404 to /index.html (SPA).
    - Viewer certificate: default CloudFront certificate (\*.cloudfront.net) to start.
- Export outputs needed by CI:
  - bucketName
  - bucketRegion
  - cloudFrontDistributionId
  - cloudFrontDomainName

2. Configure Pulumi stacks

- Create stacks for each environment (e.g., dev, staging, prod).
- Set stack configs:
  - aws:region (e.g., us-east-1 or your chosen region)
  - Any optional project-specific configs (like naming suffixes).
- Deploy:
  - pulumi up for each stack.
- After creation, note the outputs:
  - bucketName
  - bucketRegion
  - cloudFrontDistributionId
  - cloudFrontDomainName

3. IAM role for GitHub OIDC (least privilege)

- Create an IAM role trusted by GitHub OIDC for your repository and environment.
  - Trust policy allows sts:AssumeRoleWithWebIdentity from the GitHub OIDC provider
    with conditions restricting to your repo and environment.
- Attach a permissions policy that grants:
  - s3:ListBucket on arn:aws:s3:::YOUR_BUCKET
  - s3:PutObject, s3:DeleteObject on arn:aws:s3:::YOUR_BUCKET/\*
  - cloudfront:CreateInvalidation on the target distribution
- Save the role ARN to use in GitHub.

4. GitHub environment configuration (per env)

- Secrets:
  - AWS_ROLE_TO_ASSUME: the role ARN created above.
- Variables:
  - AWS_REGION: the region of your S3 bucket.
  - WEB_BUCKET: Pulumi output bucketName.
  - CLOUDFRONT_DISTRIBUTION_ID: Pulumi output cloudFrontDistributionId.
  - VITE\_\* and any other build-time vars your web app needs.

5. CI/CD flow (build + deploy)

- Build job:
  - Install deps, build the web app, and upload the dist folder as a named artifact (e.g., web-dist).
- Deploy job:
  - Configure AWS credentials with aws-actions/configure-aws-credentials using the OIDC role and region var.
  - Download the web-dist artifact.
  - Sync to S3:
    - Upload all assets with aggressive caching:
      - assets/\* => Cache-Control: public, max-age=31536000, immutable
    - Ensure index.html is uploaded with no-cache/no-store:
      - index.html => Cache-Control: no-cache, no-store, must-revalidate
    - A common pattern is:
      1. Sync everything with a default cache for assets.
      2. Re-copy index.html with override headers to disable caching.
  - CloudFront invalidation:
    - Invalidate at least: /, /index.html, and /assets/_ (or /_ for simplicity).
- After deploy, your site is available at the CloudFront domain exposed by Pulumi outputs.

6. Verify

- Open https://CLOUDFRONT_DOMAIN_NAME/ (from Pulumi output).
- Check headers:
  - index.html must have no-cache/no-store.
  - assets should have long-lived immutable cache.
- Ensure responses come from CloudFront (check response headers).

7. Troubleshooting

- 403 from CloudFront:
  - The S3 bucket must be private; access should be allowed only via OAC.
  - Confirm bucket policy includes permissions allowing CloudFront (OAC) to GetObject.
- SPA routing returns 404:
  - Confirm CloudFront custom error responses rewrite 403/404 to /index.html with 200.
- Stale content:
  - Confirm index.html deployed with no-cache/no-store.
  - Confirm invalidation runs after upload.

8. Public URL and custom domain

- Start by using the default CloudFront domain from the outputs.
- For a custom domain later:
  - Request an ACM certificate in us-east-1 for your domain.
  - Add the domain as an Alternate Domain Name (CNAME) to the distribution and attach the certificate.
  - Create a Route53 alias record pointing the subdomain to CloudFront.

9. Minimal checklist to complete

- Pulumi:
  - Project created and deployed (S3, CloudFront OAC).
  - Outputs captured.
- IAM:
  - GitHub OIDC role created with minimal S3 + CloudFront permissions.
- GitHub:
  - Environment-level secrets and vars added.
  - Build uploads artifact; deploy downloads it, syncs to S3, invalidates CloudFront.
- Validate by visiting the CloudFront domain and checking caching behavior.

AWS Create order :::

Here’s the clean, safe order. You can do it all in the AWS console first, then wire up GitHub.
Phase A — Infra (once)

1. Create S3 bucket for the site

- Private, block all public access.

1. Create CloudFront distribution

- Origin = the S3 bucket using OAC (Origin Access Control).
- Default root object = index.html.
- Optional: custom errors 403/404 -> /index.html (for SPA).

Phase B — IAM for GitHub OIDC (keyless deploy)

1. Add GitHub OIDC identity provider (once per account)

- IAM > Identity providers > Add provider
- Type: OpenID Connect
- URL: [https://token.actions.githubusercontent.com](https://token.actions.githubusercontent.com)
- Audience: sts.amazonaws.com

1. Create the deploy policy (customer-managed)

- IAM > Policies > Create policy (JSON)
- Grant:
  - s3:ListBucket on arn:aws:s3:::YOUR_BUCKET
  - s3:PutObject, s3:DeleteObject on arn:aws:s3:::YOUR_BUCKET/\*
  - cloudfront:CreateInvalidation on arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID

1. Create the role (web identity) for GitHub Actions

- IAM > Roles > Create role
- Trusted entity: Web identity
- Provider: token.actions.githubusercontent.com
- Audience: sts.amazonaws.com
- Create role (you can skip attaching permissions here if you prefer).
- Open the role > Attach the deploy policy from step 4.
- Edit trust policy to restrict to your repo and env/branch via sub condition (e.g., repo:OWNER/REPO:environment:prod or repo:OWNER/REPO:ref:refs/heads/main).

Phase C — GitHub wiring

1. Add GitHub Environment and secrets/vars

- In your repo > Settings > Environments > create env(s) (dev/staging/prod).
- Secrets:
  - AWS_ROLE_TO_ASSUME = ARN of the role from step 5.

- Variables:
  - AWS_REGION = bucket’s region
  - WEB_BUCKET = your bucket name
  - CLOUDFRONT_DISTRIBUTION_ID = your distribution ID

Phase D — Deploy

1. Run your GitHub workflow

- It should:
  - Configure AWS via aws-actions/configure-aws-credentials using AWS_ROLE_TO_ASSUME + AWS_REGION.
  - Download the build artifact.
  - Upload to S3 (assets long cache; index.html no-cache).
  - Create CloudFront invalidation.

1. Verify

- Visit the CloudFront domain.
- Confirm headers (index.html no-cache; assets immutable) and content updates after invalidation.

Tip on order confusion:

- Policy before role is convenient but not required. If you already created the role, just create the policy now and attach it to that role. The key is: identity provider → role (trust) → attach policy → use role in GitHub.
