"use client";

import { Download, LoaderCircle, LockKeyhole, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approvedGuests } from "@/lib/guests";

type Rsvp = {
  id: string;
  guest_key: string;
  guest_name: string;
  attending: boolean;
  party_size: number;
  message: string;
  submitted_at: string;
  updated_at: string;
};

type GuestRow = (typeof approvedGuests)[number] & { response?: Rsvp };
type View = "locked" | "loading" | "ready" | "error";

async function loadRsvps(password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) throw new Error("The guest dashboard is not configured yet.");

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_rsvp_overview`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_password: password }),
  });
  if (response.status === 401 || response.status === 403 || response.status === 400) {
    throw new Error("That password is not correct.");
  }
  if (!response.ok) throw new Error("The guest list is unavailable right now.");
  const result = await response.json();
  return Array.isArray(result) ? result as Rsvp[] : [];
}

function responseLabel(response?: Rsvp) {
  if (!response) return "No response";
  return response.attending ? "Attending" : "Declined";
}

function responseClass(response?: Rsvp) {
  if (!response) return "border-[#bca67f]/60 bg-[#efe5d5] text-[#6f5a51]";
  return response.attending
    ? "border-[#2f5d50]/25 bg-[#2f5d50]/[.08] text-[#2f5d50]"
    : "border-[#7b5960]/25 bg-[#7b5960]/[.08] text-[#6f1d31]";
}

export default function AdminPage() {
  const [view, setView] = useState<View>("locked");
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setView("loading");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    try {
      setRsvps(await loadRsvps(password));
      setView("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open the guest list.");
      setView("locked");
    }
  }

  function logout() {
    setRsvps([]);
    setError("");
    setView("locked");
  }

  const rows: GuestRow[] = approvedGuests.map((guest) => ({
    ...guest,
    response: rsvps.find((entry) => entry.guest_key === guest.key),
  }));

  function exportCsv() {
    const csvRows = rows.map(({ name, response }) => [
      name,
      responseLabel(response),
      response?.party_size ?? 0,
      response?.message ?? "",
      response ? new Date(response.updated_at || response.submitted_at).toLocaleString() : "",
    ]);
    const csv = [
      ["Guest", "Response", "Party size", "Message", "Last updated"],
      ...csvRows,
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sureshchandra-75-rsvps.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (view === "locked" || view === "loading") {
    return (
      <main className="paper-texture grid min-h-[100svh] place-items-center px-5 py-10">
        <form onSubmit={login} className="w-full max-w-md border border-[#b38a45]/50 bg-[#fffaf0]/85 p-7 shadow-[0_24px_70px_rgb(68_31_28/12%)] sm:p-10">
          <div className="mb-6 grid size-12 place-items-center rounded-full border border-[#b38a45]/60 text-[#6f1d31]"><LockKeyhole className="size-5" aria-hidden="true" /></div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-[#8b5a25]">Private family access</p>
          <h1 className="mt-3 font-serif text-4xl text-[#351b1e]">RSVP guest list</h1>
          <p className="mt-3 text-base leading-relaxed text-[#6f5a51]">Enter the family admin password to view responses.</p>
          <label className="mt-7 grid gap-2 text-base font-semibold text-[#351b1e]">Password<Input required name="password" type="password" autoComplete="current-password" className="h-13 border-[#bca67f] bg-white/70 px-4 text-base" /></label>
          {error && <p role="alert" className="mt-4 rounded-lg border border-[#9f2436]/25 bg-[#9f2436]/[.05] px-4 py-3 text-sm text-[#9f2436]">{error}</p>}
          <Button disabled={view === "loading"} type="submit" className="mt-6 min-h-13 w-full rounded-full bg-[#6f1d31] text-base text-[#fffaf0]">
            {view === "loading" ? <><LoaderCircle className="animate-spin" /> Opening guest list</> : "Open guest list"}
          </Button>
          <Link href="/" className="mt-5 block min-h-11 py-2 text-center text-sm font-semibold text-[#6f1d31] underline-offset-4 hover:underline">Return to invitation</Link>
        </form>
      </main>
    );
  }

  if (view === "error") return null;

  const attending = rows.filter((entry) => entry.response?.attending).length;
  const declined = rows.filter((entry) => entry.response && !entry.response.attending).length;
  const noResponse = rows.filter((entry) => !entry.response).length;
  const expected = rows.reduce((total, entry) => total + (entry.response?.party_size ?? 0), 0);
  const stats = [
    ["Attending", attending], ["Declined", declined], ["No response", noResponse], ["Expected guests", expected],
  ];

  return (
    <main className="min-h-[100svh] bg-[#f8f1e5] px-4 py-8 text-[#351b1e] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-[#b38a45]/45 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#8b5a25]">Sureshchandra · 75</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">RSVP guest list</h1><p className="mt-3 text-base text-[#6f5a51]">All {approvedGuests.length} invited guests, including those who have not replied.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button onClick={exportCsv} variant="outline" className="min-h-12 border-[#b38a45]/60 bg-[#fffaf0]"><Download /> Export CSV</Button>
            <Button onClick={logout} variant="ghost" className="min-h-12 text-[#6f1d31]"><LogOut /> Sign out</Button>
          </div>
        </header>

        <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="RSVP totals">
          {stats.map(([label, value]) => <div key={label} className="border border-[#b38a45]/35 bg-[#fffaf0]/70 p-4 sm:p-5"><p className="text-sm leading-snug text-[#6f5a51]">{label}</p><p className="mt-1 font-serif text-4xl text-[#6f1d31]">{value}</p></div>)}
        </section>

        <section className="mt-7" aria-label="Guest responses">
          <div className="grid gap-4 lg:hidden">
            {rows.map(({ key, name, response }) => (
              <article key={key} className="border border-[#b38a45]/35 bg-[#fffaf0]/80 p-5 shadow-[0_12px_30px_rgb(68_31_28/7%)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-serif text-2xl text-[#351b1e]">{name}</h2>
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${responseClass(response)}`}>{responseLabel(response)}</span>
                </div>
                {response ? (
                  <dl className="mt-5 grid gap-4 text-base sm:grid-cols-2">
                    <div><dt className="text-sm font-semibold uppercase tracking-[.12em] text-[#8b5a25]">Party</dt><dd className="mt-1">{response.party_size}</dd></div>
                    <div><dt className="text-sm font-semibold uppercase tracking-[.12em] text-[#8b5a25]">Updated</dt><dd className="mt-1">{new Date(response.updated_at || response.submitted_at).toLocaleString()}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-sm font-semibold uppercase tracking-[.12em] text-[#8b5a25]">Message</dt><dd className="mt-1 break-words">{response.message || "—"}</dd></div>
                  </dl>
                ) : (
                  <div className="mt-6 flex items-center gap-3 text-base text-[#6f5a51]"><Users className="size-5 text-[#8b5a25]" aria-hidden="true" />Awaiting reply</div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto border border-[#b38a45]/35 bg-[#fffaf0]/75 p-5 shadow-[0_18px_50px_rgb(68_31_28/8%)] lg:block">
            <Table>
              <TableHeader><TableRow className="border-[#b38a45]/35"><TableHead>Guest</TableHead><TableHead>Response</TableHead><TableHead>Party</TableHead><TableHead>Message</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map(({ key, name, response }) => (
                  <TableRow key={key} className="border-[#b38a45]/25 align-top">
                    <TableCell className="font-semibold">{name}</TableCell>
                    <TableCell><span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${responseClass(response)}`}>{responseLabel(response)}</span></TableCell>
                    <TableCell>{response?.party_size ?? "—"}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal">{response?.message || "—"}</TableCell>
                    <TableCell>{response ? new Date(response.updated_at || response.submitted_at).toLocaleString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </main>
  );
}
