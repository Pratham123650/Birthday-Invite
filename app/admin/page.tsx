"use client";

import { Download, LoaderCircle, LockKeyhole, LogOut, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Rsvp = {
  id: string;
  first_name: string;
  last_name: string;
  attending: boolean;
  party_size: number;
  additional_guests: string[];
  dietary_restrictions: string;
  message: string;
  submitted_at: string;
};

type View = "loading" | "locked" | "ready" | "error";

export default function AdminPage() {
  const [view, setView] = useState<View>("loading");
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/rsvps", { cache: "no-store" });
    if (response.status === 401) {
      setView("locked");
      return;
    }
    const result = await response.json() as { error?: string; rsvps?: Rsvp[] };
    if (!response.ok) {
      setError(result.error || "The guest list is unavailable.");
      setView("error");
      return;
    }
    setRsvps(result.rsvps ?? []);
    setView("ready");
  }

  useEffect(() => { void load(); }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to sign in.");
      return;
    }
    setView("loading");
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setRsvps([]);
    setView("locked");
  }

  function exportCsv() {
    const rows = rsvps.map((entry) => [
      `${entry.first_name} ${entry.last_name}`,
      entry.attending ? "Attending" : "Declined",
      entry.party_size,
      entry.additional_guests.join("; "),
      entry.dietary_restrictions,
      entry.message,
      new Date(entry.submitted_at).toLocaleString(),
    ]);
    const csv = [
      ["Name", "Response", "Party size", "Additional guests", "Dietary restrictions", "Message", "Submitted"],
      ...rows,
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sureshchandra-75-rsvps.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (view === "loading") {
    return <main className="paper-texture grid min-h-screen place-items-center"><div className="flex items-center gap-3 text-[#6f1d31]"><LoaderCircle className="animate-spin" /> Loading guest list</div></main>;
  }

  if (view === "locked") {
    return (
      <main className="paper-texture grid min-h-screen place-items-center px-5 py-12">
        <form onSubmit={login} className="w-full max-w-md border border-[#b38a45]/50 bg-[#fffaf0]/80 p-7 shadow-[0_24px_70px_rgb(68_31_28/12%)] sm:p-10">
          <div className="mb-6 grid size-12 place-items-center rounded-full border border-[#b38a45]/60 text-[#6f1d31]"><LockKeyhole className="size-5" aria-hidden="true" /></div>
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#8b5a25]">Private family access</p>
          <h1 className="mt-3 font-serif text-4xl text-[#351b1e]">RSVP guest list</h1>
          <p className="mt-3 text-[#6f5a51]">Enter the family admin password to view responses.</p>
          <label className="mt-7 grid gap-2 text-sm font-semibold text-[#351b1e]">Password<Input required name="password" type="password" autoComplete="current-password" className="h-12 border-[#bca67f] bg-white/65 px-4 text-base" /></label>
          {error && <p role="alert" className="mt-4 text-sm text-[#9f2436]">{error}</p>}
          <Button type="submit" className="mt-6 min-h-12 w-full rounded-full bg-[#6f1d31] text-base text-[#fffaf0]">Open guest list</Button>
          <a href="/" className="mt-5 block min-h-11 py-2 text-center text-sm font-semibold text-[#6f1d31] underline-offset-4 hover:underline">Return to invitation</a>
        </form>
      </main>
    );
  }

  if (view === "error") {
    return <main className="paper-texture grid min-h-screen place-items-center px-5"><div className="max-w-md text-center"><h1 className="font-serif text-4xl text-[#351b1e]">Guest list unavailable</h1><p className="mt-4 text-[#6f5a51]">{error}</p><Button onClick={() => { setView("loading"); void load(); }} className="mt-6 rounded-full bg-[#6f1d31]">Try again</Button></div></main>;
  }

  const attending = rsvps.filter((entry) => entry.attending).length;
  const expected = rsvps.reduce((total, entry) => total + entry.party_size, 0);
  const stats = [
    ["Responses", rsvps.length], ["Attending", attending], ["Declined", rsvps.length - attending], ["Expected guests", expected],
  ];

  return (
    <main className="min-h-screen bg-[#f8f1e5] px-4 py-8 text-[#351b1e] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-[#b38a45]/45 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#8b5a25]">Sureshchandra · 75</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">RSVP guest list</h1></div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportCsv} variant="outline" className="min-h-11 border-[#b38a45]/60 bg-[#fffaf0]"><Download /> Export CSV</Button>
            <Button onClick={logout} variant="ghost" className="min-h-11 text-[#6f1d31]"><LogOut /> Sign out</Button>
          </div>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="RSVP totals">
          {stats.map(([label, value]) => <div key={label} className="border border-[#b38a45]/35 bg-[#fffaf0]/70 p-5"><p className="text-sm text-[#6f5a51]">{label}</p><p className="mt-1 font-serif text-4xl text-[#6f1d31]">{value}</p></div>)}
        </section>

        <section className="mt-7 border border-[#b38a45]/35 bg-[#fffaf0]/75 p-3 shadow-[0_18px_50px_rgb(68_31_28/8%)] sm:p-5">
          {rsvps.length === 0 ? (
            <div className="grid min-h-72 place-items-center text-center"><div><Users className="mx-auto size-9 text-[#8b5a25]" strokeWidth={1.4} /><h2 className="mt-4 font-serif text-3xl">No responses yet</h2><p className="mt-2 text-[#6f5a51]">New replies will appear here.</p></div></div>
          ) : (
            <Table>
              <TableHeader><TableRow className="border-[#b38a45]/35"><TableHead>Name</TableHead><TableHead>Response</TableHead><TableHead>Party</TableHead><TableHead>Additional guests</TableHead><TableHead>Dietary notes</TableHead><TableHead>Message</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader>
              <TableBody>
                {rsvps.map((entry) => (
                  <TableRow key={entry.id} className="border-[#b38a45]/25 align-top">
                    <TableCell className="font-semibold">{entry.first_name} {entry.last_name}</TableCell>
                    <TableCell><span className={entry.attending ? "text-[#2f5d50]" : "text-[#7b5960]"}>{entry.attending ? "Attending" : "Declined"}</span></TableCell>
                    <TableCell>{entry.party_size}</TableCell>
                    <TableCell className="max-w-56 whitespace-normal">{entry.additional_guests.join(", ") || "—"}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal">{entry.dietary_restrictions || "—"}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal">{entry.message || "—"}</TableCell>
                    <TableCell>{new Date(entry.submitted_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </main>
  );
}
