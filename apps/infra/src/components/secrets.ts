import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export function createSsmSecretParameters(args: {
  parameters: { name: string; value: pulumi.Input<string> }[];
  tags?: Record<string, string>;
}) {
  const created = args.parameters.map((p, i) => {
    return new aws.ssm.Parameter(`secret-${i}`, {
      name: p.name,
      type: "SecureString",
      value: p.value,
      tags: args.tags,
    });
  });

  return { parameters: created };
}
