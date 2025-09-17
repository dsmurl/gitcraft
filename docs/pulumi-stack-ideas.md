This project is a great fit for AWS with Pulumi. You’re in a TypeScript/Nx monorepo, and Pulumi’s TypeScript SDK maps cleanly to how you already work, giving you typed infra, code reviewable changes, and easy promotion across stacks (dev/staging/prod).
Recommended AWS architectures (pick one)

1. Static web + containerized API (most common)

- Web: Build the React app and host it on S3 with CloudFront (cheap, fast, global cache).
- API: Package the Express server as a container and run it on ECS Fargate behind an Application Load Balancer (ALB).
- Sessions: Use ElastiCache Redis via connect-redis for production-grade sessions; avoid in-memory sessions behind multiple tasks.
- TLS and domain: Route 53 + ACM for HTTPS on the ALB and CloudFront.
- Secrets: Store OAuth client ID/secret and session secret in AWS Secrets Manager or SSM Parameter Store.
- Networking: VPC with public ALB + private subnets for Fargate tasks.
- Pros: Simple mental model, great performance, easy horizontal scaling.
- Cons: You manage a container and runtime updates.

1. Fully serverless API (minimal ops)

- Web: Same (S3 + CloudFront).
- API: Wrap Express with serverless-http and deploy via API Gateway + Lambda.
- Sessions: Prefer token-based auth or a Redis-compatible serverless cache (or move sessions to signed JWT if feasible). Classic server memory sessions don’t map well to Lambda.
- Pros: Near-zero server management, scale-to-zero.
- Cons: Session handling and long-lived connections are trickier; cold starts may matter.

Pulumi fit and benefits

- TypeScript all the way down: Reuse env typing, constants, and share infra utilities in your monorepo.
- Composable stacks: dev/staging/prod stacks with different instance sizes, counts, and domains.
- State management: Use Pulumi Service or S3+DynamoDB backend for team-safe state.
- Preview and policy: pulumi preview for change visibility, and you can enforce org policies.

Core AWS resources you’d model with Pulumi (containerized API pattern)

- Networking: VPC, subnets, route tables, security groups, NAT gateway (if needed).
- Web: S3 bucket for static site, CloudFront distribution, Route 53 records, ACM cert.
- API: ECR repo, ECS cluster, task definition, service (Fargate), ALB, target group, listener/rules.
- State and secrets: ElastiCache Redis, Secrets Manager/SSM for OAuth + session secrets.
- Observability: CloudWatch logs for ECS and ALB access logs (optional to S3).
- CI/CD: A GitHub Actions workflow invoking pulumi up with environment-specific stacks.
