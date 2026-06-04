import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { FixedToolbarFeature, lexicalEditor, UploadFeature } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import { Brands } from "./collections/Brands.ts";
import { Banners } from "./collections/Banners.ts";
import { Categories } from "./collections/Categories.ts";
import { FAQ } from "./collections/FAQ.ts";
import { Media } from "./collections/Media.ts";
import { Orders } from "./collections/Orders.ts";
import { PostCategories } from "./collections/PostCategories.ts";
import { Posts } from "./collections/Posts.ts";
import { Products } from "./collections/Products.ts";
import { Projects } from "./collections/Projects.ts";
import { Solutions } from "./collections/Solutions.ts";
import { StaticPages } from "./collections/StaticPages.ts";
import { Testimonials } from "./collections/Testimonials.ts";
import { Users } from "./collections/Users.ts";
import { AboutPage } from "./globals/AboutPage.ts";
import { SiteSettings } from "./globals/SiteSettings.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const isProduction = process.env.NODE_ENV === "production";
const isVercel = Boolean(process.env.VERCEL);

const databaseURL =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  (!isProduction ? "postgres://payload:payload@127.0.0.1:5432/hpttech_payload" : undefined);

if (!databaseURL) {
  throw new Error("Missing DATABASE_URI. Use a Neon PostgreSQL connection string in production.");
}

const payloadSecret =
  process.env.PAYLOAD_SECRET || (!isProduction ? "dev-payload-secret-change-me" : undefined);

if (!payloadSecret) {
  throw new Error("Missing PAYLOAD_SECRET. Set a strong secret before deploying Payload.");
}

const r2Enabled = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT,
);

if (isVercel && !r2Enabled) {
  throw new Error(
    "Missing Cloudflare R2 env vars. Vercel deployments must use R2 for Payload media uploads.",
  );
}

export default buildConfig({
  admin: {
    importMap: {
      baseDir: dirname,
    },
    components: {
      afterNavLinks: ["@/components/payload/AfterNavLinks"],
      graphics: {
        Icon: "@/components/payload/NavLogo",
        Logo: "@/components/payload/NavLogo",
      },
      views: {
        dashboard: {
          Component: "@/components/payload/Dashboard",
        },
      },
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    Categories,
    Brands,
    Products,
    Orders,
    Banners,
    Solutions,
    PostCategories,
    Posts,
    Projects,
    FAQ,
    Testimonials,
    StaticPages,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
    push: process.env.PAYLOAD_DB_PUSH === "true",
  }),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      UploadFeature({
        enabledCollections: ["media"],
        collections: {
          media: {
            fields: [
              {
                name: "alt",
                label: "Alt text",
                type: "text",
                admin: {
                  description: "Mo ta ngan cho anh, dung cho SEO va accessibility.",
                },
              },
              {
                name: "displayWidth",
                label: "Kich thuoc hien thi",
                type: "select",
                defaultValue: "full",
                options: [
                  { label: "Nho - 35%", value: "small" },
                  { label: "Vua - 50%", value: "medium" },
                  { label: "Lon - 75%", value: "large" },
                  { label: "Day du - 100%", value: "full" },
                ],
              },
            ],
          },
        },
      }),
    ],
  }),
  i18n: {
    fallbackLanguage: "vi",
    supportedLanguages: {
      vi,
    },
  },
  globals: [SiteSettings, AboutPage],
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
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
