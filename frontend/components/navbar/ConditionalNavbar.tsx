'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on auth pages and host creation flow
  const hideNavbar =
    pathname?.startsWith('/auth') || pathname?.startsWith('/become-a-host/create');
  
  if (hideNavbar) {
    return null;
  }
  
  return <Navbar />;
}
