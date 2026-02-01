'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on auth pages
  const hideNavbar = pathname?.startsWith('/auth');
  
  if (hideNavbar) {
    return null;
  }
  
  return <Navbar />;
}
