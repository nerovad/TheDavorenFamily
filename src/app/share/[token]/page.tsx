import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { presignDownload } from "@/lib/s3";
import { shareCookieName, verifyShareAccess } from "@/lib/share";
import { SharePasswordForm } from "./SharePasswordForm";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: { album: { include: { photos: { orderBy: { uploadedAt: "desc" } } } } },
  });
  if (!share) notFound();
  if (share.expiresAt && share.expiresAt < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-700 dark:text-zinc-300">This share link has expired.</p>
      </main>
    );
  }

  const jar = await cookies();
  const cookieValue = jar.get(shareCookieName(token))?.value;
  const hasAccess = verifyShareAccess(token, cookieValue);

  if (!hasAccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-zinc-50 dark:bg-zinc-950">
        <SharePasswordForm token={token} albumName={share.album.name} />
      </main>
    );
  }

  const photos = await Promise.all(
    share.album.photos.map(async (p) => ({ ...p, url: await presignDownload(p.s3Key, 60 * 60) })),
  );

  return (
    <main className="min-h-screen px-6 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{share.album.name}</h1>
        {share.album.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{share.album.description}</p>
        )}
        {photos.length === 0 ? (
          <p className="mt-6 text-zinc-600 dark:text-zinc-400">This album is empty.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="aspect-square overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                {p.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={p.originalFilename} className="h-full w-full object-cover" />
                ) : (
                  <video src={p.url} className="h-full w-full object-cover" controls />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
