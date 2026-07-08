import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  getEpisodeByID,
  setEpisodeVideoUrl,
  getPodcastTitleByEpisodeId,
} from "@/services/podcastService";
import { uploadVideo } from "@/services/minio_service";
import { generatePlayerToken } from "@/services/player_service";

const MAX_VIDEO_SIZE = 300 * 1024 * 1024;

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { token } = await params;
    const episodeId = await resolveEpisodeIDByToken(token);

    const episode = await getEpisodeByID(episodeId);
    const podcastTitle = await getPodcastTitleByEpisodeId(episodeId);

    const formData = await request.formData();
    const videoFile = formData.get("video");

    if (!videoFile || typeof videoFile === "string") {
      return NextResponse.json(
        { error: "video file is required" },
        { status: 400 },
      );
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: "video file exceeds the 300 MB limit" },
        { status: 413 },
      );
    }

    const ext = videoFile.name.split(".").pop() || "mp4";

    const buffer = Buffer.from(await videoFile.arrayBuffer());

    const objectKey = await uploadVideo(
      buffer,
      podcastTitle,
      episodeId,
      ext,
    );

    await setEpisodeVideoUrl(episodeId, objectKey);

    const playerToken = generatePlayerToken(objectKey);
    const baseUrl =
      process.env.PLATFORM_BASE_URL || "https://stellarcast.onrender.com";
    const playerUrl = `${baseUrl}/player/${playerToken}`;

    return NextResponse.json(
      {
        message: "Upload accepted",
        status: "published",
        player_url: playerUrl,
      },
      { status: 202 },
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
