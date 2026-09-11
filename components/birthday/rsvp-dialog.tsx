"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { useState, type FormEvent, type Ref } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "submitting" | "success" | "error";

type RsvpPayload = {
  firstName: FormDataEntryValue | null;
  lastName: FormDataEntryValue | null;
  attending: boolean;
  partySize: number;
  additionalGuests: string[];
  dietaryRestrictions: FormDataEntryValue | string | null;
  message: FormDataEntryValue | null;
};

async function sendRsvp(payload: RsvpPayload) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.NEXT_PUBLIC_STATIC_RSVP === "true") {
    if (!supabaseUrl || !publishableKey) {
      throw new Error("Online RSVPs are being finalized. Please check back soon.");
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rsvps`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        first_name: String(payload.firstName ?? "").trim(),
        last_name: String(payload.lastName ?? "").trim(),
        attending: payload.attending,
        party_size: payload.attending ? payload.partySize : 0,
        additional_guests: payload.attending ? payload.additionalGuests : [],
        dietary_restrictions: payload.attending ? String(payload.dietaryRestrictions ?? "").trim() : "",
        message: String(payload.message ?? "").trim(),
      }),
    });
    if (!response.ok) throw new Error("We could not save your RSVP just now. Please try again.");
    return;
  }

  const response = await fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "We could not save your RSVP.");
}

export function RsvpDialog({ buttonRef }: { buttonRef?: Ref<HTMLButtonElement> }) {
  const [open, setOpen] = useState(false);
  const [attending, setAttending] = useState("yes");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    const form = new FormData(event.currentTarget);
    const isAttending = attending === "yes";
    const partySize = isAttending ? Number(form.get("partySize")) : 0;
    const additionalGuests = isAttending
      ? String(form.get("additionalGuests") ?? "").split(/[\n,]+/).map((name) => name.trim()).filter(Boolean)
      : [];

    try {
      await sendRsvp({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        attending: isAttending,
        partySize,
        additionalGuests,
        dietaryRestrictions: isAttending ? form.get("dietaryRestrictions") : "",
        message: form.get("message"),
      });
      setStatus("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not save your RSVP.");
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button ref={buttonRef} size="lg" className="rsvp-breathe min-h-14 rounded-full border border-[#d7b56d]/80 bg-[#6f1d31] px-9 text-base font-semibold uppercase tracking-[.16em] text-[#fffaf0] shadow-[0_14px_34px_rgb(71_25_40/22%)] hover:bg-[#561626] focus-visible:ring-[#b38a45]">
          RSVP
          <span aria-hidden="true">→</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.25rem] border-[#b38a45]/60 bg-[#fffaf0] p-0 shadow-[0_32px_100px_rgb(39_15_20/35%)] sm:max-w-2xl">
        <div className="border-b border-[#b38a45]/35 px-6 py-6 sm:px-9">
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#8b5a25]">Kindly respond</p>
            <DialogTitle className="font-serif text-3xl font-normal text-[#351b1e]">Will you be joining us?</DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-[#6f5a51]">Please reply once for your household.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-7 sm:px-9 sm:pb-9">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="relative grid min-h-72 place-items-center overflow-hidden text-center">
                <div className="success-confetti absolute inset-0" aria-hidden="true">
                  {Array.from({ length: 14 }).map((_, index) => <span key={index} style={{ "--i": index } as React.CSSProperties} />)}
                </div>
                <div className="relative z-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 15 }} className="mx-auto mb-5 grid size-16 place-items-center rounded-full border border-[#b38a45] bg-[#f8f1e5] text-[#6f1d31]">
                    <Check className="size-8" strokeWidth={1.8} />
                  </motion.div>
                  <h3 className="font-serif text-4xl text-[#351b1e]">Thank you!</h3>
                  <p className="mt-3 max-w-sm text-lg text-[#6f5a51]">We look forward to celebrating with you.</p>
                  <Button type="button" variant="outline" className="mt-7 min-h-11 border-[#b38a45]/60 bg-transparent px-6 text-[#6f1d31]" onClick={() => setOpen(false)}>Close</Button>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-6 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-[#351b1e]">First name<Input required name="firstName" autoComplete="given-name" className="h-12 border-[#bca67f] bg-white/55 px-4 text-base" /></label>
                  <label className="grid gap-2 text-sm font-semibold text-[#351b1e]">Last name<Input required name="lastName" autoComplete="family-name" className="h-12 border-[#bca67f] bg-white/55 px-4 text-base" /></label>
                </div>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-[#351b1e]">Will you attend?</legend>
                  <RadioGroup value={attending} onValueChange={setAttending} className="grid grid-cols-2 gap-3">
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#bca67f] bg-white/45 px-4 has-[[data-state=checked]]:border-[#6f1d31] has-[[data-state=checked]]:bg-[#6f1d31]/[.06]"><RadioGroupItem id="attending-yes" value="yes" /><span>Joyfully accept</span></label>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#bca67f] bg-white/45 px-4 has-[[data-state=checked]]:border-[#6f1d31] has-[[data-state=checked]]:bg-[#6f1d31]/[.06]"><RadioGroupItem id="attending-no" value="no" /><span>Regretfully decline</span></label>
                  </RadioGroup>
                </fieldset>

                <AnimatePresence initial={false}>
                  {attending === "yes" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="grid gap-5 border-y border-[#b38a45]/25 py-6 sm:grid-cols-2">
                        <label className="grid content-start gap-2 text-sm font-semibold text-[#351b1e]">Number attending<Input required name="partySize" type="number" min="1" max="12" defaultValue="1" inputMode="numeric" className="h-12 border-[#bca67f] bg-white/55 px-4 text-base" /><span className="font-normal text-[#6f5a51]">Include yourself.</span></label>
                        <label className="grid gap-2 text-sm font-semibold text-[#351b1e]">Additional guest names<Textarea name="additionalGuests" rows={3} placeholder="One name per line" className="min-h-24 border-[#bca67f] bg-white/55 px-4 py-3 text-base" /></label>
                        <label className="grid gap-2 text-sm font-semibold text-[#351b1e] sm:col-span-2">Dietary restrictions<Textarea name="dietaryRestrictions" rows={2} placeholder="Optional" className="min-h-20 border-[#bca67f] bg-white/55 px-4 py-3 text-base" /></label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="grid gap-2 text-sm font-semibold text-[#351b1e]">A message for Sureshchandra<Textarea name="message" rows={3} placeholder="Optional" className="min-h-24 border-[#bca67f] bg-white/55 px-4 py-3 text-base" /></label>

                {error && <p role="alert" className="rounded-lg border border-[#9f2436]/30 bg-[#9f2436]/[.06] px-4 py-3 text-sm text-[#7e1c2b]">{error}</p>}

                <Button disabled={status === "submitting"} type="submit" className="min-h-13 w-full rounded-full bg-[#6f1d31] text-base font-semibold uppercase tracking-[.14em] text-[#fffaf0] hover:bg-[#561626]">
                  {status === "submitting" ? <><LoaderCircle className="animate-spin" /> Saving your reply</> : "Send RSVP"}
                </Button>
                <p className="text-center text-xs leading-relaxed text-[#6f5a51]">Your response is shared only with the hosting family.</p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
