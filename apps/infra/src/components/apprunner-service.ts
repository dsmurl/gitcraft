import * as aws from "@pulumi/aws";

export function createApiRepository(args: { name: string; tags?: Record<string, string> }) {
  const repository = new aws.ecr.Repository(`${args.name}-repo`, {
    imageScanningConfiguration: { scanOnPush: true },
    forceDelete: true,
    tags: args.tags,
  });

  // Keep last 10 images to control storage costs
  const lifecycle = new aws.ecr.LifecyclePolicy(`${args.name}-lifecycle`, {
    repository: repository.name,
    policy: JSON.stringify({
      rules: [
        {
          rulePriority: 1,
          description: "Keep last 10 images",
          selection: {
            tagStatus: "any",
            countType: "imageCountMoreThan",
            countNumber: 10
          },
          action: { type: "expire" }
        }
      ]
    }),
  });

  return { repository, lifecycle };
}
