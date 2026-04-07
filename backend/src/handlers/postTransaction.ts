import { APIGatewayProxyHandler } from 'aws-lambda';
import { TransactWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';
import { randomUUID } from 'crypto';

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  if (!childId) return json(400, { error: 'childId is required' });

  const body = JSON.parse(event.body ?? '{}');
  const { personName, amount, type, memo } = body;

  if (!personName || typeof personName !== 'string') {
    return json(400, { error: 'personName is required' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return json(400, { error: 'amount must be a positive number' });
  }
  if (type !== 'income' && type !== 'expense') {
    return json(400, { error: 'type must be "income" or "expense"' });
  }

  // Get current balance
  const childResult = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'FAMILY', SK: `CHILD#${childId}` },
  }));

  if (!childResult.Item) {
    return json(404, { error: 'Child not found' });
  }

  const currentBalance = childResult.Item.balance as number;
  const delta = type === 'income' ? amount : -amount;
  const newBalance = currentBalance + delta;

  const now = new Date().toISOString();
  const txnId = `TXN#${now}#${randomUUID()}`;

  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `CHILD#${childId}`,
            SK: txnId,
            date: now,
            personName,
            amount,
            type,
            memo: memo ?? undefined,
            balanceAfter: newBalance,
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: { PK: 'FAMILY', SK: `CHILD#${childId}` },
          UpdateExpression: 'SET balance = :newBalance',
          ConditionExpression: 'balance = :currentBalance',
          ExpressionAttributeValues: {
            ':newBalance': newBalance,
            ':currentBalance': currentBalance,
          },
        },
      },
    ],
  }));

  return json(201, {
    id: txnId,
    date: now,
    personName,
    amount,
    type,
    memo: memo ?? null,
    balanceAfter: newBalance,
  });
};
