'use client';

import { useEffect } from 'react';

export default function GrammarPage() {
  useEffect(() => {
    window.location.href = 'https://gm.tutorbox.cc';
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p>正在跳转到 Grammar Master...</p>
    </main>
  );
}
