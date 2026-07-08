import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  getEpisodeVideoUrl,
} from "@/services/podcastService";
import { buildVideoUrl } from "@/services/minio_service";

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { token } = await params;
    const episodeId = await resolveEpisodeIDByToken(token);

    const objectKey = await getEpisodeVideoUrl(episodeId);
    const videoUrl = buildVideoUrl(objectKey);

    return NextResponse.json({ video_url: videoUrl }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (
      message === "episode not found or no video"
    ) {
      return NextResponse.json({ error: "episode not found or no video" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
