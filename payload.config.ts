import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import { Brands } from "./collections/Brands.ts";
import { Categories } from "./collections/Categories.ts";
import { Media } from "./collections/Media.ts";
import { Products } from "./collections/Products.ts";
import { Users } from "./collections/Users.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const databaseURL =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  "postgres://payload:payload@127.0.0.1:5432/hpttech_payload";

const r2Enabled = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT,
);

export default buildConfig({
  admin: {
    importMap: {
      baseDir: dirname,
    },
    user: Users.slug,
  },
  collections: [Users, Media, Categories, Brands, Products],
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
  }),
  editor: lexicalEditor(),
  i18n: {
    fallbackLanguage: "vi",
    supportedLanguages: {
      vi,
    },
  },
  plugins: [
    s3Storage({
      acl: "public-read",
      alwaysInsertFields: true,
      bucket: process.env.R2_BUCKET || "hpttech-media",
      collections: {
        media: true,
      },
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "local-placeholder",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "local-placeholder",
        },
        endpoint: process.env.R2_ENDPOINT,
        forcePathStyle: true,
        region: process.env.R2_REGION || "auto",
      },
      disableLocalStorage: r2Enabled,
      enabled: r2Enabled,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "dev-payload-secret-change-me",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
