import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const region = process.env.AWS_REGION!;
const bucket = process.env.S3_BUCKET!;

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export function buildPhotoKey(originalFilename: string): string {
  const ext = originalFilename.includes(".") ? originalFilename.slice(originalFilename.lastIndexOf(".")) : "";
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `photos/${yyyy}/${mm}/${randomUUID()}${ext.toLowerCase()}`;
}

export async function presignUpload(key: string, contentType: string, expiresInSeconds = 60 * 5) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function presignDownload(key: string, expiresInSeconds = 60 * 60) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export const S3_BUCKET = bucket;
