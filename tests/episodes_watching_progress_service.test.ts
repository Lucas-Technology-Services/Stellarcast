import { describe, it, expect, beforeEach, vi } from "vitest";

type Row = Record<string, unknown>;

const tables: Record<string, Row[]> = {
  users: [],
  podcast_categories: [],
  podcasts: [],
  episodes: [],
  watch_progress: [],
};

function genId(): string {
  return crypto.randomUUID();
}

function insert(table: string, data: Row): Row {
  const row = { id: genId(), ...data };
  tables[table].push(row);
  return row;
}

function handleAggregate(sql: string, params: unknown[]): { rows: Row[]; rowCount: number } {
  let allWpRows = [...tables.watch_progress].filter((r) => r.user_id !== null);
  const userMap = Object.fromEntries(tables.users.map((u) => [u.id, u]));
  const episodeMap = Object.fromEntries(tables.episodes.map((e) => [e.id, e]));
  const podcastMap = Object.fromEntries(tables.podcasts.map((p) => [p.id, p]));

  if (sql.includes("u.access_type = 'viewer'") || sql.includes("u.access_type='viewer'")) {
    allWpRows = allWpRows.filter((r) => userMap[r.user_id as string]?.access_type === "viewer");
  }

  if (sql.includes("wp.progress_pct >= 90") && !sql.includes("FILTER")) {
    allWpRows = allWpRows.filter((r) => (r.progress_pct as number) >= 90);
  }

  if (sql.includes("HAVING COUNT(*) >= $1")) {
    const minEp = params[0] as number;
    const groups: Record<string, Row[]> = {};
    for (const r of allWpRows) {
      const uid = r.user_id as string;
      if (!groups[uid]) groups[uid] = [];
      groups[uid].push(r);
    }

    if (sql.includes("COUNT(*) FILTER")) {
      const result = Object.entries(groups)
        .filter(([, rows]) => rows.length >= minEp)
        .map(([uid, rows]) => {
          const user = userMap[uid];
          const completed = rows.filter((r) => (r.progress_pct as number) >= 90);
          return {
            user_id: uid,
            email: user?.email || "",
            total_episodes_watched: rows.length,
            completed_episodes: completed.length,
            completion_rate: rows.length > 0 ? Number(((completed.length / rows.length) * 100).toFixed(2)) : 0,
          };
        })
        .sort((a, b) => b.completion_rate - a.completion_rate);
      return { rows: result, rowCount: result.length };
    }

    const result = Object.entries(groups)
      .filter(([, rows]) => rows.length >= minEp)
      .map(([uid, rows]) => {
        const user = userMap[uid];
        return {
          user_id: uid,
          email: user?.email || "",
          completed_episode_count: rows.length,
          last_completed_at: new Date(Math.max(...rows.map((r) => new Date(r.recorded_at as string || Date.now()).getTime()))).toISOString(),
        };
      })
      .sort((a, b) => b.completed_episode_count - a.completed_episode_count);
    return { rows: result, rowCount: result.length };
  }

  if (sql.includes("COUNT(DISTINCT") && sql.includes("GROUP BY e.id")) {
    const groups: Record<string, Row[]> = {};
    for (const r of allWpRows) {
      const eid = r.episode_id as string;
      if (!groups[eid]) groups[eid] = [];
      groups[eid].push(r);
    }
    const result = Object.entries(groups)
      .filter(([, rows]) => {
        const uniqueViewers = new Set(rows.map((r) => r.user_id as string));
        return uniqueViewers.size >= (params[0] as number);
      })
      .map(([eid, rows]) => {
        const ep = episodeMap[eid];
        const pod = ep ? podcastMap[ep.podcast_id as string] : null;
        const uniqueViewers = new Set(rows.map((r) => r.user_id as string));
        return {
          episode_id: eid,
          episode_title: ep?.title || "",
          episode_token: ep?.masked_video_token || "",
          podcast_title: pod?.title || "",
          total_viewers_completed: rows.length,
          unique_viewers_completed: uniqueViewers.size,
        };
      });
    return { rows: result, rowCount: result.length };
  }

  if (sql.includes("GROUP BY e.id, e.title")) {
    const groups: Record<string, Row[]> = {};
    const now = Date.now();
    for (const r of allWpRows) {
      const eid = r.episode_id as string;
      const recorded = new Date(r.recorded_at as string).getTime();
      const limitDays = parseInt(params[0] as string, 10);
      if (now - recorded > limitDays * 86400000) continue;
      if (!groups[eid]) groups[eid] = [];
      groups[eid].push(r);
    }
    const result = Object.entries(groups).map(([eid, rows]) => {
      const ep = episodeMap[eid];
      const pod = ep ? podcastMap[ep.podcast_id as string] : null;
      return {
        episode_id: eid,
        episode_title: ep?.title || "",
        episode_token: ep?.masked_video_token || "",
        podcast_id: pod?.id || "",
        podcast_title: pod?.title || "",
        completed_at: new Date(Math.max(...rows.map((r) => new Date(r.recorded_at as string).getTime()))).toISOString(),
        completions_count: rows.length,
      };
    });
    return { rows: result, rowCount: result.length };
  }

  throw new Error("Unhandled aggregate SQL: " + sql.substring(0, 80));
}

