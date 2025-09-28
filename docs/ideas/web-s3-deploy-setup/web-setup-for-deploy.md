# Web static site: single plan (Pulumi-first)

Goal

- Manage S3 + CloudFront with Pulumi so stacks are easy to create/destroy without leaking costs.
- Deploy web build artifacts from GitHub Actions to S3 and serve via CloudFront.

Scope

- No custom domain initially; use the default CloudFront domain.
- Private S3 bucket, CloudFront uses Origin Access Identity (OAI) to read from S3. (You can migrate to CloudFront OAC later.)

Useful Tags
Create all resources with these tags:

- project: gitcraft
- component: web
- environment: dev | staging | prod
- owner: <your-name>
- managed-by: manual | pulumi | github-actions
- purpose: static-site

Checklist (do in order)

A) One-time AWS account setup (manual)

- [x] A1. Add GitHub OIDC identity provider
  - IAM > Identity providers > Add provider
  - Type: OpenID Connect; URL: https://token.actions.githubusercontent.com; Audience: sts.amazonaws.com

- [x] A2. Create a deploy policy (customer-managed) with least privilege
      Purpose: allow GitHub Actions to upload to S3 and create CloudFront invalidations.
      Steps (Console):
  1. Go to IAM > Policies > Create policy.
  2. Choose the JSON tab and paste the policy below.
  3. Replace BUCKET_NAME, ACCOUNT_ID, and DISTRIBUTION_ID as appropriate. If you don’t know them yet, use one of the options under “When ARNs are unknown” below.
     a) Add TODO somewhere for this
  4. Next, name it something like GithubWebDeployPolicy, add a description, Create policy.

  Example policy (tight-scoped):
  {
  "Version": "2012-10-17",
  "Statement": [
  {
  "Sid": "ListBucket",
  "Effect": "Allow",
  "Action": ["s3:ListBucket"],
  "Resource": "arn:aws:s3:::BUCKET_NAME"
  },
  {
  "Sid": "PutDeleteObjects",
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:DeleteObject"],
  "Resource": "arn:aws:s3:::BUCKET_NAME/\*"
  },
  {
  "Sid": "InvalidateCF",
  "Effect": "Allow",
  "Action": ["cloudfront:CreateInvalidation"],
  "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
  }
  ]
  }

  Temporary broad policy (to be tightened later):
  {
  "Version": "2012-10-17",
  "Statement": [
  {
  "Sid": "S3List",
  "Effect": "Allow",
  "Action": ["s3:ListBucket"],
  "Resource": "_"
  },
  {
  "Sid": "S3PutDelete",
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:DeleteObject"],
  "Resource": "_"
  },
  {
  "Sid": "CFInvalidate",
  "Effect": "Allow",
  "Action": ["cloudfront:CreateInvalidation"],
  "Resource": "\*"
  }
  ]
  }

  When ARNs are unknown (because Pulumi will create them), choose ONE:
  - Option A (most convenient): Create the temporary broad policy now (Resource: "_"), attach it to the role, run Pulumi to create the bucket/distribution, then edit this policy to replace "_" with the exact ARNs from Pulumi outputs.
  - Option B (strict): Create the role first without permissions. Run Pulumi. Come back and create/attach the tight-scoped policy with the real ARNs.
  - Option C (fully managed by Pulumi): Define the IAM policy and role in Pulumi too, using Pulumi to reference the bucket/distribution it creates. You’ll still need to run Pulumi locally with your own AWS creds the first time to bootstrap.

  Notes:
  - Pulumi creates the S3 bucket and CloudFront distribution; that’s why ARNs may be unknown at this step.
  - For cloudfront:CreateInvalidation, some accounts/UIs may not accept a distribution ARN as a Resource. If you get a warning that the action doesn’t support resource-level permissions, set "Resource": "\*" for that statement.
  - ACCOUNT_ID is shown at the top-right of the AWS Console. Distribution ID is on the CloudFront distribution page.

