import { NextResponse } from "next/server";
import { z } from "zod";
import { createRsvp } from "@/lib/supabase";

const rsvpSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  attending: z.boolean(),
  partySize: z.number().int().min(0).max(12),
  additionalGuests: z.array(z.string().trim().min(1).max(120)).max(11),
  dietaryRestrictions: z.string().trim().max(600),
  message: z.string().trim().max(1200),
}).superRefine((value, context) => {
  if (value.attending && value.partySize < 1) {
    context.addIssue({ code: "custom", path: ["partySize"], message: "Party size is required." });
  }
  if (!value.attending && value.partySize !== 0) {
    context.addIssue({ code: "custom", path: ["partySize"], message: "Declined responses must have a party size of zero." });
  }
});

export async function POST(request: Request) {
  const parsed = rsvpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted details and try again." }, { status: 400 });
  }

  try {
    const value = parsed.data;
    await createRsvp({
      first_name: value.firstName,
      last_name: value.lastName,
      attending: value.attending,
      party_size: value.attending ? value.partySize : 0,
      additional_guests: value.attending ? value.additionalGuests : [],
      dietary_restrictions: value.attending ? value.dietaryRestrictions : "",
      message: value.message,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && error.message === "RSVP_STORAGE_NOT_CONFIGURED"
      ? "Online RSVPs are being finalized. Please check back soon."
      : "We could not save your RSVP just now. Please try again.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
