import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sharp",
  description: "Sharp, a personal AI assistant built by Haider.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
