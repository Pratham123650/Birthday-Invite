import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("birthday_admin", "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
