import { getPayload } from "payload";
import config from "../payload.config.ts";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running this script.");
    process.exit(2);
  }

  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "users",
    limit: 1,
    where: { email: { equals: email } },
  });

  if (existing.totalDocs > 0) {
    console.log(`User ${email} already exists (id=${existing.docs[0].id}).`);
    process.exit(0);
  }

  const created = await payload.create({
    collection: "users",
    data: {
      email,
      password,
      name: "Admin",
    },
  });

  console.log(`Created user ${email} with id ${created.id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
