Pulumi AWS Deployment Plan (Web + API)
STATUS:

- RESEARCH
- would be a strong long term choice
- could be expensive and long developement path
- is very enterprise

Executive Summary

- Goal: Deploy the web (React) and API (Express) apps to AWS using Pulumi (TypeScript) with secure, scalable, observable, and cost-aware infrastructure, supporting multiple environments (dev/stage/prod).
- Core: VPC (multi-AZ), ECS Fargate + ALB for API, ECR for images, RDS PostgreSQL for data (via Prisma), S3 + CloudFront for web static hosting, Secrets Manager/SSM for secrets/config, Route53 + ACM for DNS/SSL, GitHub Actions CI/CD with Pulumi.
- Alternatives to consider to simplify ops/cost: AWS App Runner (instead of ECS), or Lambda + API Gateway (instead of ALB/ECS) with an Express adapter.

High-Level Architecture

- Networking
  - VPC spanning 2–3 AZs.
  - Public subnets: ALB and NAT (if using private workloads).
  - Private subnets: ECS tasks and RDS.
  - NAT gateways: allow ECS tasks to reach the internet (e.g., NPM, Clerk) without being publicly exposed.
  - VPC endpoints (optional but recommended): S3, CloudWatch Logs, ECR for private connectivity and reduced NAT costs.
- API (Express)
  - Containerized (Docker) Node.js app.
  - Deployed on ECS Fargate in private subnets behind an Application Load Balancer (HTTP/HTTPS).
  - AutoScaling policies based on CPU/Memory and optionally ALB Target Response Time.
  - CloudWatch Logs for stdout/stderr, health checks via /health.
  - Environment variables and secrets via AWS Secrets Manager/SSM Parameter Store.
- Database
  - RDS PostgreSQL (multi-AZ on production). Automated backups, parameter group if needed.
  - Security groups: only accept traffic from ECS tasks’ security group.
  - Prisma migrations executed via CI/CD one-off job/task before or during deploy.
- Web (React)
  - Built as static assets (production build).
  - Hosted on S3 (private bucket).
  - Served via CloudFront with Origin Access Control (OAC) or Origin Access Identity (OAI).
  - Custom domain and TLS via ACM (us-east-1 for CloudFront certs).
  - Cache policies: long TTLs for hashed assets, short TTL for index.html.
- DNS + Certificates
  - Route53 hosted zone for domain.
  - ACM certs for ALB (regional) and CloudFront (us-east-1).
  - Aliases from Route53 to CloudFront and ALB.
- Observability + Ops
  - CloudWatch Logs for ECS tasks and ALB access logs to S3 (optional).
  - CloudWatch Alarms (API 5xx, CPU/Memory high, RDS metrics).
  - Optional: AWS X-Ray for distributed traces, structured logging, metrics via CloudWatch Embedded Metric Format.
- Security
  - Least-privilege IAM roles for ECS tasks.
  - Secrets in Secrets Manager; never commit secrets.
  - Security groups with minimal ingress rules (ALB -> ECS, ECS -> RDS).
  - S3 bucket private, only CloudFront can read (via OAC/OAI).
  - TLS everywhere (ACM). HSTS on CloudFront.
- Cost Awareness
  - NAT gateways are a large fixed cost. Consider:
    - App Runner or Lambda for API to avoid NAT cost.
    - VPC endpoints to reduce NAT data processing.
    - Scale down dev/stage (smaller RDS instance, single-AZ).
  - CloudFront cache optimization reduces S3/Origin cost.

Pulumi Project Structure (TypeScript)

- Repo structure suggestion
  - pulumi/
    - package.json (pulumi, @pulumi/aws, @pulumi/awsx, @pulumi/docker, etc.)
    - Pulumi.dev.yaml, Pulumi.stage.yaml, Pulumi.prod.yaml (stack configs)
    - index.ts (entry)
    - components/
      - vpc.ts (VPC, subnets, NAT, endpoints)
      - rds.ts (Postgres + subnet group + SG)
      - ecr.ts (ECR repositories)
      - ecs-service.ts (ALB, TG, Listener, ECS Cluster/Service/Task)
      - web-static-site.ts (S3 + CloudFront + ACM + Route53 records)
      - dns.ts (hosted zone + records)
      - secrets.ts (helper to read/define Secrets Manager/SSM parameters)
- Pulumi stacks
  - dev, stage, prod with config-specific values (domains, instance sizes, CIDRs, scaling min/max, etc.).
  - Sensitive data set via pulumi config set --secret.
