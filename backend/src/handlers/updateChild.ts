import { APIGatewayProxyHandler } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  if (!childId) return json(400, { error: 'childId is required' });

  const body = JSON.parse(event.body ?? '{}');
  const updates: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  if (body.name !== undefined) {
    updates.push('#n = :name');
    names['#n'] = 'name';
    values[':name'] = body.name;
  }
  if (body.avatarIndex !== undefined) {
    updates.push('avatarIndex = :avatar');
    values[':avatar'] = body.avatarIndex;
  }

  if (updates.length === 0) {
    return json(400, { error: 'No fields to update' });
  }

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'FAMILY', SK: `CHILD#${childId}` },
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeNames: Object.keys(names).length > 0 ? names : undefined,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(PK)',
    ReturnValues: 'ALL_NEW',
  }));

  const item = result.Attributes!;
  return json(200, {
    childId: item.childId,
    name: item.name,
    balance: item.balance,
    avatarIndex: item.avatarIndex,
    createdAt: item.createdAt,
  });
};
