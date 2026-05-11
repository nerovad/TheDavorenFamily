import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          The Davoren Family
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Family photos and videos, kept together.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/gallery"
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-6 py-2.5 font-medium hover:opacity-90 transition"
          >
            View gallery
          </Link>
          <Link
            href="/upload"
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-6 py-2.5 font-medium text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            Upload photos
          </Link>
        </div>
      </div>
    </main>
  );
}
