import * as pulumi from '@pulumi/pulumi';
import { createWebStaticSite } from './components/web-static-site';
import { createApiRepository } from './components/apprunner-service';
import { createSsmSecretParameters } from './components/secrets';

const cfg = new pulumi.Config('infra');

// Normalize and enforce consistent tags for grouping by environment
const defaultTags: Record<string, string> = {
  Project: cfg.get('projectName') ?? 'infra',
  Environment: pulumi.getStack(),
  PulumiProject: pulumi.getProject(),
  PulumiStack: pulumi.getStack(),
  ManagedBy: 'pulumi',
};
const tags = {
  ...defaultTags,
  ...(cfg.getObject<Record<string, string>>('tags') ?? {}),
};

// Feature flags
const enableWeb = cfg.getBoolean('web.create') ?? true;
const enableEcr = cfg.getBoolean('api.createEcr') ?? true;
const enableSecrets = cfg.getBoolean('secrets.create') ?? false;

// WEB: S3 + CloudFront (with OAI, default CF cert by default)
let webBucketNameOut: pulumi.Output<string> | undefined;
let webCdnDomainOut: pulumi.Output<string> | undefined;

if (enableWeb) {
  const zoneName = cfg.get('domain.zoneName'); // optional for base; DNS/ACM can be added later
  const webSubdomain = cfg.get('domain.webSubdomain') ?? 'app';
  const cacheTtls = {
    staticSeconds: Number(cfg.get('web.cacheTtls.staticSeconds') ?? '604800'),
    htmlSeconds: Number(cfg.get('web.cacheTtls.htmlSeconds') ?? '60'),
  };

  const web = createWebStaticSite({
    name: `web-${pulumi.getStack()}`,
    zoneName,
    webSubdomain,
    cacheTtls,
    tags,
  });

  webBucketNameOut = web.bucket.bucket;
  webCdnDomainOut = web.distribution.domainName;
}

// API: ECR repository (service can be added later)
let apiEcrRepositoryUrlOut: pulumi.Output<string> | undefined;
if (enableEcr) {
  const repo = createApiRepository({
    name: `api-${pulumi.getStack()}`,
    tags,
  });
  apiEcrRepositoryUrlOut = repo.repository.repositoryUrl;
}

// SECRETS: Optional SSM parameter creation from Pulumi secrets
if (enableSecrets) {
  const dbParamName = cfg.require('ssm.tursoDatabaseUrlParamName');
  const tokenParamName = cfg.require('ssm.tursoAuthTokenParamName');

  const dbUrl = cfg.getSecret('secrets.tursoDatabaseUrl');
  const token = cfg.getSecret('secrets.tursoAuthToken');

  if (!dbUrl || !token) {
    throw new Error(
      'When infra:secrets.create is true, set infra:secrets.tursoDatabaseUrl and infra:secrets.tursoAuthToken as Pulumi secrets.'
    );
  }

  createSsmSecretParameters({
    parameters: [
      { name: dbParamName, value: dbUrl },
      { name: tokenParamName, value: token },
    ],
    tags,
  });
}

// Exports
export const webBucketName = webBucketNameOut;
export const webCdnDomain = webCdnDomainOut;
export const apiEcrRepositoryUrl = apiEcrRepositoryUrlOut;
