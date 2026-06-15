import { loadEnvConfig } from "@next/env";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

loadEnvConfig(process.cwd());

async function main() {
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!bucket || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Missing R2 credentials");
  }

  const client = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    forcePathStyle: true,
    region: process.env.R2_REGION || "auto",
  });

  const filesToCheck = [
    "pmtr0002-cf28af0d.jpg",
    "4766-4bc63120.jpg",
    "pmkh0128-5fed4f5c.png"
  ];

  for (const file of filesToCheck) {
    try {
      const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: file }));
      console.log(`[R2] OK: ${file} (Size: ${response.ContentLength})`);
    } catch (error) {
      const message =
        error instanceof Error
          ? `${error.name} ${error.message}`
          : String(error);
      console.log(`[R2] ERROR: ${file} - ${message}`);
    }
  }
}

main().catch(console.error);
