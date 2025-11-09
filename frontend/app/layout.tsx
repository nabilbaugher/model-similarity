import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Model Similarity",
  description: "Compare and practice identifying AI model responses",
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
