import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminToken, secureEqual } from "@/lib/admin-session";

const schema = z.object({ password: z.string().min(1).max(256) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!parsed.success || !expected || !secret) {
    return NextResponse.json({ error: expected && secret ? "Enter the admin password." : "Admin access is not configured." }, { status: expected && secret ? 400 : 503 });
  }
  if (!(await secureEqual(parsed.data.password, expected))) {
    return NextResponse.json({ error: "That password is not correct." }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set("birthday_admin", await createAdminToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return NextResponse.json({ ok: true });
}
