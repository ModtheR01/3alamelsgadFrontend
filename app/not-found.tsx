import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] text-[#1C1A19] px-6 text-center">
      <h1 className="text-8xl font-serif text-[#643D26] mb-4">404</h1>
      <h2 className="text-2xl font-serif mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        The piece or page you are looking for does not exist or has been relocated within the atelier.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#1C1A19] text-[#FAF8F5] hover:bg-[#643D26] transition-colors rounded-none text-xs uppercase tracking-widest font-medium"
      >
        Return to Atelier
      </Link>
    </div>
  );
}
