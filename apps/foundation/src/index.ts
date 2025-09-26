import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const cfg = new pulumi.Config('foundation');

// Tagging to group resources by environment and project
const defaultTags: Record<string, string> = {
  Project: cfg.get('projectName') ?? 'foundation',
  Environment: pulumi.getStack(),
  PulumiProject: pulumi.getProject(),
  PulumiStack: pulumi.getStack(),
  ManagedBy: 'pulumi',
};
const tags = {
  ...defaultTags,
  ...(cfg.getObject<Record<string, string>>('tags') ?? {}),
};

const zoneName = cfg.require('domain.zoneName');
const webSub = cfg.get('domain.webSubdomain') ?? 'app';
const apiSub = cfg.get('domain.apiSubdomain') ?? 'api';

const webDomain = `${webSub}.${zoneName}`;
const apiDomain = `${apiSub}.${zoneName}`;

// Lookup existing hosted zone (authoritative)
const zone = aws.route53.getZone({
  name: zoneName,
  privateZone: false,
});

// Provider alias for us-east-1 (required for CloudFront certs)
const east1 = new aws.Provider('east1', {
  region: 'us-east-1',
});

// Web (CloudFront) certificate in us-east-1
const webCert = new aws.acm.Certificate(
  'web-cert',
  {
    domainName: webDomain,
    validationMethod: 'DNS',
    tags,
  },
  { provider: east1 }
);

// DNS validation record for web
const webValidationRecord = new aws.route53.Record('web-cert-validation', {
  zoneId: zone.then((z) => z.zoneId),
  name: webCert.domainValidationOptions[0].resourceRecordName,
  type: webCert.domainValidationOptions[0].resourceRecordType,
  records: [webCert.domainValidationOptions[0].resourceRecordValue],
  ttl: 60,
});

// Complete validation for web cert
const webCertValidation = new aws.acm.CertificateValidation(
  'web-cert-validated',
  {
    certificateArn: webCert.arn,
    validationRecordFqdns: [webValidationRecord.fqdn],
  },
  { provider: east1 }
);

// API certificate in the stack's region
const apiCert = new aws.acm.Certificate('api-cert', {
  domainName: apiDomain,
  validationMethod: 'DNS',
  tags,
});

// DNS validation record for API
const apiValidationRecord = new aws.route53.Record('api-cert-validation', {
  zoneId: zone.then((z) => z.zoneId),
  name: apiCert.domainValidationOptions[0].resourceRecordName,
  type: apiCert.domainValidationOptions[0].resourceRecordType,
  records: [apiCert.domainValidationOptions[0].resourceRecordValue],
  ttl: 60,
});

// Complete validation for API cert
const apiCertValidation = new aws.acm.CertificateValidation(
  'api-cert-validated',
  {
    certificateArn: apiCert.arn,
    validationRecordFqdns: [apiValidationRecord.fqdn],
  }
);

// Outputs
export const hostedZoneId = zone.then((z) => z.zoneId);
export const webDomainName = webDomain;
export const apiDomainName = apiDomain;
export const webCertificateArn = webCertValidation.certificateArn;
export const apiCertificateArn = apiCertValidation.certificateArn;
