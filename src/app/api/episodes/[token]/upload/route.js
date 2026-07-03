import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  getEpisodeByID,
  setYoutubeVideoId,
} from "@/services/podcastService";
import { uploadToYouTube } from "@/services/youtube_service";
import { generatePlayerToken } from "@/services/player_service";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

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

    const formData = await request.formData();
    const videoFile = formData.get("video");

    if (!videoFile || typeof videoFile === "string") {
      return NextResponse.json(
        { error: "video file is required" },
        { status: 400 },
      );
    }

    const ext = videoFile.name.split(".").pop() || "mp4";
    const tmpDir = "/tmp/podcast-uploads";
    await mkdir(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, `${episodeId}.${ext}`);

    const buffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(filePath, buffer);

    try {
      const youtubeVideoId = await uploadToYouTube(
        filePath,
        episode.title,
        episode.description || "",
      );

      await setYoutubeVideoId(episodeId, youtubeVideoId);

      const playerToken = generatePlayerToken(youtubeVideoId);
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
    } finally {
      await unlink(filePath).catch(() => {});
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
