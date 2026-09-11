import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-session";
import { listRsvps } from "@/lib/supabase";

export async function GET() {
  const cookieStore = await cookies();
  const authorized = await verifyAdminToken(
    cookieStore.get("birthday_admin")?.value,
    process.env.SESSION_SECRET,
  );
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ rsvps: await listRsvps() });
  } catch {
    return NextResponse.json({ error: "The RSVP list is unavailable." }, { status: 503 });
  }
}
