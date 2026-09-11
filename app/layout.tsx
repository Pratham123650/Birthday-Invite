import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sureshchandra at 75 | Amrut Mahotsav",
  description:
    "An invitation to celebrate Sureshchandra’s 75th birthday on September 20, 2026.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
