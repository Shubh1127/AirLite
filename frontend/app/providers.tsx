'use client';

import { SessionProvider } from "next-auth/react";
import SessionSync from "@/components/SessionSync";
import ConditionalNavbar from "@/components/navbar/ConditionalNavbar";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SessionSync />
      <ConditionalNavbar />
      {children}
    </SessionProvider>
  );
}
