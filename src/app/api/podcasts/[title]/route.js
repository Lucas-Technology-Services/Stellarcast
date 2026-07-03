import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  getPodcastByTitle,
  updatePodcast,
  deletePodcast,
  resolvePodcastIDByTitle,
} from "@/services/podcastService";

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { title } = await params;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 },
      );
    }

    const data = await getPodcastByTitle(title);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/podcasts/[title] error:", err);

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "podcast not found") {
      return NextResponse.json({ error: "podcast not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { title } = await params;
    const body = await request.json();

    if (!title || !body.title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 },
      );
    }

    const podcastID = await resolvePodcastIDByTitle(title);
    const data = await updatePodcast(podcastID, body);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "podcast not found") {
      return NextResponse.json({ error: "podcast not found" }, { status: 404 });
    }

    if (message === "category not found") {
      return NextResponse.json({ error: "category not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { title } = await params;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 },
      );
    }

    const podcastID = await resolvePodcastIDByTitle(title);
    await deletePodcast(podcastID);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "podcast not found") {
      return NextResponse.json({ error: "podcast not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
