import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitAI Coach | AI-Powered Fitness Consistency Platform",
  description: "AI-powered fitness consistency coach, personalized blueprints, adaptive training plans, habit tracking, and cognitive analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
