import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET = "podcast";

let _corsConfigured = false;

export async function ensureBucketCors(): Promise<void> {
  if (_corsConfigured) return;
  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag", "Content-Length", "Content-Type", "Accept-Ranges", "Content-Range"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
    _corsConfigured = true;
  } catch {
    // bucket may already have CORS — non-fatal
  }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 3600 },
  );
}

export async function initiateMultipartUpload(
  key: string,
  contentType: string,
): Promise<string> {
  const { UploadId } = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
  );
  if (!UploadId) throw new Error("Failed to initiate multipart upload");
  return UploadId;
}

export async function getPresignedPartUploadUrl(
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  return getSignedUrl(
    client,
    new UploadPartCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 3600 },
  );
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
): Promise<void> {
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    }),
  );
}

export async function abortMultipartUpload(
  key: string,
  uploadId: string,
): Promise<void> {
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
    }),
  ).catch(() => {});
}

export async function getPresignedPlaybackUrl(
  objectKey: string,
): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    }),
    { expiresIn: 3600 },
  );
}

export function parseObjectKey(storedValue: string): string {
  if (storedValue.includes("://")) {
    const url = new URL(storedValue);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf(BUCKET);
    if (bucketIndex !== -1) {
      return pathParts.slice(bucketIndex + 1).map(decodeURIComponent).join("/");
    }
    return decodeURIComponent(url.pathname.replace(/^\//, ""));
  }
  return storedValue;
}
