import { describe, it, expect } from "vitest";

const BASE = process.env.STELLARCAST_BASE_URL || "http://localhost:3000";
const CONCURRENCY = 15;
const TOTAL_USERS = 1000;

async function getMachineToken(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("failed to get machine token: " + (await res.text()).slice(0, 100));
  const data = await res.json();
  return data.token;
}

async function createViewer(email: string, token: string): Promise<Response> {
  return fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password: "SecurePass123!", access_type: "viewer" }),
  });
}

describe("Live Load Test - Register viewer users against real DB", { timeout: 300000 }, () => {
  let machineToken: string;

  it("should get machine token", async () => {
    machineToken = await getMachineToken();
    expect(machineToken).toBeTruthy();
  });

  it(`should create ${TOTAL_USERS} viewer users with ${CONCURRENCY} concurrent requests`, async () => {
    const emails = Array.from({ length: TOTAL_USERS }, (_, i) => `loadtest${i}@viewer.com`);

    const start = performance.now();

    const batches: Promise<{ email: string; status: number; body: string }[]>[] = [];
    for (let i = 0; i < emails.length; i += CONCURRENCY) {
      const batch = emails.slice(i, i + CONCURRENCY).map(async (email) => {
        const res = await createViewer(email, machineToken);
        return { email, status: res.status, body: await res.text() };
      });
      batches.push(Promise.all(batch));
    }

    const results = await Promise.all(batches);
    const elapsed = performance.now() - start;
    const flat = results.flat();
    const durationSec = (elapsed / 1000).toFixed(2);

    const created = flat.filter((r) => r.status === 201);
    const failed = flat.filter((r) => r.status !== 201);

    console.log(`[LOAD] Created ${created.length} / ${TOTAL_USERS} viewer accounts in ${durationSec}s (concurrency=${CONCURRENCY})`);
    console.log(`[LOAD] Throughput: ${(created.length / Number(durationSec)).toFixed(0)} users/s`);
    console.log(`[LOAD] Avg: ${(elapsed / TOTAL_USERS).toFixed(1)}ms per user`);

    if (failed.length > 0) {
      console.log(`[LOAD] Failed: ${failed.length}`);
      for (const f of failed.slice(0, 5)) {
        console.log(`  - ${f.email}: ${f.status} ${f.body.slice(0, 100)}`);
      }
    }

    expect(created.length).toBeGreaterThan(0);
  }, 600000);
});