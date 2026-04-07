import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo.js';
import { json } from '../lib/response.js';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.AVATAR_BUCKET_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const childId = event.pathParameters?.childId;
  if (!childId) return json(400, { error: 'childId is required' });

  const body = JSON.parse(event.body ?? '{}');
  const contentType = body.contentType;

  if (!contentType || !contentType.startsWith('image/')) {
    return json(400, { error: 'contentType must be an image type (e.g. image/jpeg)' });
  }

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = `avatars/${childId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  // Save the avatar key to DynamoDB
  const avatarUrl = `https://${BUCKET_NAME}.s3.ap-northeast-1.amazonaws.com/${key}`;

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'FAMILY', SK: `CHILD#${childId}` },
    UpdateExpression: 'SET avatarUrl = :url',
    ExpressionAttributeValues: { ':url': avatarUrl },
    ConditionExpression: 'attribute_exists(PK)',
  }));

  return json(200, { uploadUrl, avatarUrl });
};
