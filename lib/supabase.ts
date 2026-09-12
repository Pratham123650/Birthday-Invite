import "server-only";

export type RsvpRecord = {
  id: string;
  guest_key: string | null;
  guest_name: string | null;
  first_name: string;
  last_name: string;
  attending: boolean;
  party_size: number;
  additional_guests: string[];
  dietary_restrictions: string;
  message: string;
  submitted_at: string;
  updated_at: string | null;
};

export type RsvpInput = {
  guest_name: string;
  attending: boolean;
  party_size: number;
  additional_guests: string[];
  dietary_restrictions: string;
  message: string;
};

function credentials() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("RSVP_STORAGE_NOT_CONFIGURED");
  }
  return { url, publishableKey };
}

async function request(path: string, init: RequestInit) {
  const { url, publishableKey } = credentials();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
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

export async function submitRsvp(input: RsvpInput): Promise<{ status: "created" | "updated"; guest_name: string }> {
  const response = await request("rpc/submit_rsvp", {
    method: "POST",
    body: JSON.stringify({
      p_guest_name: input.guest_name,
      p_attending: input.attending,
      p_party_size: input.party_size,
      p_additional_guests: input.additional_guests,
      p_dietary_restrictions: input.dietary_restrictions,
      p_message: input.message,
    }),
  });
  return response.json() as Promise<{ status: "created" | "updated"; guest_name: string }>;
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  const response = await request("rsvps?select=*&order=submitted_at.desc", {
    method: "GET",
  });
  return response.json() as Promise<RsvpRecord[]>;
}
