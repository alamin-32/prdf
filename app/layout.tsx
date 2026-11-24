import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRDF",
  description:
    "Next.js Solar Installation Gears Price Calculator, Real-Time PDF Quotation Generator, and Department Head Approval Portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
