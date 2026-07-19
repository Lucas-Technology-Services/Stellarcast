import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  getEpisodeByToken,
  getEpisodeVideoUrl,
} from "@/services/podcastService";
import { getPresignedPlaybackUrl, parseObjectKey } from "@/services/localstack_service";

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { token } = await params;

    const episode = await getEpisodeByToken(token);
    const episodeId = episode.id;

    let videoUrl = null;
    try {
      const storedValue = await getEpisodeVideoUrl(episodeId);
      const objectKey = parseObjectKey(storedValue);
      if (objectKey.includes("/") || objectKey.includes("://")) {
        videoUrl = await getPresignedPlaybackUrl(objectKey);
      }
    } catch {
      // no video uploaded yet
    }

    return NextResponse.json(
      {
        episode: {
          id: episode.id,
          title: episode.title,
          description: episode.description,
          thumbnail_url: episode.thumbnail_url,
          duration_seconds: episode.duration_seconds,
          published_at: episode.published_at,
          status: episode.status,
          masked_video_token: episode.masked_video_token,
        },
        video_url: videoUrl,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "episode not found") {
      return NextResponse.json({ error: "episode not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
