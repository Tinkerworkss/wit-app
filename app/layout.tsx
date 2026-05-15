import type { Metadata } 
  from "next"; 
import { SessionProvider } 
  from "next-auth/react"; 
import "./globals.css"; 
export const metadata: Metadata = { title: "Wit — Meat Inventory & Traceability", description: "Meat inventory and lot traceability platform for modern processors.", }; 
export default function RootLayout({ children }: { children: React.ReactNode }) { return ( <html lang="en"> <body> <SessionProvider>{children}</SessionProvider> </body> </html> ); }
