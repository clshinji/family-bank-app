import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'FamilyBankTable', {
      tableName: 'FamilyBankTable',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // S3 Bucket for avatar images
    const avatarBucket = new s3.Bucket(this, 'AvatarBucket', {
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      cors: [{
        allowedHeaders: ['*'],
        allowedMethods: [s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        maxAge: 300,
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Allow public read for avatar images
    avatarBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [avatarBucket.arnForObjects('avatars/*')],
      principals: [new cdk.aws_iam.AnyPrincipal()],
    }));

    // Shared Lambda props
    const sharedLambdaProps: Partial<nodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        format: nodejs.OutputFormat.ESM,
        target: 'node22',
        sourceMap: true,
      },
    };

    const handlersDir = path.join(__dirname, '../../backend/src/handlers');

    // Lambda Functions
    const getChildFn = new nodejs.NodejsFunction(this, 'GetChildFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'getChild.ts'),
      functionName: 'FamilyBank-GetChild',
    });

    const listChildrenFn = new nodejs.NodejsFunction(this, 'ListChildrenFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'listChildren.ts'),
      functionName: 'FamilyBank-ListChildren',
    });

    const createChildFn = new nodejs.NodejsFunction(this, 'CreateChildFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'createChild.ts'),
      functionName: 'FamilyBank-CreateChild',
    });

    const updateChildFn = new nodejs.NodejsFunction(this, 'UpdateChildFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'updateChild.ts'),
      functionName: 'FamilyBank-UpdateChild',
    });

    const getTransactionsFn = new nodejs.NodejsFunction(this, 'GetTransactionsFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'getTransactions.ts'),
      functionName: 'FamilyBank-GetTransactions',
    });

    const postTransactionFn = new nodejs.NodejsFunction(this, 'PostTransactionFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'postTransaction.ts'),
      functionName: 'FamilyBank-PostTransaction',
    });

    const updateTransactionFn = new nodejs.NodejsFunction(this, 'UpdateTransactionFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'updateTransaction.ts'),
      functionName: 'FamilyBank-UpdateTransaction',
    });

    const deleteChildFn = new nodejs.NodejsFunction(this, 'DeleteChildFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'deleteChild.ts'),
      functionName: 'FamilyBank-DeleteChild',
    });

    const getAvatarUploadUrlFn = new nodejs.NodejsFunction(this, 'GetAvatarUploadUrlFn', {
      ...sharedLambdaProps,
      entry: path.join(handlersDir, 'getAvatarUploadUrl.ts'),
      functionName: 'FamilyBank-GetAvatarUploadUrl',
      environment: {
        TABLE_NAME: table.tableName,
        AVATAR_BUCKET_NAME: avatarBucket.bucketName,
      },
    });

    // Grant DynamoDB access
    [getChildFn, listChildrenFn, createChildFn, updateChildFn, getTransactionsFn, postTransactionFn, updateTransactionFn, deleteChildFn, getAvatarUploadUrlFn]
      .forEach(fn => table.grantReadWriteData(fn));

    // Grant S3 access for avatar upload
    avatarBucket.grantPut(getAvatarUploadUrlFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'FamilyBankApi', {
      restApiName: 'FamilyBankApi',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
      deployOptions: {
        stageName: 'prod',
      },
    });

    // /children
    const children = api.root.addResource('children');
    children.addMethod('GET', new apigateway.LambdaIntegration(listChildrenFn));
    children.addMethod('POST', new apigateway.LambdaIntegration(createChildFn));

    // /children/{childId}
    const child = children.addResource('{childId}');
    child.addMethod('GET', new apigateway.LambdaIntegration(getChildFn));
    child.addMethod('PUT', new apigateway.LambdaIntegration(updateChildFn));
    child.addMethod('DELETE', new apigateway.LambdaIntegration(deleteChildFn));

    // /children/{childId}/avatar
    const avatar = child.addResource('avatar');
    avatar.addMethod('POST', new apigateway.LambdaIntegration(getAvatarUploadUrlFn));

    // /children/{childId}/transactions
    const transactions = child.addResource('transactions');
    transactions.addMethod('GET', new apigateway.LambdaIntegration(getTransactionsFn));
    transactions.addMethod('POST', new apigateway.LambdaIntegration(postTransactionFn));

    // /children/{childId}/transactions/{txnId}
    const transaction = transactions.addResource('{txnId}');
    transaction.addMethod('PUT', new apigateway.LambdaIntegration(updateTransactionFn));

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Family Bank API URL',
    });
  }
}