function query(sql: string, params: unknown[] = []): { rows: Row[]; rowCount: number } {
  const upper = sql.trim().toUpperCase();

  if (upper.startsWith("SELECT")) {
    if (sql.includes("WHERE masked_video_token =")) {
      const token = params[0] as string;
      const ep = tables.episodes.find((e) => e.masked_video_token === token);
      if (ep) return { rows: [ep], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    }

    if (sql.includes("SELECT masked_video_token FROM")) {
      const id = params[0] as string;
      const ep = tables.episodes.find((e) => e.id === id);
      if (ep) return { rows: [ep], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    }

    if (sql.includes("FROM public.episodes") && !sql.includes("JOIN")) {
      const ep = tables.episodes.find((e) => e.id === params[0]);
      if (ep) return { rows: [ep], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    }

    if (sql.includes("GROUP BY") && sql.includes("HAVING")) {
      return handleAggregate(sql, params);
    }

    if (sql.includes("SELECT id, episode_id, user_id, ip_hash, progress_pct, recorded_at")) {
      let rows = [...tables.watch_progress];
      const episodeMap = Object.fromEntries(tables.episodes.map((e) => [e.id, e]));

      if (sql.includes("JOIN public.episodes e")) {
        rows = rows.filter((r) => {
          const ep = episodeMap[r.episode_id as string];
          return ep && !ep.deleted_at;
        });
      }
      if (sql.includes("e.masked_video_token")) {
        const token = params[0];
        rows = rows.filter((r) => {
          const ep = episodeMap[r.episode_id as string];
          return ep?.masked_video_token === token;
        });
      }
      if (sql.includes("wp.ip_hash =")) {
        const ih = params[sql.includes("e.masked_video_token") ? 1 : 0] as string;
        rows = rows.filter((r) => r.ip_hash === ih);
      }
      if (sql.includes("wp.progress_pct >= 90")) {
        rows = rows.filter((r) => (r.progress_pct as number) >= 90);
      }

      const result = rows.map((r) => {
        const ep = episodeMap[r.episode_id as string];
        return {
          id: r.id,
          episode_id: r.episode_id,
          user_id: r.user_id || null,
          ip_hash: r.ip_hash,
          progress_pct: r.progress_pct,
          recorded_at: (r.recorded_at || new Date()).toISOString(),
        };
      });

      if (sql.includes("ORDER BY wp.recorded_at DESC") && sql.includes("LIMIT 1")) {
        result.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
        return { rows: result.slice(0, 1), rowCount: result.length > 0 ? 1 : 0 };
      }
      return { rows: result, rowCount: result.length };
    }

    if (sql.includes("SELECT w.id, w.episode_id") || sql.includes("episode_title") || (sql.includes("FROM public.watch_progress wp") && sql.includes("JOIN public.episodes e"))) {
      let rows = [...tables.watch_progress];
      const episodeMap = Object.fromEntries(tables.episodes.map((e) => [e.id, e]));
      const podcastMap = Object.fromEntries(tables.podcasts.map((p) => [p.id, p]));

      if (sql.includes("wp.ip_hash =")) {
        rows = rows.filter((r) => r.ip_hash === params[0]);
      }
      if (sql.includes("wp.user_id =")) {
        rows = rows.filter((r) => r.user_id === params[0]);
      }
      if (sql.includes("wp.progress_pct >= 90")) {
        rows = rows.filter((r) => (r.progress_pct as number) >= 90);
      }

      if (sql.includes("ORDER BY wp.recorded_at DESC")) {
        rows.sort((a, b) => new Date(b.recorded_at as string).getTime() - new Date(a.recorded_at as string).getTime());
      } else {
        rows.reverse();
      }

      const result = rows.map((r) => {
        const ep = episodeMap[r.episode_id as string];
        const pod = ep ? podcastMap[ep.podcast_id as string] : null;
        return {
          id: r.id,
          episode_id: r.episode_id,
          user_id: r.user_id || null,
          ip_hash: r.ip_hash,
          progress_pct: r.progress_pct,
          recorded_at: (r.recorded_at || new Date()).toISOString(),
          episode_title: ep?.title || null,
          podcast_title: pod?.title || null,
          podcast_id: pod?.id || null,
        };
      });

      if (sql.includes("LIMIT")) {
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1]) : result.length;
        return { rows: result.slice(0, limit), rowCount: result.length };
      }

      return { rows: result, rowCount: result.length };
    }

    if (sql.includes("LOWER(u.email)")) {
      const email = (params[0] as string).toLowerCase();
      const user = tables.users.find((u) => (u.email as string).toLowerCase() === email);
      if (!user || user.access_type !== "producer") return { rows: [], rowCount: 0 };

      const userPodcasts = tables.podcasts.filter((p) => p.user_id === user.id);
      if (userPodcasts.length === 0) return { rows: [], rowCount: 0 };

      if (sql.includes("GROUP BY p.id")) {
        const result = userPodcasts.map((p) => {
          const eps = tables.episodes.filter((e) => e.podcast_id === p.id);
          const wpRows = tables.watch_progress.filter((w) => eps.some((e) => e.id === w.episode_id));
          const completed = wpRows.filter((w) => (w.progress_pct as number) >= 90);
          const uniqueViewers = new Set(completed.map((w) => w.user_id as string));
          const last7d = completed.filter((w) => {
            if (!w.recorded_at) return false;
            return Date.now() - new Date(w.recorded_at as string).getTime() < 7 * 86400000;
          });
          const last30d = completed.filter((w) => {
            if (!w.recorded_at) return false;
            return Date.now() - new Date(w.recorded_at as string).getTime() < 30 * 86400000;
          });
          return {
            podcast_id: p.id,
            podcast_title: p.title,
            total_episodes: eps.length,
            total_completions: completed.length,
            unique_viewers: uniqueViewers.size,
            avg_completion_rate: wpRows.length > 0 ? Number(((completed.length / wpRows.length) * 100).toFixed(2)) : 0,
            last_7d_completions: last7d.length,
            last_30d_completions: last30d.length,
          };
        });
        return { rows: result, rowCount: result.length };
      }

      if (sql.includes("GROUP BY e.id")) {
        const userEpisodes = tables.episodes.filter((e) => userPodcasts.some((p) => p.id === e.podcast_id));
        if (userEpisodes.length === 0) return { rows: [], rowCount: 0 };
        const result = userEpisodes.map((e) => {
          const allWp = tables.watch_progress.filter((w) => w.episode_id === e.id);
          const completed = allWp.filter((w) => (w.progress_pct as number) >= 90);
          return {
            episode_id: e.id,
            episode_title: e.title,
            episode_token: e.masked_video_token,
            published_at: (e.published_at as Date)?.toISOString() || null,
            duration_seconds: e.duration_seconds || null,
            total_watch_attempts: allWp.length,
            completions: completed.length,
            completion_rate: allWp.length > 0 ? Number(((completed.length / allWp.length) * 100).toFixed(2)) : 0,
            unique_viewers_completed: new Set(completed.map((w) => w.user_id as string).filter(Boolean)).size,
          };
        });
        return { rows: result, rowCount: result.length };
      }
    }

    if (sql.includes("SELECT COUNT(*)") && !sql.includes("FILTER") && !sql.includes("DISTINCT")) {
      let rows = [...tables.watch_progress];
      if (sql.includes("user_id =") && sql.includes("AND progress_pct >= 90")) {
        rows = rows.filter((r) => r.user_id === params[0] && (r.progress_pct as number) >= 90);
      } else if (sql.includes("AND progress_pct >= 90") && sql.includes("ip_hash =")) {
        const ih = sql.includes("user_id") ? params[1] as string : params[0] as string;
        rows = rows.filter((r) => r.ip_hash === ih && (r.progress_pct as number) >= 90);
      }
      return { rows: [{ count: rows.length }], rowCount: 1 };
    }

    if (sql.includes("LOWER(u.email)")) {
      const email = (params[0] as string).toLowerCase();
      const user = tables.users.find((u) => (u.email as string).toLowerCase() === email);
      if (!user || user.access_type !== "producer") return { rows: [], rowCount: 0 };

      const userPodcasts = tables.podcasts.filter((p) => p.user_id === user.id);
      if (userPodcasts.length === 0) return { rows: [], rowCount: 0 };

      if (sql.includes("GROUP BY p.id")) {
        const result = userPodcasts.map((p) => {
          const eps = tables.episodes.filter((e) => e.podcast_id === p.id);
          const wpRows = tables.watch_progress.filter((w) => eps.some((e) => e.id === w.episode_id));
          const completed = wpRows.filter((w) => (w.progress_pct as number) >= 90);
          const uniqueViewers = new Set(completed.map((w) => w.user_id as string));
          const last7d = completed.filter((w) => {
            if (!w.recorded_at) return false;
            return Date.now() - new Date(w.recorded_at as string).getTime() < 7 * 86400000;
          });
          const last30d = completed.filter((w) => {
            if (!w.recorded_at) return false;
            return Date.now() - new Date(w.recorded_at as string).getTime() < 30 * 86400000;
          });
          return {
            podcast_id: p.id,
            podcast_title: p.title,
            total_episodes: eps.length,
            total_completions: completed.length,
            unique_viewers: uniqueViewers.size,
            avg_completion_rate: wpRows.length > 0 ? Number(((completed.length / wpRows.length) * 100).toFixed(2)) : 0,
            last_7d_completions: last7d.length,
            last_30d_completions: last30d.length,
          };
        });
        return { rows: result, rowCount: result.length };
      }

      if (sql.includes("GROUP BY e.id")) {
        const userEpisodes = tables.episodes.filter((e) => userPodcasts.some((p) => p.id === e.podcast_id));
        if (userEpisodes.length === 0) return { rows: [], rowCount: 0 };
        const result = userEpisodes.map((e) => {
          const allWp = tables.watch_progress.filter((w) => w.episode_id === e.id);
          const completed = allWp.filter((w) => (w.progress_pct as number) >= 90);
          return {
            episode_id: e.id,
            episode_title: e.title,
            episode_token: e.masked_video_token,
            published_at: (e.published_at as Date)?.toISOString() || null,
            duration_seconds: e.duration_seconds || null,
            total_watch_attempts: allWp.length,
            completions: completed.length,
            completion_rate: allWp.length > 0 ? Number(((completed.length / allWp.length) * 100).toFixed(2)) : 0,
            unique_viewers_completed: new Set(completed.map((w) => w.user_id as string).filter(Boolean)).size,
          };
        });
        return { rows: result, rowCount: result.length };
      }
    }

    return handleAggregate(sql, params);
  }

  if (upper.startsWith("INSERT")) {
    const tblMatch = sql.match(/INTO\s+public\.(\w+)/i);
    if (!tblMatch) return { rows: [], rowCount: 0 };
    const tbl = tblMatch[1];

    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    const valsMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!colsMatch || !valsMatch) return { rows: [], rowCount: 0 };

    const cols = colsMatch[1].split(",").map((s) => s.trim());
    const row: Row = {};
    cols.forEach((col, i) => {
      const val = params[i];
      if (col === "id" && val === undefined) row[col] = genId();
      else row[col] = val;
    });

    if (tbl === "watch_progress" && typeof row.progress_pct === "number") {
      if (row.progress_pct < 0 || row.progress_pct > 100) {
        throw new Error("violates CHECK constraint wp_pct_range");
      }
    }

    const inserted = insert(tbl, row);

    if (sql.includes("RETURNING")) {
      const returningMatch = sql.match(/RETURNING\s+(.+)$/i);
      if (returningMatch) {
        const retCols = returningMatch[1].split(",").map((s) => s.trim().split(" ")[0]);
        const ret: Row = {};
        for (const c of retCols) ret[c] = inserted[c];
        return { rows: [ret], rowCount: 1 };
      }
    }
    return { rows: [inserted], rowCount: 1 };
  }

  if (upper.startsWith("DELETE")) {
    const tblMatch = sql.match(/FROM\s+public\.(\w+)/i);
    if (tblMatch) tables[tblMatch[1]] = [];
    return { rows: [], rowCount: 0 };
  }

  throw new Error("Unsupported SQL: " + sql.substring(0, 80));
}

