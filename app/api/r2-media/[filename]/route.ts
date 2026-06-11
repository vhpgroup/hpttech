import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

let client: S3Client | undefined;

function getClient() {
  if (client) return client;
  client = new S3Client({
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    region: process.env.R2_REGION || "auto",
  });
  return client;
}

function missingR2Config() {
  return !(
    process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (missingR2Config()) {
    return NextResponse.json({ error: "R2 is not configured." }, { status: 500 });
  }

  const { filename } = await params;
  const key = decodeURIComponent(filename);
  const bucket = process.env.R2_BUCKET;
  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    if (!response.Body) return new Response(null, { status: 404 });

    const body = response.Body.transformToWebStream();
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(response.ContentLength || 0),
        "Content-Type": response.ContentType || "application/octet-stream",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (missingR2Config()) {
    return new Response(null, { status: 500 });
  }

  const { filename } = await params;
  const key = decodeURIComponent(filename);
  const bucket = process.env.R2_BUCKET;
  try {
    const response = await getClient().send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return new Response(null, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(response.ContentLength || 0),
        "Content-Type": response.ContentType || "application/octet-stream",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
