"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, Home as HomeIcon, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const linkClasses = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-neutral-50 transition ${
      active ? "text-rose-500" : "text-neutral-600"
    }`;

  const iconClasses = (active: boolean) =>
    `w-5 h-5 ${active ? "text-rose-500" : "text-neutral-600"}`;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
      <div className="flex items-center justify-around h-16">
        <Link href="/" className={linkClasses(isActive("/"))}>
          <Search className={iconClasses(isActive("/"))} />
          <span className="text-xs font-medium">Explore</span>
        </Link>
        <Link
          href="/users/profile/wishlist"
          className={linkClasses(isActive("/users/profile/wishlist"))}
        >
          <Heart className={iconClasses(isActive("/users/profile/wishlist"))} />
          <span className="text-xs font-medium">Wishlists</span>
        </Link>
        <Link
          href="/users/profile/past-trips"
          className={linkClasses(isActive("/users/profile/past-trips"))}
        >
          <HomeIcon className={iconClasses(isActive("/users/profile/past-trips"))} />
          <span className="text-xs font-medium">Trips</span>
        </Link>
        <Link
          href="/users/profile"
          className={linkClasses(isActive("/users/profile"))}
        >
          <User className={iconClasses(isActive("/users/profile"))} />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
