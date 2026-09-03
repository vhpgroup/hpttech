import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildRevalidateTargets,
  parseRevalidateRequest,
  type RevalidateTargets,
} from "../lib/revalidate-targets.ts";

// Verifier cho việc làm mới cache sau khi Payload ghi dữ liệu.
//
// Khóa HAI hợp đồng:
//   A. Bản đồ collection → tag/path không đổi khi refactor (bản đồ này từng nằm
//      trong app/api/revalidate/route.ts, nay tách ra dùng chung với hook).
//   B. Hook afterChange KHÔNG được tự gọi HTTP vào chính app như đường chính —
//      đó là nguyên nhân sự cố 2026-09-04 (lưu báo thành công nhưng DB không đổi:
//      self-request từ trong transaction làm transaction rollback).
//
// Chạy: npm run test:revalidate-targets

let checks = 0;
function check(label: string, fn: () => void) {
  fn();
  checks += 1;
  console.log(`  ✓ ${label}`);
}

function sorted(targets: RevalidateTargets) {
  return { tags: [...targets.tags].sort(), paths: [...targets.paths].sort() };
}

console.log("A. Bản đồ collection → tag/path");

check("mọi thay đổi đều làm mới trang chủ", () => {
  for (const collection of ["banners", "products", "categories", "posts", "projects", "faq"]) {
    assert.ok(
      buildRevalidateTargets({ collection }).paths.includes("/"),
      `${collection} phải làm mới "/"`,
    );
  }
});

check("categories: đủ tag danh mục + tag sản phẩm + tag riêng theo slug", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "categories", slug: "may-scan" })), {
    tags: ["categories:list", "category:may-scan", "products:list"],
    paths: ["/", "/san-pham"],
  });
});

check("categories không có slug: vẫn làm mới 2 tag danh sách", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "categories" })), {
    tags: ["categories:list", "products:list"],
    paths: ["/", "/san-pham"],
  });
});

check("products: 1 slug đơn từ hook", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "products", slug: "scan-fi-8170" })), {
    tags: ["product:scan-fi-8170", "products:list"],
    paths: ["/", "/compare", "/google-merchant.xml", "/san-pham", "/san-pham/scan-fi-8170"],
  });
});

check("products: mảng slugs từ sync bảng giá, gộp với slug đơn, không trùng lặp", () => {
  const targets = buildRevalidateTargets({
    collection: "products",
    slug: "a",
    slugs: ["b", "a", "c"],
  });
  assert.deepEqual(sorted(targets).tags, ["product:a", "product:b", "product:c", "products:list"]);
  for (const slug of ["a", "b", "c"]) {
    assert.ok(targets.paths.includes(`/san-pham/${slug}`), `thiếu path /san-pham/${slug}`);
  }
  assert.equal(new Set(targets.paths).size, targets.paths.length, "path không được trùng");
  assert.equal(new Set(targets.tags).size, targets.tags.length, "tag không được trùng");
});

check("variant/offer/inventory: làm mới danh sách sản phẩm + feed Merchant", () => {
  for (const collection of ["product-offers", "product-variants", "product-inventory"]) {
    const targets = buildRevalidateTargets({ collection });
    assert.deepEqual(targets.tags, ["products:list"], `${collection} sai tag`);
    assert.ok(targets.paths.includes("/san-pham"), `${collection} thiếu /san-pham`);
    assert.ok(targets.paths.includes("/google-merchant.xml"), `${collection} thiếu feed`);
  }
});

check("posts: tag bài + path bài theo slug và theo fullPath", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "posts", slug: "tin-a", path: "muc/tin-a" })), {
    tags: ["post:tin-a", "posts:list"],
    paths: ["/", "/tin-tuc", "/tin-tuc/muc/tin-a", "/tin-tuc/tin-a"],
  });
});

check("post-categories: kéo theo cả sitemap", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "post-categories", slug: "tin-cong-nghe" })), {
    tags: ["category:tin-cong-nghe", "post-categories:list", "posts:list"],
    paths: ["/", "/sitemap.xml", "/sitemap/static", "/tin-tuc"],
  });
});

check("certifications: tag riêng + trang thương hiệu", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "certifications", slug: "fujitsu" })), {
    tags: ["certification:fujitsu", "certifications"],
    paths: ["/", "/sitemap.xml", "/sitemap/static", "/thuong-hieu", "/thuong-hieu/fujitsu"],
  });
});

