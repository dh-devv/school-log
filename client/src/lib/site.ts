export const SITE_BASE = import.meta.env.BASE_URL;
export const ROUTER_BASE = SITE_BASE === "/" ? "" : SITE_BASE.replace(/\/$/, "");
export const homeHref = SITE_BASE;
export const adminHref = `${SITE_BASE}admin`;
export const signupHref = `${SITE_BASE}signup`;
export const recordsHref = `${SITE_BASE}#records`;