class MockPool {
  query(sql: string, params: unknown[] = []) {
    return query(sql, params);
  }
  end() {}
}

vi.mock("pg", () => ({
  __esModule: true,
  default: { Pool: MockPool },
  Pool: MockPool,
}));

describe("EpisodesWatchingProgressService", () => {
  beforeEach(() => {
    for (const key of Object.keys(tables)) tables[key] = [];
  });

  describe("resolveEpisodeTokenByID", () => {
    it("should resolve token from a valid episode id", async () => {
      const ep = insert("episodes", { masked_video_token: "tok-123", podcast_id: genId(), title: "E1", status: "published" });
      const { resolveEpisodeTokenByID } = await import("@/services/episodes_watching_progress_service");
      const token = await resolveEpisodeTokenByID(ep.id as string);
      expect(token).toBe("tok-123");
    });

    it("should throw for a non-existent episode id", async () => {
      const { resolveEpisodeTokenByID } = await import("@/services/episodes_watching_progress_service");
      await expect(resolveEpisodeTokenByID(crypto.randomUUID())).rejects.toThrow("episode not found");
    });
  });

  describe("upsertWatchProgress (anonymous path)", () => {
    it("should insert a new anonymous progress row", async () => {
      insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      const { upsertWatchProgress } = await import("@/services/episodes_watching_progress_service");
      const result = await upsertWatchProgress({ episode_token: "tok-1", ip_hash: "a".repeat(64), progress_pct: 50 });
      expect(result).toBeDefined();
      expect(result.progress_pct).toBe(50);
    });

    it("should reject negative progress_pct", async () => {
      insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      const { upsertWatchProgress } = await import("@/services/episodes_watching_progress_service");
      await expect(upsertWatchProgress({ episode_token: "tok-1", ip_hash: "a".repeat(64), progress_pct: -1 })).rejects.toThrow();
    });

    it("should reject progress_pct > 100", async () => {
      insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      const { upsertWatchProgress } = await import("@/services/episodes_watching_progress_service");
      await expect(upsertWatchProgress({ episode_token: "tok-1", ip_hash: "a".repeat(64), progress_pct: 101 })).rejects.toThrow();
    });

    it("should throw for non-existent episode token", async () => {
      const { upsertWatchProgress } = await import("@/services/episodes_watching_progress_service");
      await expect(upsertWatchProgress({ episode_token: "invalid", ip_hash: "a".repeat(64), progress_pct: 50 })).rejects.toThrow("episode not found");
    });
  });

  describe("countCompletedEpisodesByUser", () => {
    it("should count completed episodes for a user", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100 });
      }
      const { countCompletedEpisodesByUser } = await import("@/services/episodes_watching_progress_service");
      const count = await countCompletedEpisodesByUser(user.id as string);
      expect(count).toBe(5);
    });

    it("should return 0 when user has no completions", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      const { countCompletedEpisodesByUser } = await import("@/services/episodes_watching_progress_service");
      const count = await countCompletedEpisodesByUser(user.id as string);
      expect(count).toBe(0);
    });
  });

  describe("countCompletedEpisodesByIPHash", () => {
    it("should count completed episodes for an ip_hash", async () => {
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_id: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, ip_hash: "f".repeat(64), progress_pct: 100 });
      }
      const { countCompletedEpisodesByIPHash } = await import("@/services/episodes_watching_progress_service");
      const count = await countCompletedEpisodesByIPHash("f".repeat(64));
      expect(count).toBe(5);
    });

    it("should return 0 for ip_hash with no completions", async () => {
      const { countCompletedEpisodesByIPHash } = await import("@/services/episodes_watching_progress_service");
      const count = await countCompletedEpisodesByIPHash("z".repeat(64));
      expect(count).toBe(0);
    });
  });

  describe("getViewerCompletionRates", () => {
    it("should return completion rates for viewers meeting min_episodes", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100 });
      }
      const { getViewerCompletionRates } = await import("@/services/episodes_watching_progress_service");
      const rates = await getViewerCompletionRates(3);
      expect(rates.length).toBeGreaterThanOrEqual(1);
      expect(rates[0].user_id).toBe(user.id);
      expect(rates[0].completed_episodes).toBe(5);
    });

    it("should return empty when no viewer meets min_episodes", async () => {
      const { getViewerCompletionRates } = await import("@/services/episodes_watching_progress_service");
      const rates = await getViewerCompletionRates(999);
      expect(rates.length).toBe(0);
    });

    it("should not include producer users in results", async () => {
      const user = insert("users", { email: "p@t.com", access_type: "producer" });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100 });
      }
      const { getViewerCompletionRates } = await import("@/services/episodes_watching_progress_service");
      const rates = await getViewerCompletionRates(3);
      const hasProducer = rates.some((r) => r.user_id === user.id);
      expect(hasProducer).toBe(false);
    });

    it("should correctly calculate mixed completion rates", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: i < 3 ? 100 : 10 });
      }
      const { getViewerCompletionRates } = await import("@/services/episodes_watching_progress_service");
      const rates = await getViewerCompletionRates(3);
      const viewer = rates.find((r) => r.user_id === user.id);
      expect(viewer).toBeDefined();
      expect(viewer!.completed_episodes).toBe(3);
      expect(viewer!.total_episodes_watched).toBe(5);
    });
  });

  describe("getViewerFrequentCompletions", () => {
    it("should return viewers with many completions sorted descending", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      for (let i = 0; i < 4; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100 });
      }
      const { getViewerFrequentCompletions } = await import("@/services/episodes_watching_progress_service");
      const frequent = await getViewerFrequentCompletions(3);
      expect(frequent.length).toBeGreaterThanOrEqual(1);
      expect(frequent[0].user_id).toBe(user.id);
      expect(frequent[0].completed_episode_count).toBe(4);
    });

    it("should return empty when no viewer meets min_completions", async () => {
      const { getViewerFrequentCompletions } = await import("@/services/episodes_watching_progress_service");
      const frequent = await getViewerFrequentCompletions(999);
      expect(frequent.length).toBe(0);
    });
  });

  describe("getRecentlyCompletedEpisodes", () => {
    it("should return recently completed episodes", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100, recorded_at: new Date() });
      }
      const { getRecentlyCompletedEpisodes } = await import("@/services/episodes_watching_progress_service");
      const recent = await getRecentlyCompletedEpisodes(30);
      expect(recent.length).toBe(5);
    });

    it("should return empty for zero lookback window", async () => {
      const { getRecentlyCompletedEpisodes } = await import("@/services/episodes_watching_progress_service");
      const recent = await getRecentlyCompletedEpisodes(0);
      expect(recent.length).toBe(0);
    });
  });

  describe("getEpisodeCompletionFrequency", () => {
    it("should rank episodes by completion count", async () => {
      const user1 = insert("users", { email: "v1@t.com", access_type: "viewer" });
      const user2 = insert("users", { email: "v2@t.com", access_type: "viewer" });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: user1.id, ip_hash: "h".repeat(64), progress_pct: 100 });
        insert("watch_progress", { episode_id: ep.id, user_id: user2.id, ip_hash: "h2".repeat(64), progress_pct: 100 });
      }
      const { getEpisodeCompletionFrequency } = await import("@/services/episodes_watching_progress_service");
      const freq = await getEpisodeCompletionFrequency(1);
      expect(freq.length).toBe(5);
    });

    it("should filter by min_viewers threshold", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      const ep = insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100 });
      const { getEpisodeCompletionFrequency } = await import("@/services/episodes_watching_progress_service");
      const freq = await getEpisodeCompletionFrequency(999);
      expect(freq.length).toBe(0);
    });
  });

  describe("listProgressByEpisodeToken", () => {
    it("should return progress records for an episode", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      const ep = insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 90 });
      const { listProgressByEpisodeToken } = await import("@/services/episodes_watching_progress_service");
      const records = await listProgressByEpisodeToken("tok-1");
      expect(Array.isArray(records)).toBe(true);
    });

    it("should return empty array when no records exist", async () => {
      const { listProgressByEpisodeToken } = await import("@/services/episodes_watching_progress_service");
      const records = await listProgressByEpisodeToken("nonexistent");
      expect(records.length).toBe(0);
    });
  });

  describe("getLatestProgressByEpisode", () => {
    it("should return the latest progress for an ip", async () => {
      const ep = insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      insert("watch_progress", { episode_id: ep.id, ip_hash: "b".repeat(64), progress_pct: 10, recorded_at: new Date(Date.now() - 10000) });
      insert("watch_progress", { episode_id: ep.id, ip_hash: "b".repeat(64), progress_pct: 95, recorded_at: new Date() });
      const { getLatestProgressByEpisode } = await import("@/services/episodes_watching_progress_service");
      const latest = await getLatestProgressByEpisode("tok-1", "b".repeat(64));
      expect(latest).not.toBeNull();
      expect(latest!.progress_pct).toBe(95);
    });

    it("should return null when no progress exists", async () => {
      const { getLatestProgressByEpisode } = await import("@/services/episodes_watching_progress_service");
      const latest = await getLatestProgressByEpisode("tok-1", "nonexistent");
      expect(latest).toBeNull();
    });
  });

  describe("getCompletedEpisodesByUser", () => {
    it("should return completed episodes for a user", async () => {
      const user = insert("users", { email: "v@t.com", access_type: "viewer" });
      const ep = insert("episodes", { masked_video_token: "tok-1", podcast_id: genId(), title: "E1", status: "published" });
      insert("watch_progress", { episode_id: ep.id, user_id: user.id, ip_hash: "h".repeat(64), progress_pct: 100 });
      const { getCompletedEpisodesByUser } = await import("@/services/episodes_watching_progress_service");
      const completed = await getCompletedEpisodesByUser(user.id as string);
      expect(completed.length).toBe(1);
    });

    it("should return empty for user with no completions", async () => {
      const { getCompletedEpisodesByUser } = await import("@/services/episodes_watching_progress_service");
      const completed = await getCompletedEpisodesByUser(crypto.randomUUID());
      expect(completed.length).toBe(0);
    });
  });

  describe("getCompletedEpisodesByIPHash", () => {
    it("should return completed episodes for an ip_hash", async () => {
      for (let i = 0; i < 3; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: genId(), title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, ip_hash: "h".repeat(64), progress_pct: 95 });
      }
      const { getCompletedEpisodesByIPHash } = await import("@/services/episodes_watching_progress_service");
      const completed = await getCompletedEpisodesByIPHash("h".repeat(64));
      expect(completed.length).toBe(3);
    });

    it("should return empty for unknown ip_hash", async () => {
      const { getCompletedEpisodesByIPHash } = await import("@/services/episodes_watching_progress_service");
      const completed = await getCompletedEpisodesByIPHash("unknown".padEnd(64, "x"));
      expect(completed.length).toBe(0);
    });
  });

  describe("getProducerMetricsByEmail", () => {
    it("should return aggregated metrics for a valid producer", async () => {
      const user = insert("users", { email: "producer@test.com", access_type: "producer" });
      const pod = insert("podcasts", { title: "Test Podcast", user_id: user.id });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: pod.id, title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: genId(), ip_hash: "h".repeat(64), progress_pct: 100 });
      }
      const { getProducerMetricsByEmail } = await import("@/services/episodes_watching_progress_service");
      const metrics = await getProducerMetricsByEmail("producer@test.com");
      expect(metrics.length).toBe(1);
      expect(metrics[0].podcast_title).toBe("Test Podcast");
      expect(metrics[0].total_episodes).toBe(5);
    });

    it("should throw for non-existent email", async () => {
      const { getProducerMetricsByEmail } = await import("@/services/episodes_watching_progress_service");
      await expect(getProducerMetricsByEmail("unknown@test.com")).rejects.toThrow("producer not found");
    });

    it("should throw for a viewer email", async () => {
      insert("users", { email: "viewer@test.com", access_type: "viewer" });
      const { getProducerMetricsByEmail } = await import("@/services/episodes_watching_progress_service");
      await expect(getProducerMetricsByEmail("viewer@test.com")).rejects.toThrow("producer not found");
    });
  });

  describe("getProducerEpisodeMetricsByEmail", () => {
    it("should return per-episode metrics for a producer", async () => {
      const user = insert("users", { email: "producer@test.com", access_type: "producer" });
      const pod = insert("podcasts", { title: "Test Podcast", user_id: user.id });
      for (let i = 0; i < 5; i++) {
        const ep = insert("episodes", { masked_video_token: `tok-${i}`, podcast_id: pod.id, title: `E${i}`, status: "published" });
        insert("watch_progress", { episode_id: ep.id, user_id: genId(), ip_hash: "h".repeat(64), progress_pct: 100 });
      }
      const { getProducerEpisodeMetricsByEmail } = await import("@/services/episodes_watching_progress_service");
      const metrics = await getProducerEpisodeMetricsByEmail("producer@test.com");
      expect(metrics.length).toBe(5);
    });

    it("should throw for viewer email", async () => {
      insert("users", { email: "viewer@test.com", access_type: "viewer" });
      const { getProducerEpisodeMetricsByEmail } = await import("@/services/episodes_watching_progress_service");
      await expect(getProducerEpisodeMetricsByEmail("viewer@test.com")).rejects.toThrow("producer not found");
    });
  });
});