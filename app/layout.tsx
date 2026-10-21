import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tangle Words — A daily word puzzle with a twist",
  description:
    "Rotate and rearrange tiles to find clues, connect words, and rebuild a broken crossword. A new puzzle every day.",
  openGraph: {
    title: "Tangle Words",
    description: "A daily word puzzle with a twist. Rotate and rearrange tiles to rebuild a broken crossword.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}