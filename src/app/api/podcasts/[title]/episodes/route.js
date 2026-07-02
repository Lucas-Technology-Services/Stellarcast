import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  listEpisodes,
  createEpisode,
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

    const data = await listEpisodes(title);
    return NextResponse.json(data, { status: 200 });
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

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { title } = await params;
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "Missing required fields: title" },
        { status: 400 },
      );
    }

    const data = await createEpisode(title, body);
    return NextResponse.json(data, { status: 201 });
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
