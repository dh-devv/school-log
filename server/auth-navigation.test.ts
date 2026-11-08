import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import Home from "../client/src/pages/Home";
import Admin from "../client/src/pages/Admin";
import { adminHref, signupHref } from "../client/src/lib/site";

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: null,
  listPublicSchoolItems: vi.fn(),
}));
vi.mock("@/hooks/useSupabaseAuth", () => ({
  useSupabaseAuth: () => ({ loading: false, error: null, user: null, role: null }),
}));

describe("authentication navigation", () => {
  it("offers separate login and registration links on the home page", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toContain(`href="${adminHref}">로그인</a>`);
    expect(html).toContain(`href="${signupHref}">회원가입</a>`);
  });

  it("opens the common login form with a link to registration", () => {
    const html = renderToStaticMarkup(createElement(Admin, {}));
    expect(html).toContain("<h1>로그인</h1>");
    expect(html).toContain(`href="${signupHref}">회원가입</a>`);
  });

  it("opens the registration form directly with a link back to login", () => {
    const html = renderToStaticMarkup(createElement(Admin, { initialRegistering: true }));
    expect(html).toContain("<h1>선생님 회원가입</h1>");
    expect(html).toContain(`href="${adminHref}">로그인으로 돌아가기</a>`);
  });
});
