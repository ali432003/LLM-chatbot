import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Practice LLM chat app with Next.js, Supabase and Hugging Face",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-mono bg-[var(--bg)] text-[var(--text)] min-h-screen text-base lg:text-lg">
        {children}
      </body>
    </html>
  );
}
