import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { client, createClient } = vi.hoisted(() => {
  const client = {
    rpc: vi.fn(),
    from: vi.fn(),
  };
  return { client, createClient: vi.fn(() => client) };
});

vi.mock("@supabase/supabase-js", () => ({ createClient }));

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project-test.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-test-key");
  vi.stubGlobal("window", {
    localStorage: { removeItem: vi.fn() },
    sessionStorage: {},
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("teacher approval API", () => {
  it("requests and approves accounts through the restricted database functions", async () => {
    const accounts = [{ id: "test-id", email: "teacher@example.test", created_at: "2026-01-01" }];
    client.rpc.mockResolvedValueOnce({ data: accounts, error: null }).mockResolvedValueOnce({ error: null });
    const { listPendingTeachers, approveTeacher } = await import("../client/src/lib/supabase");

    await expect(listPendingTeachers()).resolves.toEqual(accounts);
    await approveTeacher("test-id");
    expect(client.rpc).toHaveBeenNthCalledWith(1, "pending_teacher_accounts");
    expect(client.rpc).toHaveBeenNthCalledWith(2, "approve_teacher_account", { account_id: "test-id" });
  });

  it("propagates denied approval and listing errors", async () => {
    const denied = new Error("권한 없음");
    client.rpc.mockResolvedValue({ error: denied });
    const { listPendingTeachers, approveTeacher } = await import("../client/src/lib/supabase");
    await expect(listPendingTeachers()).rejects.toThrow("권한 없음");
    await expect(approveTeacher("test-id")).rejects.toThrow("권한 없음");
  });

  it("recognizes owner roles and rejects missing or invalid roles", async () => {
    const maybeSingle = vi.fn().mockResolvedValueOnce({ data: { role: "owner" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { role: "unexpected" }, error: null });
    client.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle }) }) });
    const { getProfileRole } = await import("../client/src/lib/supabase");
    await expect(getProfileRole("test-id")).resolves.toBe("owner");
    await expect(getProfileRole("test-id")).rejects.toThrow("계정 권한");
    await expect(getProfileRole("test-id")).rejects.toThrow("계정 권한");
  });
});
