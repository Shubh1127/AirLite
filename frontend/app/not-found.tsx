"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <main
      className="min-h-[calc(100vh-80px)] bg-black bg-cover bg-center text-white"

    >
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-xl text-center bg-black/60 backdrop-blur-md rounded-2xl p-10 shadow-xl"
        >
          {/* 404 */}
          <h1 className="text-7xl font-extrabold mb-4">404</h1>

          {/* Title */}
          <h2 className="text-2xl font-semibold mb-3">
            Page not found
          </h2>

          {/* Description */}
          <p className="text-gray-300 mb-8">
            Sorry, the page you are looking for doesn’t exist or has been moved.
          </p>

          {/* CTA */}
          <Link
            href="/"
            className="inline-flex items-center justify-center min-w-[200px] font-semibold rounded-xl px-6 py-3 bg-white text-black text-base transition hover:bg-gray-200"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
