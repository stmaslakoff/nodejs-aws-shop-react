import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";

export class CdkDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, "ReactAppBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // optional: can be used for client-side routing
      removalPolicy: cdk.RemovalPolicy.DESTROY, // remove bucket on stack deletion
      autoDeleteObjects: true,
      publicReadAccess: false,
    });

    const cloudfrontDistribution = new cloudfront.Distribution(this, "ReactAppDistribution", {
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        }
      ]
    });

    new s3deploy.BucketDeployment(this, "DeployReactApp", {
      sources: [s3deploy.Source.asset("../dist")], // path to your React build folder
      destinationBucket: websiteBucket,
      distribution: cloudfrontDistribution,
      distributionPaths: ["/*"]
    });

    new cdk.CfnOutput(this, "BucketURL", {
      value: websiteBucket.bucketWebsiteUrl,
      description: "URL of the S3 bucket hosting the React app"
    });

    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: cloudfrontDistribution.domainName,
      description: "CloudFront distribution URL"
    });
  }
}
