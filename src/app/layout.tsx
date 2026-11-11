import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CabSync — Smart Campus Transit", description: "AI-powered campus cab matching" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
