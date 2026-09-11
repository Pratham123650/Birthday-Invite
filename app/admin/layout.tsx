import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RSVP Guest List | Sureshchandra at 75",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
