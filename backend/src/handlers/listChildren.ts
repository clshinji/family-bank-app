import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';

export const handler: APIGatewayProxyHandler = async () => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': 'FAMILY',
      ':sk': 'CHILD#',
    },
  }));

  const children = (result.Items ?? []).map(item => ({
    childId: item.childId,
    name: item.name,
    balance: item.balance,
    avatarIndex: item.avatarIndex,
    createdAt: item.createdAt,
  }));

  return json(200, { children });
};
