import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import { listFeeds, insertFeed } from "@/services/feed_service";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const feeds = await listFeeds();
    return NextResponse.json(feeds, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "failed to list feeds", details: message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const body = await request.json().catch(() => ({}));
    const { podcast_id, episode_id } = body;

    if (!podcast_id || !episode_id) {
      return NextResponse.json(
        { error: "podcast_id and episode_id are required" },
        { status: 400 },
      );
    }

    const feed = await insertFeed(podcast_id, episode_id);

    return NextResponse.json(feed, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message.includes("violates foreign key")) {
      return NextResponse.json(
        { error: "podcast_id or episode_id not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "failed to create feed", details: message },
      { status: 500 },
    );
  }
}