check("landing-pages: tag theo path, gồm cả path /giai-phap/ trong mảng paths", () => {
  const targets = buildRevalidateTargets({
    collection: "landing-pages",
    path: "/giai-phap/so-hoa",
    paths: ["/giai-phap/khac", "/khong-tinh"],
  });
  assert.deepEqual(sorted(targets).tags, [
    "landing-page:/giai-phap/khac",
    "landing-page:/giai-phap/so-hoa",
    "landing-pages:list",
  ]);
});

check("static-pages: làm mới đúng đường dẫn trang tĩnh", () => {
  assert.deepEqual(sorted(buildRevalidateTargets({ collection: "static-pages", slug: "chinh-sach-bao-hanh" })), {
    tags: [],
    paths: ["/", "/chinh-sach-bao-hanh"],
  });
});

check("globals: site-settings và about-page", () => {
  assert.deepEqual(buildRevalidateTargets({ global: "site-settings" }).paths, ["/"]);
  assert.ok(buildRevalidateTargets({ global: "about-page" }).paths.includes("/ve-hpt"));
});

check("collection lạ không làm nổ, chỉ làm mới trang chủ", () => {
  assert.deepEqual(buildRevalidateTargets({ collection: "khong-ton-tai" }), { tags: [], paths: ["/"] });
});

console.log("\nB. Chuẩn hóa body từ endpoint");

check("bỏ qua field sai kiểu, loại chuỗi rỗng khỏi slugs", () => {
  const parsed = parseRevalidateRequest({
    collection: "products",
    slug: 123,
    slugs: ["a", "", "  ", 7, "b"],
    paths: ["/x", 9],
  });
  assert.equal(parsed.slug, undefined);
  assert.deepEqual(parsed.slugs, ["a", "b"]);
  assert.deepEqual(parsed.paths, ["/x"]);
});

check("body rỗng / không phải object vẫn an toàn", () => {
  for (const body of [{}, null, undefined, "chuoi", 42]) {
    assert.deepEqual(buildRevalidateTargets(parseRevalidateRequest(body)), { tags: [], paths: ["/"] });
  }
});

console.log("\nC. Chống tái diễn sự cố 2026-09-04 (hook không tự gọi HTTP vào chính app)");

const hookPath = path.join(process.cwd(), "lib/payload/hooks/revalidate.ts");
const hookSource = readFileSync(hookPath, "utf8");

check("hook có làm mới cache trong tiến trình (next/cache)", () => {
  assert.ok(hookSource.includes("next/cache"), "hook phải dùng next/cache để làm mới ngay trong tiến trình");
  assert.ok(hookSource.includes("revalidateTag"), "hook phải gọi revalidateTag");
  assert.ok(hookSource.includes("revalidatePath"), "hook phải gọi revalidatePath");
});

check("next/cache là ĐƯỜNG CHÍNH, endpoint HTTP chỉ là fallback gọi sau", () => {
  const inProcessAt = hookSource.indexOf("next/cache");
  assert.ok(inProcessAt !== -1, "không thấy next/cache trong hook");

  // Kiểm tra ĐIỂM GỌI fallback, không phải nơi định nghĩa hàm — thứ tự định nghĩa
  // hàm trong file không nói lên đường nào là đường chính.
  const fallbackCallAt = hookSource.indexOf("await postRevalidate(");
  if (fallbackCallAt !== -1) {
    assert.ok(
      inProcessAt < fallbackCallAt,
      "lời gọi endpoint /api/revalidate phải nằm SAU nhánh làm mới trong tiến trình — " +
        "không được là đường chính (xem sự cố 2026-09-04)",
    );
  }

  // Và hook không được gọi fetch trực tiếp ở thân các hook export.
  for (const hookName of ["revalidateCollection", "revalidateCollectionDelete", "revalidateGlobal"]) {
    const start = hookSource.indexOf(`export const ${hookName}`);
    assert.ok(start !== -1, `thiếu hook ${hookName}`);
    const body = hookSource.slice(start, start + 600);
    assert.ok(
      !body.includes("fetch("),
      `${hookName} không được gọi fetch trực tiếp — phải đi qua applyRevalidate`,
    );
  }
});

check("mọi lỗi làm mới cache bị nuốt, không thể rollback lần ghi", () => {
  assert.ok(hookSource.includes("try {"), "phần làm mới cache phải nằm trong try/catch");
  assert.ok(
    hookSource.includes("catch (inProcessError)") || hookSource.includes("catch (error)"),
    "phải có catch cho nhánh làm mới cache",
  );
});

check("có công tắc disableRevalidate cho script ghi hàng loạt", () => {
  assert.ok(hookSource.includes("disableRevalidate"), "thiếu công tắc context.disableRevalidate");
});

console.log(`\n✅ ${checks} kiểm tra PASS — bản đồ revalidate và hàng rào chống sự cố 2026-09-04 còn nguyên.`);
