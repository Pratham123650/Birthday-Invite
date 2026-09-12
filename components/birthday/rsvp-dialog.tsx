"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, LoaderCircle, X } from "lucide-react";
import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { approvedGuests, findApprovedGuest, isApprovedGuestName } from "@/lib/guests";

type Status = "idle" | "submitting" | "success" | "error";
type SaveResult = { status: "created" | "updated"; guestName: string };

type RsvpPayload = {
  guestName: string;
  attending: boolean;
  partySize: number;
  additionalGuests: string[];
  dietaryRestrictions: string;
  message: string;
};

async function sendRsvp(payload: RsvpPayload): Promise<SaveResult> {
  const response = await fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as { error?: string; status?: "created" | "updated"; guestName?: string };
  if (!response.ok) throw new Error(result.error || "We could not save your RSVP.");
  return {
    status: result.status === "updated" ? "updated" : "created",
    guestName: result.guestName || payload.guestName,
  };
}

export function RsvpDialog({ pulse = false }: { pulse?: boolean }) {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState("yes");
  const [partySizeInput, setPartySizeInput] = useState("1");
  const replaceInitialPartySizeRef = useRef(true);
  const [additionalGuests, setAdditionalGuests] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [error, setError] = useState("");

  const selectedGuest = findApprovedGuest(guestName);

  function changePartySize(value: string) {
    let nextInput = value.replace(/\D/g, "").slice(0, 2);
    if (replaceInitialPartySizeRef.current && partySizeInput === "1" && nextInput.length > 1 && nextInput.startsWith("1")) {
      nextInput = nextInput.slice(1);
    }
    replaceInitialPartySizeRef.current = false;
    setPartySizeInput(nextInput);
    const nextSize = Number.parseInt(nextInput, 10);
    if (Number.isInteger(nextSize) && nextSize >= 1 && nextSize <= 12) {
      setAdditionalGuests((current) => Array.from({ length: nextSize - 1 }, (_, index) => current[index] ?? ""));
    }
  }

  function normalizePartySize() {
    const parsed = Number.parseInt(partySizeInput, 10);
    const nextSize = Number.isInteger(parsed) ? Math.min(12, Math.max(1, parsed)) : 1;
    setPartySizeInput(String(nextSize));
    replaceInitialPartySizeRef.current = nextSize === 1;
    setAdditionalGuests((current) => Array.from({ length: nextSize - 1 }, (_, index) => current[index] ?? ""));
  }

  function changeAdditionalGuest(index: number, value: string) {
    setAdditionalGuests((current) => current.map((name, currentIndex) => currentIndex === index ? value : name));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isApprovedGuestName(guestName)) {
      setStatus("error");
      setError("Please select your name from the approved guest list.");
      return;
    }

    const isAttending = attending === "yes";
    const partySize = Number.parseInt(partySizeInput, 10);
    if (isAttending && (!Number.isInteger(partySize) || partySize < 1 || partySize > 12)) {
      setStatus("error");
      setError("Please enter a number attending between 1 and 12.");
      return;
    }
    const trimmedAdditionalGuests = isAttending ? additionalGuests.map((name) => name.trim()) : [];
    if (isAttending && trimmedAdditionalGuests.some((name) => !name)) {
      setStatus("error");
      setError("Please enter the name of each additional guest.");
      return;
    }

    setStatus("submitting");
    try {
      const result = await sendRsvp({
        guestName,
        attending: isAttending,
        partySize: isAttending ? partySize : 0,
        additionalGuests: trimmedAdditionalGuests,
        dietaryRestrictions: isAttending ? dietaryRestrictions.trim() : "",
        message: message.trim(),
      });
      setSaveResult(result);
      setStatus("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not save your RSVP.");
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={`${pulse ? "rsvp-arrived" : ""} min-h-14 rounded-full border border-[#d7b56d]/80 bg-[#6f1d31] px-9 text-base font-semibold uppercase tracking-[.16em] text-[#fffaf0] shadow-[0_14px_34px_rgb(71_25_40/22%)] hover:bg-[#561626] focus-visible:ring-[#b38a45]`}>
          RSVP
          <span aria-hidden="true">→</span>
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="rsvp-sheet grid max-h-[94svh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border-[#b38a45]/60 bg-[#fffaf0] p-0 shadow-[0_32px_100px_rgb(39_15_20/35%)] sm:max-w-2xl sm:rounded-[1.25rem]">
        <div className="relative border-b border-[#b38a45]/35 bg-[#fffaf0] px-5 py-5 pr-16 sm:px-9 sm:py-6 sm:pr-16">
          <DialogClose asChild>
            <button type="button" aria-label="Close RSVP" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-[#6f1d31] transition-colors hover:bg-[#6f1d31]/[.07] focus-visible:outline-2 focus-visible:outline-offset-2 sm:right-4 sm:top-4">
              <X className="size-5" aria-hidden="true" />
            </button>
          </DialogClose>
          <DialogHeader className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#8b5a25]">Kindly respond</p>
            <DialogTitle className="font-serif text-[clamp(1.8rem,8vw,2.35rem)] font-normal leading-tight text-[#351b1e]">Will you be joining us?</DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-[#6f5a51]">Select your name and reply for your household.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="overscroll-contain overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-9 sm:pb-9">
          <AnimatePresence mode="wait">
            {status === "success" && saveResult ? (
              <motion.div key="success" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className="relative grid min-h-[min(30rem,70svh)] place-items-center overflow-hidden py-8 text-center">
                <div className="success-confetti absolute inset-0" aria-hidden="true">
                  {Array.from({ length: 14 }).map((_, index) => <span key={index} style={{ "--i": index } as CSSProperties} />)}
                </div>
                <div className="relative z-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 15 }} className="mx-auto mb-5 grid size-16 place-items-center rounded-full border border-[#b38a45] bg-[#f8f1e5] text-[#6f1d31]">
                    <Check className="size-8" strokeWidth={1.8} />
                  </motion.div>
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#8b5a25]">{saveResult.status === "updated" ? "Response updated" : "Response received"}</p>
                  <h3 className="mt-2 font-serif text-4xl text-[#351b1e]">Thank you, {findApprovedGuest(saveResult.guestName)?.firstName ?? saveResult.guestName}!</h3>
                  <p className="mx-auto mt-3 max-w-sm text-lg leading-relaxed text-[#6f5a51]">
                    {attending === "yes" ? "We’re delighted you’ll be celebrating with us." : "Thank you for letting us know. You’ll be missed."}
                  </p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="outline" className="min-h-12 border-[#b38a45]/60 bg-transparent px-6 text-[#6f1d31]" onClick={() => setStatus("idle")}>Update response</Button>
                    <DialogClose asChild><Button type="button" className="min-h-12 bg-[#6f1d31] px-6 text-[#fffaf0]">Close</Button></DialogClose>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="space-y-6 py-6">
                <label className="grid gap-2 text-base font-semibold text-[#351b1e]">
                  Who are you?
                  <select required value={guestName} onChange={(event) => { setGuestName(event.target.value); setError(""); }} className="min-h-13 w-full rounded-xl border border-[#bca67f] bg-white/70 px-4 py-3 text-base text-[#351b1e] outline-none focus-visible:border-[#8b5a25] focus-visible:ring-3 focus-visible:ring-[#b38a45]/25">
                    <option value="">Select your name</option>
                    {approvedGuests.map((guest) => <option key={guest.key} value={guest.name}>{guest.name}</option>)}
                  </select>
                </label>

                <AnimatePresence initial={false}>
                  {selectedGuest && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#b38a45]/35 bg-[#f8f1e5] px-4 py-3 text-base leading-relaxed text-[#6f1d31]">
                      Welcome, <strong>{selectedGuest.firstName}</strong>. We’re so glad you’re here.
                    </motion.p>
                  )}
                </AnimatePresence>

                <fieldset>
                  <legend className="mb-3 text-base font-semibold text-[#351b1e]">Will you attend?</legend>
                  <RadioGroup value={attending} onValueChange={(value) => { setAttending(value); setError(""); }} className="grid gap-3 sm:grid-cols-2">
                    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-[#bca67f] bg-white/50 px-4 text-base has-[[data-state=checked]]:border-[#6f1d31] has-[[data-state=checked]]:bg-[#6f1d31]/[.06]"><RadioGroupItem id="attending-yes" value="yes" className="size-5" /><span>Yes, I’ll be there</span></label>
                    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-[#bca67f] bg-white/50 px-4 text-base has-[[data-state=checked]]:border-[#6f1d31] has-[[data-state=checked]]:bg-[#6f1d31]/[.06]"><RadioGroupItem id="attending-no" value="no" className="size-5" /><span>No, I can’t make it</span></label>
                  </RadioGroup>
                </fieldset>

                <AnimatePresence initial={false}>
                  {attending === "yes" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="space-y-5 border-y border-[#b38a45]/25 py-6">
                        <label className="grid gap-2 text-base font-semibold text-[#351b1e]">Number attending
                          <Input
                            required
                            type="number"
                            min="1"
                            max="12"
                            inputMode="numeric"
                            enterKeyHint="done"
                            value={partySizeInput}
                            onFocus={(event) => {
                              replaceInitialPartySizeRef.current = partySizeInput === "1";
                              event.currentTarget.select();
                            }}
                            onClick={(event) => {
                              if (partySizeInput === "1") {
                                replaceInitialPartySizeRef.current = true;
                                event.currentTarget.select();
                              }
                            }}
                            onChange={(event) => changePartySize(event.target.value)}
                            onBlur={normalizePartySize}
                            className="h-13 border-[#bca67f] bg-white/70 px-4 text-base"
                          />
                          <span className="text-sm font-normal text-[#6f5a51]">Include yourself.</span>
                        </label>

                        {additionalGuests.length > 0 && (
                          <fieldset className="space-y-3">
                            <legend className="text-base font-semibold text-[#351b1e]">Additional guest names</legend>
                            {additionalGuests.map((name, index) => (
                              <label key={index} className="grid gap-2 text-sm font-semibold text-[#6f5a51]">Guest {index + 2}
                                <Input required value={name} onChange={(event) => changeAdditionalGuest(index, event.target.value)} autoComplete="off" className="h-13 border-[#bca67f] bg-white/70 px-4 text-base text-[#351b1e]" />
                              </label>
                            ))}
                          </fieldset>
                        )}

                        <label className="grid gap-2 text-base font-semibold text-[#351b1e]">Dietary restrictions
                          <Textarea value={dietaryRestrictions} onChange={(event) => setDietaryRestrictions(event.target.value)} rows={2} maxLength={600} placeholder="Optional" className="min-h-24 border-[#bca67f] bg-white/70 px-4 py-3 text-base" />
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="grid gap-2 text-base font-semibold text-[#351b1e]">A message for Sureshchandra
                  <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={1200} placeholder="Optional" className="min-h-24 border-[#bca67f] bg-white/70 px-4 py-3 text-base" />
                </label>

                {error && <p role="alert" className="rounded-xl border border-[#9f2436]/30 bg-[#9f2436]/[.06] px-4 py-3 text-sm leading-relaxed text-[#7e1c2b]">{error}</p>}

                <Button disabled={status === "submitting"} type="submit" className="min-h-14 w-full rounded-full bg-[#6f1d31] text-base font-semibold uppercase tracking-[.14em] text-[#fffaf0] hover:bg-[#561626]">
                  {status === "submitting" ? <><LoaderCircle className="animate-spin" /> Saving your reply</> : "Send RSVP"}
                </Button>
                <p className="text-center text-sm leading-relaxed text-[#6f5a51]">Submitting again with the same name updates the previous response.</p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
