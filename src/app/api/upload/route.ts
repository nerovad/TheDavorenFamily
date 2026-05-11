import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPhotoKey, presignUpload } from "@/lib/s3";

// Step 1 of upload: client asks for a presigned PUT URL.
// Client then uploads the file directly to S3, then calls POST /api/upload/complete.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { filename?: string; contentType?: string; sizeBytes?: number };
  if (!body.filename || !body.contentType || typeof body.sizeBytes !== "number") {
    return NextResponse.json({ error: "filename, contentType, sizeBytes required" }, { status: 400 });
  }

  const key = buildPhotoKey(body.filename);
  const uploadUrl = await presignUpload(key, body.contentType);

  return NextResponse.json({ key, uploadUrl });
}
