import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
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

    // Grant DynamoDB access
    [getChildFn, listChildrenFn, createChildFn, updateChildFn, getTransactionsFn, postTransactionFn]
      .forEach(fn => table.grantReadWriteData(fn));

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

    // /children/{childId}/transactions
    const transactions = child.addResource('transactions');
    transactions.addMethod('GET', new apigateway.LambdaIntegration(getTransactionsFn));
    transactions.addMethod('POST', new apigateway.LambdaIntegration(postTransactionFn));

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Family Bank API URL',
    });
  }
}
