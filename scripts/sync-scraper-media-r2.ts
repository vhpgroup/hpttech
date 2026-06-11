import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

loadEnvConfig(process.cwd());

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();
  const media = await payload.find({
    collection: "media",
    depth: 0,
    limit: 500,
    overrideAccess: true,
    where: { folder: { equals: "scraper/products" } },
  });
  const client = new S3Client({
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    endpoint: requiredEnv("R2_ENDPOINT"),
    forcePathStyle: true,
    region: process.env.R2_REGION || "auto",
  });
  const bucket = requiredEnv("R2_BUCKET");
  const uploaded: string[] = [];

  for (const item of media.docs) {
    if (!item.filename) continue;
    const filePath = path.resolve("media", item.filename);
    const body = await readFile(filePath);
    await client.send(
      new PutObjectCommand({
        Body: body,
        Bucket: bucket,
        ContentType: item.mimeType || "application/octet-stream",
        Key: item.filename,
      }),
    );
    uploaded.push(item.filename);
  }

  console.log(JSON.stringify({ uploaded: uploaded.length, files: uploaded }, null, 2));
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
