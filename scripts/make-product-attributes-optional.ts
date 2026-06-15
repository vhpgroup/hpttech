import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();
  const definitions = await payload.find({
    collection: "attribute-definitions",
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: { required: { equals: true } },
  });

  for (const definition of definitions.docs) {
    await payload.update({
      collection: "attribute-definitions",
      data: { required: false },
      id: definition.id,
      overrideAccess: true,
    });
  }

  console.log(
    JSON.stringify(
      {
        updated: definitions.totalDocs,
      },
      null,
      2,
    ),
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
