import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  getEpisodeByToken,
  getEpisodeYoutubeVideoId,
} from "@/services/podcastService";
import { generatePlayerToken } from "@/services/player_service";

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

    let embedUrl = null;
    try {
      const youtubeVideoId = await getEpisodeYoutubeVideoId(episodeId);
      const streamingToken = generatePlayerToken(youtubeVideoId);
      const baseUrl =
        process.env.PLATFORM_BASE_URL || "https://stellarcast.onrender.com";
      embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?origin=${encodeURIComponent(baseUrl)}&enablejsapi=1&rel=0&modestbranding=1`;
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
        embed_url: embedUrl,
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
