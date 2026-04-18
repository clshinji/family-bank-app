import { APIGatewayProxyHandler } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  const rawId = event.pathParameters?.txnId;
  if (!childId || !rawId) return json(400, { error: 'childId and txnId are required' });

  const txnId = decodeURIComponent(rawId);
  if (!txnId.startsWith('TXN#')) {
    return json(400, { error: 'invalid txnId' });
  }

  const body = JSON.parse(event.body ?? '{}');
  const updates: string[] = [];
  const values: Record<string, unknown> = {};

  if (body.personName !== undefined) {
    if (typeof body.personName !== 'string' || !body.personName.trim()) {
      return json(400, { error: 'personName must be a non-empty string' });
    }
    updates.push('personName = :pn');
    values[':pn'] = body.personName.trim();
  }
  if (body.memo !== undefined) {
    if (body.memo === null || body.memo === '') {
      updates.push('memo = :memo');
      values[':memo'] = null;
    } else if (typeof body.memo === 'string') {
      updates.push('memo = :memo');
      values[':memo'] = body.memo;
    } else {
      return json(400, { error: 'memo must be string or null' });
    }
  }

  if (updates.length === 0) {
    return json(400, { error: 'No fields to update' });
  }

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CHILD#${childId}`, SK: txnId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    }));
    const item = result.Attributes!;
    return json(200, {
      id: item.SK,
      date: item.date,
      personName: item.personName,
      amount: item.amount,
      type: item.type,
      memo: item.memo ?? null,
      balanceAfter: item.balanceAfter,
    });
  } catch (e: unknown) {
    if ((e as { name?: string }).name === 'ConditionalCheckFailedException') {
      return json(404, { error: 'Transaction not found' });
    }
    throw e;
  }
};
