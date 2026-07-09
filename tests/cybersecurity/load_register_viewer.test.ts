import { describe, it, expect, vi, beforeEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };
let usersTable: Record<string, any>[] = [];

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  process.env.JWT_SECRET = "__TEST_JWT_SECRET__0123456789abcdef0123456789abcdef";
  process.env.CLIENT_ID_1 = "test_client_id_abc123";
  process.env.SECRET_1 = "test_secret_value_xyz789";
  usersTable = [];
});

function query(sql: string, params: unknown[] = []) {
  if (sql.includes("INSERT INTO public.users")) {
    const existing = usersTable.find((u) => u.email === params[0]);
    if (existing) {
      const err = new Error("duplicate key value violates unique constraint");
      (err as any).code = "23505";
      throw err;
    }
    const row: Record<string, any> = { id: crypto.randomUUID() };
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (colsMatch) {
      colsMatch[1].split(",").forEach((c, i) => { row[c.trim()] = params[i]; });
    }
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    usersTable.push(row);
    const retMatch = sql.match(/RETURNING\s+(.+)$/i);
    if (retMatch) {
      const retCols = retMatch[1].split(",").map((s) => s.trim().split(" ")[0]);
      const retRow: Record<string, any> = {};
      for (const c of retCols) retRow[c] = row[c];
      return { rows: [retRow], rowCount: 1 };
    }
    return { rows: [row], rowCount: 1 };
  }
  if (sql.includes("SELECT id, email, password") && sql.includes("public.users")) {
    const user = usersTable.find((u) => u.email === params[0] && (u.deleted_at === null || u.deleted_at === undefined));
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }
  throw new Error("mock unhandled: " + sql.substring(0, 60));
}

class MockPool {
  query(sql: string, params: unknown[] = []) { return query(sql, params); }
  end() {}
}

vi.mock("pg", () => ({ default: { Pool: MockPool }, Pool: MockPool }));

const CONCURRENCY = 15;
const TOTAL_USERS = 200;

async function createViewer(email: string) {
  const { CreateUser } = await import("@/services/userService");
  return CreateUser({ email, password: "SecurePass123!", access_type: "viewer" });
}

describe("Load Test - Register viewer users", { timeout: 120000 }, () => {
  it(`should create ${TOTAL_USERS} viewer users with ${CONCURRENCY} concurrent requests`, async () => {
    const emails = Array.from({ length: TOTAL_USERS }, (_, i) => `loadtest${i}@viewer.com`);

    const start = performance.now();

    const batches: Promise<any>[] = [];
    for (let i = 0; i < emails.length; i += CONCURRENCY) {
      const batch = emails.slice(i, i + CONCURRENCY).map((email) => createViewer(email));
      batches.push(Promise.all(batch));
    }
    const results = await Promise.all(batches);
    const elapsed = performance.now() - start;
    const flat = results.flat();
    const durationSec = (elapsed / 1000).toFixed(2);

    expect(flat.length).toBe(TOTAL_USERS);

    const viewerUsers = usersTable.filter((u) => u.email.endsWith("@viewer.com"));
    expect(viewerUsers.length).toBe(TOTAL_USERS);

    for (const r of flat) {
      expect(r.access_type).toBe("viewer");
    }

    console.log(`[LOAD] Created ${TOTAL_USERS} viewer accounts in ${durationSec}s (concurrency=${CONCURRENCY})`);
    console.log(`[LOAD] Throughput: ${(TOTAL_USERS / Number(durationSec)).toFixed(0)} users/s`);
    console.log(`[LOAD] Avg: ${(elapsed / TOTAL_USERS).toFixed(1)}ms per user`);
  });

  it("should enforce viewer access_type in DB (mapped to 'spector')", async () => {
    await createViewer("check_mapping@viewer.com");
    const stored = usersTable.find((u) => u.email === "check_mapping@viewer.com");
    expect(stored).toBeDefined();
    expect(stored!.access_type).toBe("spector");
  });

  it("should reject duplicate viewer email under load", async () => {
    await createViewer("dup_under_load@viewer.com");
    await expect(createViewer("dup_under_load@viewer.com")).rejects.toThrow();
  });

  it("should hash passwords with bcrypt for all created users", async () => {
    const emails = Array.from({ length: 10 }, (_, i) => `bcrypt_check${i}@viewer.com`);
    await Promise.all(emails.map((e) => createViewer(e)));

    for (const email of emails) {
      const stored = usersTable.find((u) => u.email === email);
      expect(stored).toBeDefined();
      expect(stored!.password).toMatch(/^\$2[ayb]\$.{56}$/);
      expect(stored!.password).not.toBe("SecurePass123!");
    }
  });

  it("should maintain data integrity under concurrent creation", async () => {
    const emails = Array.from({ length: 20 }, (_, i) => `integrity${i}@viewer.com`);

    const promises = emails.map((email) => createViewer(email));
    await Promise.all(promises);

    const storedEmails = new Set(usersTable.filter((u) => u.email.endsWith("@viewer.com")).map((u) => u.email));
    for (const email of emails) {
      expect(storedEmails.has(email)).toBe(true);
    }
    expect(storedEmails.size).toBe(emails.length);
  });
});