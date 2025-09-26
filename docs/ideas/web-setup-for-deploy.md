Outside-the-code setup you need to do:

- [ ] 1. Create/verify infrastructure
  - [ ] 1.1 S3 bucket: private, block all public access. This is where the site will be uploaded.
  - [ ] 1.2 CloudFront distribution:
    - [ ] 1.2.1 Origin is the S3 bucket with Origin Access Control (OAC).
    - [ ] 1.2.2 Default root object set to index.html.
    - [ ] 1.2.3 Enable compression.
    - [ ] 1.2.4 Custom error responses mapping 403/404 to /index.html (for SPA routing).
    - [ ] 1.2.5 TLS: Use the Default CloudFront certificate (\*.cloudfront.net) for now (no ACM needed).
  - [ ] 1.3 Note the CloudFront domain name (e.g., dxxxxxxxxxxxxx.cloudfront.net) to access your site.
  - [ ] 1.4 Skip Route53 and ACM until you have a custom domain.

- [ ] 2. Create an IAM role for GitHub OIDC with least-privilege permissions
  - [ ] 2.1 Trust policy: allow sts:AssumeRoleWithWebIdentity from GitHub OIDC for your repo and environment (ref: aws-actions/configure-aws-credentials OIDC docs).
  - [ ] 2.2 Permissions policy:
    - [ ] 2.2.1 s3:ListBucket on arn:aws:s3:::YOUR_BUCKET
    - [ ] 2.2.2 s3:PutObject, s3:DeleteObject on arn:aws:s3:::YOUR_BUCKET/\*
    - [ ] 2.2.3 cloudfront:CreateInvalidation on the target distribution

- [ ] 3. Add environment-scoped secrets/vars in GitHub (per dev/staging/prod)
  - [ ] 3.1 Secrets:
    - [ ] 3.1.1 AWS_ROLE_TO_ASSUME: arn of the IAM role you created
    - [ ] 3.1.2 VITE_CLERK_PUBLISHABLE_KEY: existing secret for your front-end
  - [ ] 3.2 Variables:
    - [ ] 3.2.1 AWS_REGION: AWS region of your bucket (for example, us-east-1 or your chosen region)
    - [ ] 3.2.2 WEB_BUCKET: name of the S3 bucket hosting the static site
    - [ ] 3.2.3 CLOUDFRONT_DISTRIBUTION_ID: the distribution ID to invalidate
    - [ ] 3.2.4 VITE_API_URL: existing var for your API base URL

- [ ] 4. Run the workflow
  - [ ] 4.1 From the Actions tab, run “Web Build and Deploy (S3 + CloudFront)” with environment set to dev/staging/prod.
  - [ ] 4.2 Confirm the deployment by visiting your CloudFront domain (https://YOUR_DISTRIBUTION_DOMAIN/). Use browser devtools Network panel to verify:
    - [ ] 4.2.1 index.html has Cache-Control: no-cache/no-store
    - [ ] 4.2.2 assets have Cache-Control: max-age=31536000, immutable
    - [ ] 4.2.3 Responses are served by CloudFront.

Notes

- [ ] 5.1 Re-running the workflow redeploys the latest build and refreshes index.html via CloudFront invalidation.
- [ ] 5.2 If you later need runtime-configurable values, consider a small window.**CONFIG** injection at deploy time; for now, VITE\_ vars are baked at build.

When you later add a custom domain:

- [ ] 6.1 Request an ACM certificate in us-east-1 for your web domain (and alternate names).
- [ ] 6.2 Update your CloudFront distribution to add the domain as an Alternate Domain Name (CNAME) and attach the ACM certificate.
- [ ] 6.3 Create a Route53 alias record pointing the web subdomain to the CloudFront distribution.
