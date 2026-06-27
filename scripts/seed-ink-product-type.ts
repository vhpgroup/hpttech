import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  try {
    const found = await payload.find({
      collection: "product-types",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { code: { equals: "ink" } },
    });

    const data = {
      code: "ink",
      name: "Mực in & Phụ kiện",
      description: "Mực in, hộp mực, toner, drum và phụ kiện máy in.",
      schemaVersion: 1,
      status: "active",
    } as const;

    const result = found.docs[0]
      ? await payload.update({
          collection: "product-types",
          id: found.docs[0].id,
          data,
          overrideAccess: true,
        })
      : await payload.create({
          collection: "product-types",
          data,
          overrideAccess: true,
        });

    console.log(JSON.stringify({ code: "ink", id: result.id }));
  } finally {
    await payload.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
