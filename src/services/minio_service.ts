import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

function getBucketName(): string {
  return process.env.MINIO_BUCKET_NAME || "podcasts";
}

function getEndpoint(): string {
  return process.env.MINIO_ENDPOINT || "";
}

export async function uploadVideo(
  filePath: string,
  podcastTitle: string,
  episodeId: string,
  ext: string,
): Promise<string> {
  const sanitizedTitle = podcastTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const objectKey = `${sanitizedTitle}/${episodeId}.${ext}`;

  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
      Body: createReadStream(filePath),
      ContentType: `video/${ext === "mp4" ? "mp4" : ext}`,
    }),
  );

  return objectKey;
}

export function buildVideoUrl(objectKey: string): string {
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${getEndpoint()}/${getBucketName()}/${encodedKey}`;
}
