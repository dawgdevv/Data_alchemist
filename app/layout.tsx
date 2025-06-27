import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Alchemist - Transform Your Data with AI Precision",
  description:
    "AI-powered web application for cleaning, validating, and configuring spreadsheet data for resource planning.",
  keywords:
    "data cleaning, validation, AI, spreadsheet, CSV, resource planning",
  authors: [{ name: "Data Alchemist Team" }],
  openGraph: {
    title: "Data Alchemist",
    description: "Transform your data with AI precision",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
