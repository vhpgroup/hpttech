import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  const types = [
    {
      code: "networking",
      name: "Thiết bị mạng",
      description: "Router, switch, card mạng, access point và phụ kiện mạng.",
    },
    {
      code: "camera",
      name: "Camera & Giám sát",
      description: "Camera quan sát, đầu ghi, ổ cứng và phụ kiện camera.",
    },
  ] as const;

  try {
    const results: Array<{ code: string; id: string | number }> = [];

    for (const type of types) {
      const found = await payload.find({
        collection: "product-types",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { code: { equals: type.code } },
      });

      const data = {
        ...type,
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

      results.push({ code: type.code, id: result.id });
    }

    console.log(JSON.stringify({ ok: true, productTypes: results }));
  } finally {
    await payload.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