- Component responsibilities
  - VpcComponent: create VPC, public/private subnets across AZs, route tables, NAT gateways, endpoints (optional).
  - RdsComponent: create Postgres instance/cluster (prod: multi-AZ), subnet group in private subnets, SG rules.
  - EcrComponent: create ECR repos for api (and additional services if needed).
  - EcsServiceComponent: ECS Cluster, Task Definition, Service, CloudWatch log groups, IAM task roles, ALB + Listener + Target Group, scaling.
  - WebStaticSiteComponent: S3 private bucket, CloudFront distribution, OAC/OAI, ACM cert in us-east-1, Route53 DNS.
  - DnsComponent: zone creation/lookup and records for api and web.
  - SecretsComponent: define or lookup Secrets Manager entries; wire into ECS task definition env.

Suggested Pulumi Resources (Mapping)

- Networking
  - awsx.ec2.Vpc (or hand-rolled aws.ec2.\* resources for full control)
  - aws.ec2.SecurityGroup for ALB, ECS, and RDS
- API
  - aws.ecr.Repository for container images
  - aws.ecs.Cluster, aws.ecs.TaskDefinition, aws.ecs.Service (Fargate)
  - aws.lb.LoadBalancer, aws.lb.TargetGroup, aws.lb.Listener
  - aws.cloudwatch.LogGroup
- Web
  - aws.s3.Bucket (private)
  - aws.cloudfront.Distribution
  - aws.acm.Certificate, aws.acm.CertificateValidation (us-east-1 provider alias)
  - aws.route53.Record
- Database
  - aws.rds.Instance or aws.rds.Cluster (Aurora Postgres)
  - aws.rds.SubnetGroup
- Secrets/Config
  - aws.secretsmanager.Secret and SecretVersion
  - aws.ssm.Parameter (if desired)

Environment and Secrets (Examples)

- API (ECS task env)
  - NODE_ENV=production
  - PORT=3001
  - WEB_ORIGIN=https://your-web-domain.tld
  - DATABASE_URL (from Secrets Manager)
  - CLERK_SECRET_KEY (from Secrets Manager)
  - Any third-party keys (from Secrets Manager)
- Web (build-time)
  - VITE_API_ORIGIN=https://api.your-domain.tld (used at build time)
  - Any public keys prefixed for the build tool if applicable
- Pulumi config keys (examples)
  - vpc.cidr: 10.0.0.0/16
  - vpc.azCount: 2 or 3
  - domain.zoneName: your-domain.tld
  - domain.webSubdomain: app (app.your-domain.tld)
  - domain.apiSubdomain: api (api.your-domain.tld)
  - rds.engineVersion: 16.x
  - rds.instanceClass: db.t4g.small (dev) / db.t3.medium+ (prod)
  - rds.allocatedStorage: 20–100+
  - api.cpu/memory: Fargate task sizes
  - api.desiredCount/min/max: scaling config
  - web.cacheTtls: { static: 7d+, html: 60s }
  - certs.emailValidation or DNS validation settings

CI/CD (GitHub Actions + Pulumi)

- Secrets in GitHub
  - AWS credentials (role-based with OIDC recommended).
  - PULUMI_ACCESS_TOKEN (GitHub App or personal access token).
  - Any build-time secrets (avoid, prefer Pulumi-managed infra to hold runtime secrets).
- Pipeline outline
  - On push to main (prod) or to specific branches (dev/stage):
    1. Build web: npm ci && build; upload artifacts; Pulumi step syncs web assets to S3; then CloudFront invalidation for index.html and changed paths.
    2. Build API image: docker build; tag; login to ECR; push.
    3. Pulumi up:
       - If first time, infra is created (VPC, RDS, ECS, ALB, S3, CF, etc.).
       - On updates: new API image digest is injected into Task Definition; ECS service is updated (rolling/blue-green).
       - Run DB migrations: one-off ECS task with the new image to run npx prisma migrate deploy (guarded to run only once per deploy).
       - Invalidate CloudFront cache for web (index.html at minimum).
- Rollbacks
  - ECS: rollback to previous task definition revision (automated if health checks fail).
  - Database: ensure migrations are backward compatible or have a rollback plan.
  - Pulumi: use stack history to pinpoint infra changes.

Deployment Steps (Initial Bring-Up)

1. Prerequisites

