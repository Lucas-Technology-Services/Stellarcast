import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import * as wp from "@/services/episodes_watching_progress_service";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const body = await request.json().catch(() => ({}));
    const { episode_token, user_id, ip_hash, progress_pct } = body;

    if (!episode_token || !ip_hash || progress_pct === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: episode_token, ip_hash, progress_pct" },
        { status: 400 },
      );
    }

    if (typeof progress_pct !== "number" || progress_pct < 0 || progress_pct > 100) {
      return NextResponse.json(
        { error: "progress_pct must be a number between 0 and 100" },
        { status: 400 },
      );
    }

    const data = await wp.upsertWatchProgress({
      episode_token,
      user_id: user_id || undefined,
      ip_hash,
      progress_pct,
    });

    return NextResponse.json(data, { status: 201 });
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

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "episode-progress";
    const episode_token = searchParams.get("episode_token");
    const ip_hash = searchParams.get("ip_hash");
    const user_id = searchParams.get("user_id");
    const email = searchParams.get("email");
    const min_episodes = parseInt(searchParams.get("min_episodes") || "3", 10);
    const min_completions = parseInt(searchParams.get("min_completions") || "5", 10);
    const limit_days = parseInt(searchParams.get("limit_days") || "30", 10);
    const min_viewers = parseInt(searchParams.get("min_viewers") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let data;

    switch (action) {
      case "episode-progress":
        if (!episode_token) {
          return NextResponse.json(
            { error: "episode_token is required" },
            { status: 400 },
          );
        }
        data = await wp.listProgressByEpisodeToken(episode_token);
        break;

      case "latest-by-ip":
        if (!ip_hash) {
          return NextResponse.json(
            { error: "ip_hash is required" },
            { status: 400 },
          );
        }
        data = await wp.listProgressByIPHash(ip_hash, limit);
        break;

      case "latest-by-episode":
        if (!episode_token || !ip_hash) {
          return NextResponse.json(
            { error: "episode_token and ip_hash are required" },
            { status: 400 },
          );
        }
        data = await wp.getLatestProgressByEpisode(episode_token, ip_hash);
        if (!data) {
          return NextResponse.json({ message: "no progress found" }, { status: 404 });
        }
        break;

      case "latest-by-user":
        if (!user_id) {
          return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 },
          );
        }
        data = await wp.getLatestProgressByUser(user_id, limit);
        break;

      case "viewer-completion-rates":
        data = await wp.getViewerCompletionRates(min_episodes);
        break;

      case "viewer-frequent-completions":
        data = await wp.getViewerFrequentCompletions(min_completions);
        break;

      case "recently-completed":
        data = await wp.getRecentlyCompletedEpisodes(limit_days);
        break;

      case "episode-completion-frequency":
        data = await wp.getEpisodeCompletionFrequency(min_viewers);
        break;

      case "producer-metrics":
        if (!email) {
          return NextResponse.json(
            { error: "email is required" },
            { status: 400 },
          );
        }
        data = await wp.getProducerMetricsByEmail(email);
        break;

      case "producer-episode-metrics":
        if (!email) {
          return NextResponse.json(
            { error: "email is required" },
            { status: 400 },
          );
        }
        data = await wp.getProducerEpisodeMetricsByEmail(email);
        break;

      case "completed-by-user":
        if (!user_id) {
          return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 },
          );
        }
        data = await wp.getCompletedEpisodesByUser(user_id);
        break;

      case "completed-by-ip":
        if (!ip_hash) {
          return NextResponse.json(
            { error: "ip_hash is required" },
            { status: 400 },
          );
        }
        data = await wp.getCompletedEpisodesByIPHash(ip_hash);
        break;

      case "count-completed-by-user":
        if (!user_id) {
          return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 },
          );
        }
        data = { count: await wp.countCompletedEpisodesByUser(user_id) };
        break;

      case "count-completed-by-ip":
        if (!ip_hash) {
          return NextResponse.json(
            { error: "ip_hash is required" },
            { status: 400 },
          );
        }
        data = { count: await wp.countCompletedEpisodesByIPHash(ip_hash) };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (
      message === "episode not found" ||
      message === "producer not found or no podcasts" ||
      message === "producer not found or no episodes" ||
      message === "no progress found"
    ) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}