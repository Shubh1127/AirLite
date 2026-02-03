'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe, Menu, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  // console.log(user?.avatar.url)

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleProfileClick = () => {
    router.push('/users/profile');
  };

  const handleLogout = async () => {
    logout();
    // Call NextAuth signOut to clear the session
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-black text-white shadow-md">
       <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center gap-1">
                <div className="w-8 h-8  rounded-full flex items-center justify-center">
                    <img src={'logo.png'}/>
                </div>
                <Link href={'/'} className="font-bold text-xl">AirLite</Link>
              </div>

              {/* Navigation */}
              {/* <nav className="hidden md:flex items-center gap-8">
                <div className="flex flex-col items-center gap-1 pb-2 border-b-2 border-black">
                  <span className="text-xs text-neutral-500 font-medium">Homes</span>
                  <span className="text-sm font-medium">Homes</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-block bg-slate-700 text-white text-xs px-2 py-1 rounded-full mb-1">NEW</span>
                  <span className="text-sm text-neutral-600 flex items-center gap-1">
                    <span className="text-lg">🎈</span> Experiences
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-block bg-slate-700 text-white text-xs px-2 py-1 rounded-full mb-1">NEW</span>
                  <span className="text-sm text-neutral-600">Services</span>
                </div>
              </nav> */}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {(!isAuthenticated || (user?.role !== 'host' && user?.role !== 'both')) && (
                <Link href="/become-a-host" className="hidden md:block text-sm font-medium text-white hover:bg-gray-400 px-4 py-2 rounded-full transition">
                  Become a host
                </Link>
              )}
              {isAuthenticated && (user?.role === 'host' || user?.role === 'both') && (
                <Link href="/users/profile/listings" className="hidden md:block text-sm font-medium text-white hover:bg-gray-400 px-4 py-2 rounded-full transition">
                  Your properties
                </Link>
              )}
              <button className="p-2 hover:bg-gray-400 rounded-full transition">
                <Globe className="w-5 h-5" />
              </button>
              
              {isAuthenticated && user ? (
                // Profile Dropdown for Logged-in User
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-0 cursor-pointer hover:bg-gray-400 rounded-full transition flex items-center justify-center w-10 h-10 bg-gray-700 overflow-hidden">
                      {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {user.firstName?.[0] || user.email?.[0] || 'U'}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mr-4">
                    <DropdownMenuLabel className="text-sm">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <button onClick={handleProfileClick} className="cursor-pointer w-full text-left">
                        My profile
                      </button>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/users/profile/past-trips" className="cursor-pointer">
                        My trips
                      </Link>
                    </DropdownMenuItem>
                    
                    {(user.role === 'host' || user.role === 'both') && (
                      <DropdownMenuItem asChild>
                        <Link href="/users/profile/listings" className="cursor-pointer">
                          Your properties
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {user.role === 'guest' && (
                      <DropdownMenuItem asChild>
                        <Link href="/become-a-host" className="cursor-pointer">
                          Become a host
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <button onClick={handleLogout} className="cursor-pointer w-full text-left text-red-600">
                        Log out
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Menu for Non-logged-in User
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-gray-400 rounded-full transition">
                      <Menu className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mr-4">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <span>❓</span> Help Centre
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/host" className="cursor-pointer">
                        <div>
                          <div className="font-semibold">Become a host</div>
                          <div className="text-xs text-gray-600">It's easy to start hosting and earn extra income.</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/refer" className="cursor-pointer">
                        Refer a host
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/find-cohost" className="cursor-pointer">
                        Find a co-host
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="cursor-pointer font-semibold">
                        Log in or sign up
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-50 p-4 space-y-4">
          <Link href="/" className="block text-gray-700 hover:text-blue-500">
            Browse
          </Link>
          <Link href="/dashboard/trips" className="block text-gray-700 hover:text-blue-500">
            Trips
          </Link>
          <Link href="/dashboard/properties" className="block text-gray-700 hover:text-blue-500">
            Host
          </Link>
          <Button className="w-full">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
