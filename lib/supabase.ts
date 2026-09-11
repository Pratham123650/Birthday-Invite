import "server-only";

export type RsvpRecord = {
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

function credentials() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("RSVP_STORAGE_NOT_CONFIGURED");
  }
  return { url, serviceKey };
}

async function request(path: string, init: RequestInit) {
  const { url, serviceKey } = credentials();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase RSVP request failed", response.status, detail);
    throw new Error("RSVP_STORAGE_UNAVAILABLE");
  }
  return response;
}

export async function createRsvp(input: Omit<RsvpRecord, "id" | "submitted_at">) {
  await request("rsvps", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(input),
  });
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  const response = await request("rsvps?select=*&order=submitted_at.desc", {
    method: "GET",
  });
  return response.json() as Promise<RsvpRecord[]>;
}
