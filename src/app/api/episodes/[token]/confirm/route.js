import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  getEpisodeByID,
  setEpisodeVideoUrl,
} from "@/services/podcastService";
import { completeMultipartUpload, abortMultipartUpload } from "@/services/localstack_service";
import { generatePlayerToken } from "@/services/player_service";
import { insertFeed } from "@/services/feed_service";

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { token } = await params;
    const episodeId = await resolveEpisodeIDByToken(token);

    const { key, uploadId, parts } = await request.json();

    if (!key || !uploadId || !parts) {
      return NextResponse.json(
        { error: "key, uploadId and parts are required" },
        { status: 400 },
      );
    }

    try {
      await completeMultipartUpload(key, uploadId, parts);
    } catch {
      await abortMultipartUpload(key, uploadId);
      return NextResponse.json(
        { error: "failed to complete multipart upload" },
        { status: 500 },
      );
    }

    await setEpisodeVideoUrl(episodeId, key);

    const episode = await getEpisodeByID(episodeId);
    if (episode) {
      try {
        await insertFeed(episode.podcast_id, episodeId);
      } catch {
      }
    }

    const playerToken = generatePlayerToken(key);
    const baseUrl =
      process.env.PLATFORM_BASE_URL || "https://rotation-other-cant-gates.trycloudflare.com/";
    const playerUrl = `${baseUrl}/player/${playerToken}`;

    return NextResponse.json(
      {
        message: "Upload confirmed",
        status: "published",
        player_url: playerUrl,
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

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
