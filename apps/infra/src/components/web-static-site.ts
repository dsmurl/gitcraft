import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface WebStaticSiteArgs {
  name: string;
  zoneName?: string; // reserved for future DNS/ACM expansion
  webSubdomain: string;
  cacheTtls: {
    staticSeconds: number;
    htmlSeconds: number;
  };
  tags?: Record<string, string>;
}

export function createWebStaticSite(args: WebStaticSiteArgs) {
  const bucket = new aws.s3.Bucket(`${args.name}-bucket`, {
    bucketPrefix: `${args.name}-`,
    // Private bucket; CloudFront Origin Access Identity gets read access
    forceDestroy: true,
    tags: args.tags,
  });

  // Origin Access Identity for CloudFront -> S3 private access
  const oai = new aws.cloudfront.OriginAccessIdentity(`${args.name}-oai`, {
    comment: `OAI for ${args.name}`,
  });

  // Grant the OAI read access to the bucket objects
  const policy = new aws.s3.BucketPolicy(`${args.name}-bucket-policy`, {
    bucket: bucket.id,
    policy: pulumi
      .all([bucket.arn, oai.iamArn])
      .apply(([bucketArn, oaiIamArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowCloudFrontRead',
              Effect: 'Allow',
              Principal: { AWS: oaiIamArn },
              Action: ['s3:GetObject'],
              Resource: [`${bucketArn}/*`],
            },
          ],
        })
      ),
  });

  const originId = pulumi.interpolate`${args.name}-s3-origin`;

  const distribution = new aws.cloudfront.Distribution(`${args.name}-cdn`, {
    enabled: true,
    // Default CF certificate (d123.cloudfront.net). You can swap to ACM + DNS later.
    viewerCertificate: { cloudfrontDefaultCertificate: true },
    origins: [
      {
        originId,
        domainName: bucket.bucketRegionalDomainName,
        s3OriginConfig: {
          originAccessIdentity: oai.cloudfrontAccessIdentityPath,
        },
      },
    ],
    defaultRootObject: 'index.html',
    defaultCacheBehavior: {
      targetOriginId: originId,
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
      forwardedValues: {
        queryString: false,
        cookies: { forward: 'none' },
      },
      // opinionated: cache HTML briefly, assets can be overridden with custom behaviors later
      minTtl: 0,
      defaultTtl: args.cacheTtls.htmlSeconds,
      maxTtl: 31536000,
    },
    customErrorResponses: [
      {
        errorCode: 403,
        responseCode: 200,
        responsePagePath: '/index.html',
        errorCachingMinTtl: 0,
      },
      {
        errorCode: 404,
        responseCode: 200,
        responsePagePath: '/index.html',
        errorCachingMinTtl: 0,
      },
    ],
    priceClass: 'PriceClass_100',
    restrictions: {
      geoRestriction: { restrictionType: 'none' },
    },
    tags: args.tags,
  });

  return {
    bucket,
    oai,
    policy,
    distribution,
  };
}
