import { z } from "zod";
import { CATEGORY_VALUES } from "../drizzle/schema";
import * as db from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const categorySchema = z.enum(CATEGORY_VALUES);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다.");

function isRealDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const schoolItemBase = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
  category: categorySchema,
  startDate: dateSchema,
  endDate: dateSchema.nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

const validateSchoolItem = (value: z.infer<typeof schoolItemBase>, ctx: z.RefinementCtx) => {
  if (!isRealDate(value.startDate)) {
    ctx.addIssue({ code: "custom", path: ["startDate"], message: "실제 날짜를 입력해 주세요." });
  }
  if (value.endDate) {
    if (!isRealDate(value.endDate)) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "실제 날짜를 입력해 주세요." });
    } else if (value.endDate < value.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "종료일은 시작일 이후여야 합니다." });
    }
  }
};

const schoolItemInput = schoolItemBase.superRefine(validateSchoolItem);
const schoolItemUpdateInput = schoolItemBase.extend({ id: z.number().int().positive() }).superRefine(validateSchoolItem);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  schoolItems: router({
    list: publicProcedure
      .input(z.object({ category: categorySchema.optional(), date: dateSchema.optional() }).optional())
      .query(({ input }) => db.listSchoolItems(input ?? {})),
    create: adminProcedure.input(schoolItemInput).mutation(async ({ input }) => {
      await db.createSchoolItem({
        ...input,
        endDate: input.endDate ?? null,
        description: input.description?.trim() || null,
      });
      return { success: true } as const;
    }),
    update: adminProcedure.input(schoolItemUpdateInput).mutation(async ({ input }) => {
      const { id, ...item } = input;
      await db.updateSchoolItem(id, {
        ...item,
        endDate: item.endDate ?? null,
        description: item.description?.trim() || null,
      });
      return { success: true } as const;
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await db.deleteSchoolItem(input.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
