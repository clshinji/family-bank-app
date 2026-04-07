#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack.js';
import { FrontendStack } from '../lib/frontend-stack.js';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
};

const backend = new BackendStack(app, 'FamilyBankBackend', { env });

new FrontendStack(app, 'FamilyBankFrontend', {
  env,
  apiUrl: backend.apiUrl,
});

app.synth();
