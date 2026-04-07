import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  if (!childId) return json(400, { error: 'childId is required' });

  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'FAMILY', SK: `CHILD#${childId}` },
  }));

  if (!result.Item) {
    return json(404, { error: 'Child not found' });
  }

  return json(200, {
    childId: result.Item.childId,
    name: result.Item.name,
    balance: result.Item.balance,
    avatarIndex: result.Item.avatarIndex,
    avatarUrl: result.Item.avatarUrl,
    createdAt: result.Item.createdAt,
  });
};
