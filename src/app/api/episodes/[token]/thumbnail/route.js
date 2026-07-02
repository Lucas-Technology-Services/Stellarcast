import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolveEpisodeIDByToken,
  updateEpisodeThumbnail,
} from "@/services/podcastService";

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { token } = await params;
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { error: "image file is required" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = image.type || "image/jpeg";
    const base64Image = `data:${mimeType};base64,${base64}`;

    const episodeID = await resolveEpisodeIDByToken(token);
    const data = await updateEpisodeThumbnail(episodeID, base64Image);

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "episode not found") {
      return NextResponse.json({ error: "episode not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
