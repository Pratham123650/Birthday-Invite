import { NextResponse } from "next/server";
import { z } from "zod";
import { findApprovedGuest, isApprovedGuestName } from "@/lib/guests";
import { submitRsvp } from "@/lib/supabase";

const rsvpSchema = z.object({
  guestName: z.string().trim().refine(isApprovedGuestName, "Select an approved guest."),
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
  if (value.attending && value.additionalGuests.length !== value.partySize - 1) {
    context.addIssue({ code: "custom", path: ["additionalGuests"], message: "Enter one name for each additional guest." });
  }
  if (!value.attending && value.additionalGuests.length !== 0) {
    context.addIssue({ code: "custom", path: ["additionalGuests"], message: "Declined responses cannot include additional guests." });
  }
});

export async function POST(request: Request) {
  const parsed = rsvpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted details and try again." }, { status: 400 });
  }

  try {
    const value = parsed.data;
    const approvedGuest = findApprovedGuest(value.guestName);
    if (!approvedGuest) return NextResponse.json({ error: "Please select your name from the guest list." }, { status: 400 });
    const result = await submitRsvp({
      guest_name: approvedGuest.name,
      attending: value.attending,
      party_size: value.attending ? value.partySize : 0,
      additional_guests: value.attending ? value.additionalGuests : [],
      dietary_restrictions: value.attending ? value.dietaryRestrictions : "",
      message: value.message,
    });
    return NextResponse.json({ ok: true, status: result.status, guestName: result.guest_name });
  } catch (error) {
    const message = error instanceof Error && error.message === "RSVP_STORAGE_NOT_CONFIGURED"
      ? "Online RSVPs are being finalized. Please check back soon."
      : "We could not save your RSVP just now. Please try again.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
