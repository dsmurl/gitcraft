Entry-Level AWS Deployment Plan with Pulumi (Web + API + Turso)

Goals and Constraints
- Launch quickly with minimal fixed cost and simple operations.
- Use Turso (SQLite/libsql) as the database over HTTPS (no VPC/NAT required).
- Keep a clean upgrade path to more advanced AWS networking when needed.
- Infrastructure as Code with Pulumi (TypeScript), CI/CD via GitHub Actions.

High-Level Architecture
- Web (React): S3 + CloudFront
  - Store static build in an S3 bucket (private).
  - Serve via CloudFront with Origin Access Control (OAC).
  - TLS via ACM (certificate in us-east-1).
- API (Express/Node): AWS App Runner
  - Deploy a container (from ECR or GitHub).
  - HTTPS, automatic scaling, health checks at /health.
  - No VPC for first iteration to avoid NAT costs.
- Database: Turso
  - Use @libsql/client over HTTPS.
  - Configure via env: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN.
- Secrets/Config: SSM Parameter Store (SecureString) for cost efficiency.
- DNS/TLS: Route53 + ACM (CloudFront cert in us-east-1, App Runner cert in region).
- CI/CD: GitHub Actions
  - Build web -> upload to S3 -> CloudFront invalidate.
  - Build API image -> push to ECR -> Pulumi updates App Runner service.

Minimal Pulumi Project Structure (TypeScript)
- pulumi/
  - package.json (pulumi, @pulumi/aws, @pulumi/awsx optional, @pulumi/docker optional)
  - Pulumi.dev.yaml / Pulumi.prod.yaml (stack configs; secrets via pulumi config set --secret)
  - index.ts (stack entry)
  - components/
    - web-static-site.ts (S3 bucket, CloudFront, ACM cert, DNS record)
    - apprunner-service.ts (ECR repo optional, App Runner service, env + secrets)
    - dns.ts (optional hosted zone lookup/records)
    - secrets.ts (create/read SSM parameters)

Key Pulumi Resources
- Web:
  - aws.s3.Bucket (private)
  - aws.cloudfront.Distribution (with OAC)
  - aws.acm.Certificate (us-east-1 provider alias for CF)
  - aws.route53.Record (web subdomain -> CloudFront)
- API:
  - aws.ecr.Repository (if building image in CI and pulling from ECR)
  - aws.apprunner.Service (runtime env, health check, CPU/mem)
  - aws.apprunner.CustomDomainAssociation + ACM cert (regional) for api domain
- Secrets:
  - aws.ssm.Parameter (SecureString) for TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, other secrets

API Environment Variables
- NODE_ENV=production
- PORT=3001
- WEB_ORIGIN=https://app.your-domain.tld
- TURSO_DATABASE_URL (SSM SecureString)
- TURSO_AUTH_TOKEN (SSM SecureString)
- Any third-party secrets (SSM SecureString)

Security Practices
- Store secrets in SSM (SecureString) with KMS encryption.
- Use HTTPS for all endpoints; enable HSTS via CloudFront.
- Restrict S3 bucket to CloudFront origin only (OAC).
- Practice least-privilege IAM roles (App Runner access to only required SSM params).

Cost Notes
- No NAT Gateways (major fixed cost) since App Runner is public egress and Turso is public HTTPS.
- S3 + CloudFront: very low fixed cost; pay primarily for bandwidth/requests.
- App Runner: pay for provisioned concurrency/compute + requests; scales with traffic.
- SSM Parameter Store: low-cost for secrets (cheaper than Secrets Manager initially).

Step-by-Step Bring-Up
1) Prerequisites
   - Domain in Route53 (or transfer later).
   - Turso database + auth token (generate a token scoped to your DB).
   - Pulumi account/org and access token; GitHub repo with Actions enabled.
2) Initialize Pulumi (TypeScript)
   - pulumi new aws-typescript in pulumi/ directory.
   - Install @pulumi/aws (+ @pulumi/docker if pushing to ECR from Pulumi, otherwise build in CI).
   - Create dev and prod stacks; set configs (domain, subdomains, email/validation, etc.).
3) Web (S3 + CloudFront)
   - Create private S3 bucket.
   - Request ACM certificate in us-east-1 for the web domain (e.g., app.your-domain.tld).
   - Create CloudFront distribution with OAC to S3; set cache policy (long for assets, short for index.html).
   - Create Route53 record for the web subdomain to CloudFront.
4) API (App Runner)
   - Create ECR repository for api image (or configure GitHub source).
   - Create SSM parameters for TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (SecureString).
   - Create App Runner service:
     - Source: ECR image and tag/digest.
     - Env vars: NODE_ENV, PORT, WEB_ORIGIN; map SSM params as secrets.
     - Health check: /health
   - Request/validate ACM cert (regional) and associate custom domain (api.your-domain.tld) to App Runner.
5) CI/CD (GitHub Actions)
   - Web pipeline:
     - npm ci && npm run build (web)
     - Sync build/ to S3
     - CloudFront invalidation (target index.html and changed assets)
   - API pipeline:
     - Build Docker image; login to ECR; push image with git SHA tag
     - pulumi up to update App Runner service with new image digest
     - Optionally run migrations (if you use a migration tool for Turso)
6) Validation
   - Check https://app.your-domain.tld serves your React app via CloudFront.
   - Check https://api.your-domain.tld/health returns ok.
   - Validate API routes using Turso (ensure envs and auth token are correct).
7) Operations
   - Monitor App Runner logs and metrics.
   - Add CloudWatch alarms (App Runner errors) and CloudFront/S3 metrics alerts as needed.
   - Rotate Turso auth tokens and update SSM when required.

Upgrade Path (When Traffic Grows)
- Add Turso replicas in regions close to your users for latency.
- Add WAF on CloudFront (bots/rate-limiting).
- Shift secrets to Secrets Manager if you need rotation features.
- Move to ECS Fargate for more control, or add App Runner VPC Connector if you later require private AWS resources.

Example Pulumi Config Keys (per stack)
- domain.zoneName: your-domain.tld
- domain.webSubdomain: app
- domain.apiSubdomain: api
- web.cacheTtls.staticSeconds: 604800
- web.cacheTtls.htmlSeconds: 60
- api.cpu: 1 vCPU (App Runner size enum)
- api.memory: 2 GB (App Runner size enum)

Example API Code Snippet (Turso via @libsql/client)
- Initialize once at process start and reuse the client:
  - TURSO_DATABASE_URL + TURSO_AUTH_TOKEN required.
- Use SQL migrations in CI (e.g., drizzle-kit) or a simple SQL runner script.

This plan keeps fixed costs minimal:
- No VPC/NAT
- CDN-cached static site
- Managed container runtime (App Runner)
- Managed, low-cost Turso DB over HTTPS

It also provides clear steps to evolve as usage increases without major rework.
