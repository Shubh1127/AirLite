'use client'
import Link from 'next/link';

export default function BecomeAHostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">

      {/* TOP BAR */}
      {/* <header className="flex justify-between items-center px-8 pt-4   shrink-0">
        <Link href="/">
          <img className="h-10 w-10" src="/image.png" alt="logo" />
        </Link>
        <Link
          href="/"
          className="border-1 rounded-3xl px-6 py-2 hover:bg-gray-100 transition"
        >
          Exit
        </Link>
      </header> */}

      {/* CONTENT */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <hr/>

      {/* BOTTOM BAR */}
      <footer className="px-8 py-4  flex justify-end ">
        <Link href="/become-a-host/create" className="font-medium text-lg bg-red-400 p-3 rounded-lg text-white">
          Get Started
        </Link>
      </footer>

    </div>
  );
}
