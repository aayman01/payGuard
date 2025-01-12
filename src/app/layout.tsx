import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "./supabase-provider";
import SupabaseListener from "./supabase-listener";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayGuard",
  description: "Payment Tracking and Verification System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <SupabaseListener />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
