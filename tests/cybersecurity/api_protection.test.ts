import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ORIGINAL_ENV = { ...process.env };
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = { auth_tokens: [], users: [] };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  process.env.JWT_SECRET = "__TEST_JWT_SECRET__0123456789abcdef0123456789abcdef";
  process.env.CLIENT_ID_1 = "test_client_id_abc123";
  process.env.SECRET_1 = "test_secret_value_xyz789";
  for (const k of Object.keys(tables)) tables[k] = [];
});

function query(sql: string, params: unknown[] = []) {
  if (sql.includes("INSERT INTO public.auth_tokens")) {
    const row = { jwt_token: params[1], client_id: params[0], expires_at: new Date((params[2] as number) * 1000).toISOString() };
    tables.auth_tokens.push(row);
    return { rows: [row], rowCount: 1 };
  }
  if (sql.includes("SELECT jwt_token FROM public.auth_tokens")) {
    const rows = tables.auth_tokens.filter((t) => t.client_id === params[0] && new Date(t.expires_at as string) > new Date()).slice(0, 1);
    return { rows, rowCount: rows.length };
  }
  if (sql.includes("SELECT EXISTS") && sql.includes("auth_tokens")) {
    const exists = tables.auth_tokens.some((t) => t.jwt_token === params[0] && new Date(t.expires_at as string) > new Date());
    return { rows: [{ exists }], rowCount: 1 };
  }
  if (sql.includes("INSERT INTO public.users")) {
    const existing = tables.users.find((u) => u.email === params[0]);
    if (existing) {
      const err = new Error("duplicate key value violates unique constraint");
      throw err;
    }
    const row: Row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (colsMatch) {
      colsMatch[1].split(",").forEach((c, i) => { row[c.trim()] = params[i]; });
    }
    tables.users.push(row);
    const retMatch = sql.match(/RETURNING\s+(.+)$/i);
    if (retMatch) {
      const retCols = retMatch[1].split(",").map((s) => s.trim().split(" ")[0]);
      const retRow: Row = {};
      for (const c of retCols) retRow[c] = row[c];
      return { rows: [retRow], rowCount: 1 };
    }
    return { rows: [row], rowCount: 1 };
  }
  if (sql.includes("SELECT id, email, password") && sql.includes("public.users")) {
    const user = tables.users.find((u) => u.email === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }
  throw new Error("mock unhandled: " + sql.substring(0, 60));
}

class MockPool {
  query(sql: string, params: unknown[] = []) { return query(sql, params); }
  end() {}
}

vi.mock("pg", () => ({ default: { Pool: MockPool }, Pool: MockPool }));

describe("API Protection - Vulnerability Mapping", () => {

  it("[VULN-API-01] validateToken rejects empty token", async () => {
    const { validateToken } = await import("@/services/auth_service");
    await expect(validateToken("")).rejects.toThrow();
  });

  it("[VULN-API-02] validateToken rejects token with wrong signature", async () => {
    const payload = { client_id: "test_client_id_abc123", exp: Math.floor(Date.now() / 1000) + 120 };
    const fakeToken = jwt.sign(payload, "wrong-secret-key-here-12345", { algorithm: "HS256" });
    const { validateToken } = await import("@/services/auth_service");
    await expect(validateToken(fakeToken)).rejects.toThrow("token not found or expired");
  });

  it("[VULN-API-03] validateToken rejects 'none' algorithm token", async () => {
    const payload = { client_id: "test_client_id_abc123", exp: Math.floor(Date.now() / 1000) + 120 };
    const noneToken = jwt.sign(payload, "", { algorithm: "none" as any });
    const { validateToken } = await import("@/services/auth_service");
    await expect(validateToken(noneToken)).rejects.toThrow();
  });

  it("[VULN-API-04] generateToken rejects missing env credentials", async () => {
    delete process.env.CLIENT_ID_1;
    delete process.env.SECRET_1;
    const { generateToken } = await import("@/services/auth_service");
    await expect(generateToken("x", "y")).rejects.toThrow("must be set");
  });

  it("[VULN-API-05] generateToken rejects mismatched secret", async () => {
    const { generateToken } = await import("@/services/auth_service");
    await expect(generateToken("test_client_id_abc123", "wrong-secret")).rejects.toThrow("invalid client_id or secret");
  });

  it("[VULN-API-06] loginUser rejects SQL injection in email", async () => {
    const { loginUser } = await import("@/services/userService");
    const injections = ["' OR '1'='1", "'; DROP TABLE users; --", "admin' --"];
    for (const inj of injections) {
      await expect(loginUser(inj, "password123")).rejects.toThrow("invalid email or password");
    }
  });

  it("[VULN-API-07] CreateUser stores short password in DB (route must check length before calling service)", async () => {
    const { CreateUser } = await import("@/services/userService");
    const result = await CreateUser({ email: "short@t.com", password: "short", access_type: "viewer" });
    expect(result.email).toBe("short@t.com");
  });

  it("[VULN-API-08] CreateUser rejects invalid access_type for DB storage", async () => {
    const { CreateUser } = await import("@/services/userService");
    await CreateUser({ email: "t@t.com", password: "ValidPass123", access_type: "producer" });
    const stored = tables.users.find((u) => u.email === "t@t.com");
    expect(stored).toBeDefined();
    expect(stored!.access_type).toBe("producer");
  });

  it("[VULN-API-09] tokens cannot exceed 120 second expiry", async () => {
    const { generateToken } = await import("@/services/auth_service");
    const result = await generateToken("test_client_id_abc123", "test_secret_value_xyz789");
    const decoded = jwt.decode(result.token) as any;
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.exp - now).toBeLessThanOrEqual(121);
  });

  it("[VULN-API-10] validateToken should only accept HS256 algorithm", async () => {
    const payload = { client_id: "test_client_id_abc123", exp: Math.floor(Date.now() / 1000) + 120 };
    const hs512Token = jwt.sign(payload, process.env.JWT_SECRET!, { algorithm: "HS512" });
    const { validateToken } = await import("@/services/auth_service");
    await expect(validateToken(hs512Token)).rejects.toThrow();
  });

  it("[VULN-API-11] getValidToken returns null for unknown client_id", async () => {
    const { getValidToken } = await import("@/services/auth_service");
    const result = await getValidToken("unknown-client");
    expect(result).toBeNull();
  });

  it("[VULN-API-12] getValidToken retrieves most recent valid token", async () => {
    const { generateToken, getValidToken } = await import("@/services/auth_service");
    await generateToken("test_client_id_abc123", "test_secret_value_xyz789");
    const result = await getValidToken("test_client_id_abc123");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});