import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Step 2 of upload: after the client PUTs the file to S3, register it in the DB.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    key?: string;
    originalFilename?: string;
    mimeType?: string;
    sizeBytes?: number;
    albumId?: string | null;
  };
  if (!body.key || !body.originalFilename || !body.mimeType || typeof body.sizeBytes !== "number") {
    return NextResponse.json({ error: "key, originalFilename, mimeType, sizeBytes required" }, { status: 400 });
  }

  const photo = await prisma.photo.create({
    data: {
      s3Key: body.key,
      originalFilename: body.originalFilename,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      uploaderId: userId,
      albumId: body.albumId ?? null,
    },
  });

  return NextResponse.json({ photo });
}