- [x] A3. Create a GitHub Actions role (Web identity)
      Purpose: let GitHub Actions assume a role via OIDC to get short-lived AWS credentials (no static keys).
      Steps (Console):
  1. IAM > Roles > Create role.
  2. Trusted entity type: Web identity.
  3. Identity provider: token.actions.githubusercontent.com; Audience: sts.amazonaws.com.
  4. Permissions: Attach the policy you created in A2 (e.g., GithubWebDeployPolicy).
  5. Name: something like github-oidc-web-deploy-dev (per environment). Create role.
  6. Open the new role > Trust relationships > Edit trust policy. Replace OWNER, REPO, ENVIRONMENT, ACCOUNT_ID as needed. Use one of the examples:

  Environment-scoped trust (recommended if using GitHub Environments):

- // FYI, Dsmurl chose this one
  {
  "Version": "2012-10-17",
  "Statement": [
  {
  "Effect": "Allow",
  "Principal": {
  "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
  "StringEquals": {
  "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
  },
  "StringLike": {
  "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:environment:ENVIRONMENT"
  }
  }
  }
  ]
  }

  Branch-scoped trust (if not using Environments):
  {
  "Version": "2012-10-17",
  "Statement": [
  {
  "Effect": "Allow",
  "Principal": {
  "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
  "StringEquals": {
  "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"

- "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main"
  }
  }
  }
  ]
  }

7. [x] Save. Copy the Role ARN; add it to your GitHub Environment secret AWS_ROLE_TO_ASSUME.
       Optional:

- Adjust Maximum session duration on the role (e.g., 1 hour). // 1 hour is default
- To allow multiple environments/branches, you can add multiple StringLike patterns or combine with StringEquals in an array.

Note: A2 and A3 are one-time manual bootstrap steps. Pulumi will create and manage the S3 bucket and CloudFront distribution. You can also define IAM with Pulumi, but bootstrapping OIDC access via the console is simpler and avoids storing elevated credentials in CI.

B) Provision infra with Pulumi (per environment)

- [ ] B1. Configure Pulumi stack (aws:region, tags, cache TTLs)
  The goal is to set per-environment config that your Pulumi program reads.
  Run these from the apps/infra folder after selecting/creating the stack (e.g., dev):

  1) Select or create the stack
     - pulumi stack select dev
       (or) pulumi stack init dev

  2) Set the AWS region for this stack
     - pulumi config set aws:region us-west-2
       Use your preferred region.

  3) Set cache TTLs for the site
     - pulumi config set infra:web.cacheTtls.staticSeconds 604800
     - pulumi config set infra:web.cacheTtls.htmlSeconds 60
       staticSeconds: for assets (long cache); htmlSeconds: for HTML (short cache).
       These pair with your deploy headers so index.html stays fresh and assets are immutable.

  4) Set feature flags (optional)
     - pulumi config set infra:web.create true
     - pulumi config set infra:api.createEcr false
     - pulumi config set infra:secrets.create false
       Adjust to your needs per environment.

  5) Tags (helpful for cost/ops). Use --path to build a map:
     - pulumi config set --path 'infra:tags.project' gitcraft
     - pulumi config set --path 'infra:tags.component' web
     - pulumi config set --path 'infra:tags.environment' dev
     - pulumi config set --path 'infra:tags.managed-by' pulumi
     - pulumi config set --path 'infra:tags.owner' your-name

  6) Optional: control S3 versioning from config
     - pulumi config set infra:web.enableVersioning false
       Set to true if you want versioning. You can change this later per env.

  Notes:
  - These commands write to Pulumi.<stack>.yaml. You can also edit the YAML directly.
  - Your current config keys (infra:web.cacheTtls.* and infra:tags) are fine; this just standardizes how to set them.