- AWS account, Route53 zone for your domain.
- Register/acquire domain if needed.
- Clerk production keys and configuration ready.
- Create Pulumi org and access token; set up GitHub OIDC to assume an AWS role.

2. Containerize API

- Add a Dockerfile for the API (multi-stage build for small runtime image).
- Local test: docker run -p 3001:3001 … and ensure /health works.

3. Create Pulumi Project

- pulumi new aws-typescript (or initialize a custom TypeScript project).
- Add @pulumi/aws, @pulumi/awsx, @pulumi/docker if using Docker builds; consider building in CI instead and using ECR-only in Pulumi (less coupling).

4. Networking + Base Infra

- Provision VPC, subnets, route tables, NAT gateways, endpoints (optional).
- Create Security Groups for ALB, ECS, and RDS with least-privilege rules.

5. RDS PostgreSQL

- Create subnet group in private subnets.
- Provision DB, set master credentials via Secrets Manager.
- Output DATABASE_URL as a secret Pulumi output for reference (do not log).

6. ECR + ECS + ALB

- Create ECR repository for api.
- Create IAM roles for task execution and task.
- Create CloudWatch Log Group for api.
- Define Task Definition with environment and secrets (CLERK_SECRET_KEY, DATABASE_URL).
- Create ALB, Target Group, HTTPS Listener (ACM cert), security groups.
- Create ECS Service in private subnets; attach to Target Group; health check /health.

7. Web Static Hosting

- Create S3 bucket (private).
- Create ACM cert in us-east-1 for CloudFront.
- Create CloudFront distribution with S3 origin using OAC/OAI.
- Set cache policies (long TTL for hashed assets, short for index.html).

8. DNS

- Create Route53 records for web and api pointing to CloudFront and ALB respectively.

9. CI/CD

- Add GitHub Actions workflows:
  - Build and push API image to ECR.
  - Pulumi up for stack (dev/stage/prod).
  - Sync web build to S3 and invalidate CloudFront.
  - One-off DB migration task execution.

10. Validation

- Smoke tests for /health and a protected API route.
- End-to-end test with the web front end hitting the deployed API.

11. Scaling + Hardening

- Set ECS service scaling policies and min/max capacities.
- Add alarms (5xx rates, CPU/Memory, RDS connections).
- Enable ALB access logs to S3; consider X-Ray and structured logs.

12. Cost Review

- Evaluate NAT costs, consider VPC endpoints.
- Consider App Runner for API as a simpler alternative (auto builds/deployments, HTTPS, autoscaling).
- Consider Lambda + API Gateway if traffic is spiky and latency budget fits.

Alternative Deploy Options (Tradeoffs)

- App Runner
  - Pros: Simplified ops, HTTPS, autoscaling, logs; no VPC/NAT complexity if using public DB proxy or managed services.
  - Cons: VPC connector and private DB access add complexity; pricing vs ECS depends on load.
- Lambda + API Gateway
  - Pros: Pay-per-use, no servers to manage, can be cheap at low traffic.
  - Cons: Requires adapting Express (performance and cold starts to consider); WebSockets/stateful patterns need care.
- Elastic Beanstalk
  - Pros: Simplified environment management.
  - Cons: Less granular control than ECS; older patterns.

Security Best Practices

- Use Pulumi secrets for sensitive config; wire them into Secrets Manager.
- Rotate credentials; do not bake secrets into images or commit to repo.
- Lock down security groups; ALB is public, ECS and RDS are private.
- Enforce TLS 1.2/1.3; HSTS on CloudFront; secure cookies set by API.
- Principle of least privilege IAM roles for ECS tasks and CI/CD.

Rollout Strategy

- Blue/green or canary on ECS:
  - Use CodeDeploy or weighted target groups with ALB for controlled rollout.
- Database migrations:
  - Backward-compatible migrations first; deploy new app; remove old code in follow-up release.

Local Dev Parity

- docker-compose for API + Postgres for local testing (optional).
- Keep environment variables aligned (dev .env files vs Pulumi stack configs).

Next Steps Checklist

- Add Dockerfile for API and confirm local run.
- Initialize Pulumi project and dev stack.
- Implement VPC, RDS, and ECS ALB service components.
- Set up ECR and CI pipeline for image push.
- Add S3 + CloudFront for web and hook up domain + certs.
- Finish Route53 records and secrets wiring.
- Stand up dev environment end-to-end; run smoke/E2E tests.
- Iterate on autoscaling, alarms, logging, and cost optimizations.
