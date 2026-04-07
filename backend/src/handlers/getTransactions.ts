import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  if (!childId) return json(400, { error: 'childId is required' });

  const limit = parseInt(event.queryStringParameters?.limit ?? '20', 10);
  const lastKey = event.queryStringParameters?.lastKey;

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `CHILD#${childId}`,
      ':sk': 'TXN#',
    },
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: lastKey ? JSON.parse(Buffer.from(lastKey, 'base64url').toString()) : undefined,
  }));

  const items = (result.Items ?? []).map(item => ({
    id: item.SK,
    date: item.date,
    personName: item.personName,
    amount: item.amount,
    type: item.type,
    memo: item.memo,
    balanceAfter: item.balanceAfter,
  }));

  const nextKey = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
    : undefined;

  return json(200, { items, lastKey: nextKey });
};
