import { afterEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

function makeStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  createClient.mockReset();
});

describe("Supabase authentication storage", () => {
  it("uses tab storage and removes only the old project session from local storage", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://project-test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-test-key");
    const localStorage = makeStorage();
    const sessionStorage = makeStorage();
    localStorage.setItem("sb-project-test-auth-token", "old-session");
    localStorage.setItem("unrelated", "keep");
    vi.stubGlobal("window", { localStorage, sessionStorage });

    await import("../client/src/lib/supabase");

    expect(localStorage.getItem("sb-project-test-auth-token")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
    const options = createClient.mock.calls[0][2];
    expect(options.auth).toMatchObject({
      persistSession: true,
      storage: sessionStorage,
      autoRefreshToken: true,
    });

    options.auth.storage.setItem("session", "signed-in");
    vi.resetModules();
    await import("../client/src/lib/supabase");
    expect(createClient.mock.calls[1][2].auth.storage.getItem("session")).toBe("signed-in");

    const newTabStorage = makeStorage();
    vi.stubGlobal("window", { localStorage, sessionStorage: newTabStorage });
    vi.resetModules();
    await import("../client/src/lib/supabase");
    expect(createClient.mock.calls[2][2].auth.storage.getItem("session")).toBeNull();
  });

  it("does not access browser storage if Supabase is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    const { supabase } = await import("../client/src/lib/supabase");
    expect(supabase).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
