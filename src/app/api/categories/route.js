import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  fetchCategories,
  createCategory,
} from "@/services/podcastService";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const data = await fetchCategories();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    const data = await createCategory(name, description ?? null);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
