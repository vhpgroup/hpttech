import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function contentType(filename: string) {
  return MIME_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

function mediaPath(filename: string) {
  const safeName = path.basename(filename);
  return path.resolve(process.cwd(), "media", safeName);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const safeName = path.basename(decodeURIComponent(filename));
  const filePath = mediaPath(safeName);

  try {
    const data = await fs.readFile(filePath);
    return new Response(data, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.length),
        "Content-Type": contentType(safeName),
      },
    });
  } catch {
    return NextResponse.json({ error: "Media file not found." }, { status: 404 });
  }
}

export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const safeName = path.basename(decodeURIComponent(filename));
  const filePath = mediaPath(safeName);

  try {
    const stat = await fs.stat(filePath);
    return new Response(null, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(stat.size),
        "Content-Type": contentType(safeName),
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
