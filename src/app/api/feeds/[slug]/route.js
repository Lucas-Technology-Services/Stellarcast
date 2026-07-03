import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  resolvePodcastBySlug,
  getFeedData,
  buildRssFeed,
} from "@/services/feed_service";

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { slug } = await params;

    if (!slug || slug.length > 256) {
      return NextResponse.json(
        { error: "podcast not found" },
        { status: 404 },
      );
    }

    const podcastId = await resolvePodcastBySlug(slug);

    const { podcast, episodes } = await getFeedData(podcastId);

    const xml = buildRssFeed(podcast, episodes);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "podcast not found") {
      return NextResponse.json(
        { error: "podcast not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "failed to generate feed", details: message },
      { status: 500 },
    );
  }
}
