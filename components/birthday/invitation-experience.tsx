"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronDown, Clock3, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { event } from "@/lib/event";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const RsvpDialog = dynamic(
  () => import("@/components/birthday/rsvp-dialog").then((module) => module.RsvpDialog),
  {
    ssr: false,
    loading: () => (
      <button type="button" disabled className="min-h-14 rounded-full border border-[#d7b56d]/80 bg-[#6f1d31] px-9 text-base font-semibold uppercase tracking-[.16em] text-[#fffaf0] shadow-[0_14px_34px_rgb(71_25_40/22%)]">
        RSVP <span aria-hidden="true">→</span>
      </button>
    ),
  },
);

type ScenePhase =
  | "intro"
  | "hero"
  | "scrolling-message"
  | "message"
  | "scrolling-details"
  | "details"
  | "scrolling-rsvp"
  | "rsvp"
  | "done"
  | "cancelled";

const guidedPhases = new Set<ScenePhase>([
  "intro", "hero", "scrolling-message", "message", "scrolling-details", "details", "scrolling-rsvp", "rsvp",
]);

function waitFor(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

function sceneEase(progress: number) {
  let t = progress;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const inverse = 1 - t;
    const x = 3 * inverse * inverse * t * .65 + 3 * inverse * t * t * .35 + t * t * t;
    const derivative = 3 * inverse * inverse * .65 + 6 * inverse * t * (.35 - .65) + 3 * t * t * (1 - .35);
    if (Math.abs(derivative) < .0001) break;
    t = Math.min(1, Math.max(0, t - (x - progress) / derivative));
  }
  const inverse = 1 - t;
  return 3 * inverse * t * t + t * t * t;
}

function scrollToScene(element: HTMLElement, signal: AbortSignal, duration = 820) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const start = window.scrollY;
    const rect = element.getBoundingClientRect();
    const unclampedTarget = start + rect.top + rect.height / 2 - window.innerHeight / 2;
    const target = Math.max(0, Math.min(unclampedTarget, document.documentElement.scrollHeight - window.innerHeight));
    if (Math.abs(target - start) < 2) return resolve();

    const startedAt = performance.now();
    let frame = 0;
    const cancel = () => {
      window.cancelAnimationFrame(frame);
      resolve();
    };
    signal.addEventListener("abort", cancel, { once: true });

    const step = (now: number) => {
      if (signal.aborted) return;
      const progress = Math.min((now - startedAt) / duration, 1);
      window.scrollTo(0, start + (target - start) * sceneEase(progress));
      if (progress < 1) frame = window.requestAnimationFrame(step);
      else {
        signal.removeEventListener("abort", cancel);
        resolve();
      }
    };
    frame = window.requestAnimationFrame(step);
  });
}
const confetti = [
  ["-52px", "-38px", "45deg", "#6f1d31"], ["-31px", "-56px", "-35deg", "#b38a45"],
  ["0px", "-64px", "80deg", "#2f5d50"], ["34px", "-52px", "120deg", "#6f1d31"],
  ["54px", "-30px", "170deg", "#b38a45"], ["-60px", "-6px", "210deg", "#2f5d50"],
  ["62px", "2px", "260deg", "#6f1d31"], ["-38px", "18px", "310deg", "#b38a45"],
];

function Toran() {
  return (
    <div className="absolute inset-x-4 top-4 flex items-start justify-center text-[#8b5a25] sm:inset-x-8" aria-hidden="true">
      <div className="h-px w-[min(34vw,15rem)] bg-current/45" />
      <div className="-mt-1.5 mx-3 h-3 w-3 rotate-45 border border-current" />
      <div className="-mt-px flex gap-3">
        {[0, 1, 2].map((item) => <span key={item} className="block h-3 w-3 rotate-45 border-b border-r border-current/60" />)}
      </div>
      <div className="-mt-1.5 mx-3 h-3 w-3 rotate-45 border border-current" />
      <div className="h-px w-[min(34vw,15rem)] bg-current/45" />
    </div>
  );
}

