import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StellarCast - Your Voice, The Universe Listens",
  description:
    "StellarCast is the ultimate platform for podcasters. Create, distribute, and grow your show with powerful analytics, unlimited hosting, and global reach.",
  keywords: ["podcast", "hosting", "streaming", "audio", "StellarCast"],
  openGraph: {
    title: "StellarCast - Your Voice, The Universe Listens",
    description:
      "Create, distribute, and grow your podcast with StellarCast.",
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
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
