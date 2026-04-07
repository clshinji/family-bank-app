import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, BatchWriteCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  if (!childId) return json(400, { error: 'childId is required' });

  // Delete child profile
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'FAMILY', SK: `CHILD#${childId}` },
    ConditionExpression: 'attribute_exists(PK)',
  })).catch(e => {
    if (e.name === 'ConditionalCheckFailedException') throw new Error('NOT_FOUND');
    throw e;
  });

  // Delete all transactions for this child (batch delete in chunks of 25)
  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `CHILD#${childId}` },
      ProjectionExpression: 'PK, SK',
      Limit: 25,
      ExclusiveStartKey: lastKey,
    }));

    const items = result.Items ?? [];
    if (items.length > 0) {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: items.map(item => ({
            DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
          })),
        },
      }));
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return json(200, { deleted: true });
};
