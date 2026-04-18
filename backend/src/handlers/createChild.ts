import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';
import { randomUUID } from 'crypto';

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body ?? '{}');
  const { name, avatarIndex, color, deco } = body;

  if (!name || typeof name !== 'string') {
    return json(400, { error: 'name is required' });
  }

  const ALLOWED_COLORS = ['pink', 'mint', 'sun', 'lavender'];
  const themeColor = ALLOWED_COLORS.includes(color) ? color : 'pink';
  const decoList = Array.isArray(deco) ? deco.filter((d): d is string => typeof d === 'string') : [];

  const childId = randomUUID();
  const now = new Date().toISOString();

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: 'FAMILY',
      SK: `CHILD#${childId}`,
      childId,
      name,
      balance: 0,
      avatarIndex: avatarIndex ?? 0,
      color: themeColor,
      deco: decoList,
      createdAt: now,
    },
  }));

  return json(201, {
    childId,
    name,
    balance: 0,
    avatarIndex: avatarIndex ?? 0,
    color: themeColor,
    deco: decoList,
    createdAt: now,
  });
};
