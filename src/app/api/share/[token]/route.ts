import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { shareCookieName, signShareAccess, verifyPassword } from "@/lib/share";

// POST /api/share/[token] — visitor submits the share-link password.
// On success, set a signed cookie that grants access to this share token for ~12h.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!body.password) return NextResponse.json({ error: "password required" }, { status: 400 });

  const share = await prisma.shareLink.findUnique({ where: { token } });
  if (!share) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (share.expiresAt && share.expiresAt < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const ok = await verifyPassword(body.password, share.passwordHash);
  if (!ok) return NextResponse.json({ error: "wrong password" }, { status: 401 });

  const signed = signShareAccess(token);
  const jar = await cookies();
  jar.set(shareCookieName(token), signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/share/${token}`,
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
