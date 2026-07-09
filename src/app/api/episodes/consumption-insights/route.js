import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import { episodesConsumptionInsightsService } from "@/services/episodes_consumption_insights_service";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 },
      );
    }

    const data = await episodesConsumptionInsightsService.execute(email);

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (
      message === "producer not found or no podcasts" ||
      message === "producer not found or no episodes"
    ) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}