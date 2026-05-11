import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UploadClient } from "./UploadClient";

export default async function UploadPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/upload");

  return (
    <main className="min-h-screen px-6 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Upload photos</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Pick photos or videos from your phone or computer. They&apos;ll upload directly to our family storage.
        </p>
        <div className="mt-8">
          <UploadClient />
        </div>
      </div>
    </main>
  );
}
