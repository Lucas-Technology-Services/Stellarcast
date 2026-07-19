import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  getPodcastTitleByEpisodeId,
} from "@/services/podcastService";
import {
  initiateMultipartUpload,
  getPresignedPartUploadUrl,
  abortMultipartUpload,
  ensureBucketCors,
} from "@/services/localstack_service";

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { token } = await params;
    const episodeId = await resolveEpisodeIDByToken(token);

    const podcastTitle = await getPodcastTitleByEpisodeId(episodeId);

    const { fileName, contentType, partCount } = await request.json();

    if (!fileName || !contentType || !partCount) {
      return NextResponse.json(
        { error: "fileName, contentType and partCount are required" },
        { status: 400 },
      );
    }

    const sanitizedTitle = podcastTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    const ext = fileName.split(".").pop() || "mp4";
    const key = `${sanitizedTitle}/${episodeId}.${ext}`;

    await ensureBucketCors();

    const uploadId = await initiateMultipartUpload(key, contentType);

    try {
      const presignedUrls = await Promise.all(
        Array.from({ length: partCount }, (_, i) =>
          getPresignedPartUploadUrl(key, uploadId, i + 1),
        ),
      );

      return NextResponse.json(
        { uploadId, key, presignedUrls, partCount },
        { status: 200 },
      );
    } catch {
      await abortMultipartUpload(key, uploadId);
      throw new Error("Failed to generate presigned URLs");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