- [ ] B2. Create resources with Pulumi:
  - S3 bucket
    - Private; Block all public access (Public Access Block)
    - ACLs disabled (Bucket owner enforced)
    - Default encryption: SSE-S3
    - Versioning: optional (config-driven)
    - Tags: Project, Component=web, Environment, ManagedBy=pulumi, Owner
  - CloudFront distribution
    - Origin: S3 with OAI
    - Default root object: index.html
    - Viewer protocol: redirect-to-https
    - Compress enabled; PriceClass_100
    - SPA support: custom error responses (403/404 -> /index.html, response 200)
    - TLS: default CloudFront certificate (\*.cloudfront.net)

- [ ] B3. Export outputs from Pulumi
  - bucketName
  - bucketRegion
  - cloudFrontDistributionId
  - cloudFrontDomainName

Do my Pulumi files need changes?
- Your component is close. Suggested improvements applied:
  - S3: enforce Public Access Block (block/ignore public ACLs and policies).
  - S3: default encryption (SSE-S3).
  - S3: optional versioning controlled by config infra:web.enableVersioning.
  - S3: bucket ownership controls set to BucketOwnerEnforced (disables ACLs).
  - CloudFront: enable compression.
  These align the stack to the plan; behavior remains the same otherwise.

C) Wire GitHub environment (per environment)

- [ ] C1. Create or select GitHub Environment (dev/staging/prod)
- [ ] C2. Add secrets
  - AWS_ROLE_TO_ASSUME = ARN of the role from A3
  - Any build-time secrets (e.g., VITE_CLERK_PUBLISHABLE_KEY)
- [ ] C3. Add variables
  - AWS_REGION = bucket’s region
  - WEB_BUCKET = Pulumi output bucketName
  - CLOUDFRONT_DISTRIBUTION_ID = Pulumi output cloudFrontDistributionId
  - Other build-time vars (e.g., VITE_API_URL)

D) Deploy from GitHub Actions

- [ ] D1. Build job: produce the web artifact (dist) and upload as an artifact (e.g., web-dist)
- [ ] D2. Deploy job:
  - Assume AWS role via aws-actions/configure-aws-credentials (OIDC)
  - Download artifact
  - Upload to S3 with proper cache headers:
    - assets/\* => Cache-Control: public, max-age=31536000, immutable
    - index.html => Cache-Control: no-cache, no-store, must-revalidate; Content-Type: text/html
  - Invalidate CloudFront: at least /index.html and / (optionally /assets/\*)

E) Verify

- [ ] E1. Open https://CLOUDFRONT_DOMAIN_NAME/ from Pulumi outputs
- [ ] E2. Check headers in browser devtools:
  - index.html: no-cache/no-store
  - assets: long-lived immutable cache
- [ ] E3. Confirm responses are served via CloudFront

Troubleshooting

- 403/AccessDenied from CloudFront
  - Ensure S3 bucket is private and bucket policy allows the CloudFront OAI to s3:GetObject on bucket/\*
  - Confirm the distribution origin points to the correct bucket domain
- SPA routes 404
  - Ensure custom error responses (403/404 -> /index.html with 200)
- Stale content
  - Verify index.html uploaded with no-cache headers
  - Ensure CloudFront invalidation runs after upload

Teardown (per environment)

- [ ] T1. pulumi destroy (removes S3 bucket, bucket policy, OAI, CloudFront distribution)
- [ ] T2. Optional: remove GitHub env vars/secrets and IAM role/policy if the environment is retired

Naming & tags (recommendations)

- Bucket naming: <project>-web-<env>[-<account>-<region>] (e.g., gitcraft-web-dev or gitcraft-web-prod-123456789012-us-east-1)
- Tags: Project=gitcraft, Component=web, Environment=dev|staging|prod, ManagedBy=pulumi, Owner=<you>

Notes

- OAI works well and matches current setup; you can migrate to CloudFront OAC later for the newer pattern.
- Keep the bucket private and never expose it publicly; CloudFront is your public entry point.