function Intro({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="intro-screen fixed inset-0 z-[100] grid place-items-center bg-[#f8f1e5]" role="status" aria-label="Opening the birthday invitation">
      <button onClick={onSkip} className="absolute right-4 top-4 min-h-11 px-4 text-sm font-semibold uppercase tracking-[.16em] text-[#6f1d31] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">Skip</button>
      <div className="intro-cake relative flex h-44 w-44 items-end justify-center" aria-hidden="true">
        <div className="absolute bottom-7 h-16 w-28 rounded-t-[2rem] border border-[#b38a45] bg-[#fffaf0] shadow-[0_12px_35px_rgb(68_31_28/12%)]">
          <div className="absolute left-0 right-0 top-4 h-px bg-[#b38a45]/50" />
          <div className="absolute left-0 right-0 top-8 text-center font-serif text-lg text-[#6f1d31]">75</div>
        </div>
        <div className="absolute bottom-[5.65rem] h-10 w-1.5 rounded-full bg-[#6f1d31]" />
        <div className="intro-flame absolute bottom-[8.1rem] h-6 w-4 origin-bottom rounded-[60%_40%_55%_45%] bg-[#c99a3d] shadow-[0_0_16px_rgb(201_154_61/55%)]" />
        <div className="intro-smoke absolute bottom-[8.2rem] h-7 w-4 rounded-full border-l border-[#6f5a51]" />
        <div className="intro-confetti absolute left-1/2 top-1/2">
          {confetti.map(([x, y, r, color], index) => (
            <span key={index} className="absolute h-2 w-1" style={{ "--x": x, "--y": y, "--r": r, backgroundColor: color } as CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RevealSection({ children, className = "", sectionRef, id, guidedReveal }: { children: ReactNode; className?: string; sectionRef?: RefObject<HTMLElement | null>; id?: string; guidedReveal?: boolean }) {
  const reduceMotion = useReducedMotion();
  const controlled = typeof guidedReveal === "boolean";
  const hidden = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 };
  const visible = { opacity: 1, y: 0 };
  return (
    <motion.section
      id={id}
      ref={sectionRef}
      initial={reduceMotion ? false : hidden}
      animate={controlled ? (guidedReveal ? visible : hidden) : undefined}
      whileInView={controlled ? undefined : visible}
      viewport={{ once: true, amount: .18 }}
      transition={{ duration: .75, ease: [.22, .8, .25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function InvitationExperience() {
  const [showIntro, setShowIntro] = useState(true);
  const [phase, setPhase] = useState<ScenePhase>("intro");
  const sequenceAbortRef = useRef<AbortController | null>(null);
  const messageRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);
  const messageContentRef = useRef<HTMLDivElement>(null);
  const detailsContentRef = useRef<HTMLDivElement>(null);
  const rsvpContentRef = useRef<HTMLDivElement>(null);

  const cancelJourney = useCallback(() => {
    sequenceAbortRef.current?.abort();
    setShowIntro(false);
    setPhase("cancelled");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    sequenceAbortRef.current = controller;
    const { signal } = controller;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const interrupt = () => cancelJourney();
    const interruptOnKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) interrupt();
    };
    const options = { passive: true, signal } as AddEventListenerOptions;
    window.addEventListener("wheel", interrupt, options);
    window.addEventListener("touchstart", interrupt, options);
    window.addEventListener("pointerdown", interrupt, options);
    window.addEventListener("click", interrupt, options);
    window.addEventListener("keydown", interruptOnKey, { signal });

    const run = async () => {
      if (reduceMotion) {
        await waitFor(240, signal);
        if (signal.aborted) return;
        setShowIntro(false);
        setPhase("done");
        controller.abort();
        return;
      }

      await waitFor(1180, signal);
      if (signal.aborted) return;
      setPhase("hero");
      await waitFor(300, signal);
      if (signal.aborted) return;
      setShowIntro(false);
      await waitFor(2100, signal);
      if (signal.aborted || !messageContentRef.current) return;

      setPhase("scrolling-message");
      await scrollToScene(messageContentRef.current, signal);
      await waitFor(130, signal);
      if (signal.aborted) return;
      setPhase("message");
      await waitFor(2250, signal);
      if (signal.aborted || !detailsContentRef.current) return;

      setPhase("scrolling-details");
      await scrollToScene(detailsContentRef.current, signal);
      await waitFor(130, signal);
      if (signal.aborted) return;
      setPhase("details");
      await waitFor(2500, signal);
      if (signal.aborted || !rsvpContentRef.current) return;

      setPhase("scrolling-rsvp");
      await scrollToScene(rsvpContentRef.current, signal, 860);
      await waitFor(130, signal);
      if (signal.aborted) return;
      setPhase("rsvp");
      await waitFor(900, signal);
      if (signal.aborted) return;
      setPhase("done");
      controller.abort();
    };

    void run();
    return () => {
      controller.abort();
      window.history.scrollRestoration = previousRestoration;
    };
  }, [cancelJourney]);

  const guided = guidedPhases.has(phase);
  const messageRevealed = ["message", "scrolling-details", "details", "scrolling-rsvp", "rsvp"].includes(phase);
  const detailsRevealed = ["details", "scrolling-rsvp", "rsvp"].includes(phase);
  const rsvpRevealed = phase === "rsvp";

  return (
    <main className="paper-texture min-h-screen overflow-x-hidden" data-guided-phase={phase}>
      {showIntro && <Intro onSkip={cancelJourney} />}
      {guided && !showIntro && (
        <button onClick={cancelJourney} className="fixed right-4 top-4 z-50 min-h-11 rounded-full border border-[#b38a45]/45 bg-[#fffaf0]/85 px-4 text-xs font-semibold uppercase tracking-[.14em] text-[#6f1d31] shadow-sm backdrop-blur-md hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3">
          Skip
        </button>
      )}

      <section className="relative grid min-h-[100svh] place-items-center px-5 py-16 sm:px-8" aria-labelledby="hero-title">
        <Toran />
        <div className={`${phase === "intro" ? "" : "hero-reveal"} mx-auto grid w-full max-w-6xl items-center gap-10 pt-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-16`}>
          <div className="text-center lg:text-left">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[.28em] text-[#8b5a25]">A milestone to remember</p>
            <div className="relative mx-auto h-[7.6rem] w-[min(100%,18rem)] font-serif text-[7.5rem] leading-none tracking-[-.08em] text-[#6f1d31] sm:h-[10rem] sm:text-[9.8rem] lg:mx-0" aria-label="Seventy-five">
              <span className="numeral-western absolute inset-0">{event.westernNumeral}</span>
              <span className="numeral-gujarati absolute inset-0" lang="gu">{event.gujaratiNumeral}</span>
            </div>
            <p className="mb-5 font-serif text-2xl text-[#8b5a25] sm:text-3xl" lang="gu">{event.gujaratiMilestone}</p>
            <h1 id="hero-title" className="text-balance font-serif text-[clamp(2.35rem,7vw,5.2rem)] leading-[.96] tracking-[-.04em] text-[#351b1e]">
              Celebrating <span className="italic text-[#6f1d31]">{event.honoree}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#6f5a51] lg:mx-0">Join our family in honoring seventy-five wonderful years of love, wisdom, and cherished memories.</p>
            <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-y border-[#b38a45]/45 py-3 text-[.95rem] font-semibold uppercase tracking-[.1em] text-[#6f1d31] lg:justify-start">
              <time dateTime={event.dateISO}>{event.date}</time><span aria-hidden="true" className="text-[#b38a45]">◆</span><span>{event.time}</span>
            </div>
            <a href="#invitation" className="mx-auto mt-9 flex w-fit min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[.18em] text-[#6f1d31] underline-offset-8 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 lg:mx-0">
              Open the invitation <ChevronDown className="size-4" aria-hidden="true" />
            </a>
          </div>

          <figure className="mx-auto w-full max-w-[25rem] lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[9rem] border border-[#b38a45]/65 bg-[#e8dbc5] p-2 shadow-[0_24px_70px_rgb(68_31_28/18%)] sm:rounded-t-[13rem]">
              <div className="relative h-full w-full overflow-hidden rounded-t-[8.4rem] sm:rounded-t-[12.4rem]">
                <Image src={`${basePath}/sureshchandra.jpeg`} alt="Sureshchandra, whose 75th birthday we are celebrating" fill priority sizes="(max-width: 1024px) 90vw, 45vw" className="scale-[1.18] object-cover object-[50%_54%]" />
                <div className="absolute inset-0 bg-[#6f1d31]/[.02]" />
              </div>
            </div>
            <figcaption className="mt-4 text-center text-xs font-semibold uppercase tracking-[.24em] text-[#8b5a25]">20 · 09 · 2026</figcaption>
          </figure>
        </div>
      </section>

      <RevealSection id="invitation" sectionRef={messageRef} guidedReveal={guided ? messageRevealed : undefined} className="relative grid min-h-[82svh] place-items-center overflow-hidden bg-[#6f1d31] px-6 py-24 text-[#fffaf0]">
        <div className="absolute inset-y-0 left-1/2 w-px bg-[#d7b56d]/20" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-24 w-px bg-[#d7b56d]/80" aria-hidden="true" />
        <div ref={messageContentRef} className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[.26em] text-[#d7b56d]">A life beautifully lived</p>
          <h2 className="mt-7 text-balance font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[1.02] tracking-[-.035em]">75 years. Countless memories. One remarkable journey.</h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#f1e5d5]">With grateful hearts, we invite you to celebrate the stories, values, and enduring warmth Sureshchandra has shared with us all.</p>
          <div className="mx-auto mt-12 h-10 w-10 rotate-45 border border-[#d7b56d]/70" aria-hidden="true"><div className="m-[7px] h-6 w-6 border border-[#d7b56d]/40" /></div>
        </div>
      </RevealSection>

      <RevealSection sectionRef={detailsRef} guidedReveal={guided ? detailsRevealed : undefined} className="relative px-5 py-24 sm:px-8 lg:py-32">
        <div ref={detailsContentRef} className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[.25em] text-[#8b5a25]">Save the date</p>
            <h2 className="mt-4 font-serif text-[clamp(2.6rem,7vw,5rem)] leading-none tracking-[-.035em] text-[#351b1e]">Come celebrate with us</h2>
          </div>

          <div className="mt-14 grid overflow-hidden border border-[#b38a45]/45 bg-[#fffaf0]/65 shadow-[0_22px_70px_rgb(68_31_28/8%)] md:grid-cols-2">
            <div className="flex min-h-60 flex-col items-center justify-center border-b border-[#b38a45]/35 p-8 text-center md:border-b-0 md:border-r">
              <CalendarDays className="size-7 text-[#8b5a25]" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[.22em] text-[#8b5a25]">Date</p>
              <time dateTime={event.dateISO} className="mt-2 font-serif text-3xl leading-tight text-[#6f1d31]">{event.date}</time>
              <div className="mt-5 flex items-center gap-2 text-lg text-[#351b1e]"><Clock3 className="size-5 text-[#8b5a25]" strokeWidth={1.5} aria-hidden="true" />{event.time}</div>
            </div>
            <div className="flex min-h-60 flex-col items-center justify-center p-8 text-center">
              <MapPin className="size-7 text-[#8b5a25]" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[.22em] text-[#8b5a25]">Location</p>
              <p className="mt-2 font-serif text-3xl leading-tight text-[#6f1d31]">{event.venue}</p>
              <p className="mt-3 text-base text-[#6f5a51]">{event.address}</p>
              <a href={event.mapsUrl} target="_blank" rel="noreferrer" className="mt-5 flex min-h-11 items-center rounded-full border border-[#b38a45]/55 px-5 py-2 text-sm font-semibold uppercase tracking-[.12em] text-[#6f1d31] transition-colors hover:bg-[#6f1d31] hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-3">Get directions</a>
            </div>
          </div>

          <details className="group mx-auto mt-8 max-w-3xl border-y border-[#b38a45]/40 py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-2 text-base font-semibold text-[#6f1d31] focus-visible:outline-2 focus-visible:outline-offset-2">More celebration details <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
            <div className="grid gap-6 border-t border-[#b38a45]/25 px-2 py-7 sm:grid-cols-3">
              <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8b5a25]">Dress</p><p className="mt-1 text-[#6f5a51]">{event.dressCode}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8b5a25]">Parking</p><p className="mt-1 text-[#6f5a51]">{event.parking}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8b5a25]">Questions</p><p className="mt-1 text-[#6f5a51]">{event.contact}</p></div>
            </div>
          </details>
        </div>
      </RevealSection>

      <RevealSection id="rsvp" sectionRef={rsvpRef} guidedReveal={guided ? rsvpRevealed : undefined} className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-[#efe3d0] px-5 py-24 text-center sm:px-8">
        <div className="absolute inset-7 border border-[#b38a45]/35 sm:inset-10" aria-hidden="true" />
        <div className="absolute inset-10 border border-[#b38a45]/15 sm:inset-14" aria-hidden="true" />
        <div ref={rsvpContentRef} className="relative z-10 mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[.28em] text-[#8b5a25]">Join us in celebrating</p>
          <h2 className="mt-5 text-balance font-serif text-[clamp(3rem,9vw,6.7rem)] leading-[.95] tracking-[-.04em] text-[#6f1d31]">Will you be joining us?</h2>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#6f5a51]">We would be honored to celebrate this special day with you.</p>
          <div className="mt-9"><RsvpDialog pulse={phase === "rsvp"} /></div>
          <div className="mx-auto mt-9 flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold uppercase tracking-[.12em] text-[#6f5a51]">
            <span>{event.shortDate}</span><span aria-hidden="true" className="text-[#b38a45]">◆</span><span>{event.time}</span><span aria-hidden="true" className="text-[#b38a45]">◆</span><span>{event.address}</span>
          </div>
        </div>
      </RevealSection>

      <footer className="bg-[#351b1e] px-6 py-20 text-center text-[#fffaf0]">
        <div className="mx-auto max-w-3xl">
          <p className="font-serif text-3xl italic leading-snug text-[#f6ead8] sm:text-4xl">“{event.familyMessage}”</p>
          <div className="mx-auto my-9 h-px w-24 bg-[#d7b56d]/70" aria-hidden="true" />
          <p className="text-sm font-semibold uppercase tracking-[.24em] text-[#d7b56d]">With love, the family</p>
          <p className="mt-5 text-sm text-[#f1e5d5]/70">Celebrating {event.honoree} · {event.westernNumeral}</p>
        </div>
      </footer>
    </main>
  );
}
