import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presignDownload } from "@/lib/s3";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/gallery");

  const photos = await prisma.photo.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  const withUrls = await Promise.all(
    photos.map(async (p) => ({ ...p, url: await presignDownload(p.s3Key, 60 * 60) })),
  );

  return (
    <main className="min-h-screen px-6 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Gallery</h1>
        {withUrls.length === 0 ? (
          <p className="mt-6 text-zinc-600 dark:text-zinc-400">No photos yet. Upload some on the upload page.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {withUrls.map((p) => (
              <div key={p.id} className="aspect-square overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                {p.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={p.originalFilename} className="h-full w-full object-cover" />
                ) : (
                  <video src={p.url} className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
