import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import {
  listPodcastsByUserID,
  resolveUserIDByEmail,
} from "@/services/podcastService";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("user_email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "user_email query parameter is required" },
        { status: 400 },
      );
    }

    const userID = await resolveUserIDByEmail(userEmail);
    const data = await listPodcastsByUserID(userID);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "user not found") {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
