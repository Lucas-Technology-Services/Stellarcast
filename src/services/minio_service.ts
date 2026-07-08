import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const CHUNK_SIZE = 5 * 1024 * 1024;
const CONCURRENCY = 5;
const MAX_RETRIES = 3;

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

async function uploadPartWithRetry(
  client: S3Client,
  bucket: string,
  key: string,
  partNumber: number,
  uploadId: string,
  body: Buffer,
  attempt: number = 1,
): Promise<{ PartNumber: number; ETag: string }> {
  try {
    const { ETag } = await client.send(
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: body,
      }),
    );
    return { PartNumber: partNumber, ETag: ETag! };
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      throw err;
    }
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10_000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return uploadPartWithRetry(client, bucket, key, partNumber, uploadId, body, attempt + 1);
  }
}

export async function uploadVideo(
  buffer: Buffer,
  podcastTitle: string,
  episodeId: string,
  ext: string,
): Promise<string> {
  const sanitizedTitle = podcastTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const objectKey = `${sanitizedTitle}/${episodeId}.${ext}`;

  const client = getClient();
  const bucket = getBucketName();

  const { UploadId } = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: `video/${ext === "mp4" ? "mp4" : ext}`,
    }),
  );

  if (!UploadId) {
    throw new Error("Failed to initiate multipart upload");
  }

  try {
    const totalSize = buffer.length;
    const parts: { PartNumber: number; start: number; end: number }[] = [];
    let partNumber = 1;
    let offset = 0;

    while (offset < totalSize) {
      const end = Math.min(offset + CHUNK_SIZE, totalSize);
      parts.push({ PartNumber: partNumber, start: offset, end });
      partNumber++;
      offset = end;
    }

    const uploadedParts: { PartNumber: number; ETag: string }[] = [];

    for (let i = 0; i < parts.length; i += CONCURRENCY) {
      const batch = parts.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((p) =>
          uploadPartWithRetry(
            client,
            bucket,
            objectKey,
            p.PartNumber,
            UploadId,
            buffer.subarray(p.start, p.end),
          ),
        ),
      );
      uploadedParts.push(...results);
    }

    uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);

    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: objectKey,
        UploadId,
        MultipartUpload: { Parts: uploadedParts },
      }),
    );

    return objectKey;
  } catch (err) {
    await client
      .send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: objectKey,
          UploadId,
        }),
      )
      .catch(() => {});
    throw err;
  }
}

export function buildVideoUrl(objectKey: string): string {
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${getEndpoint()}/${getBucketName()}/${encodedKey}`;
}
