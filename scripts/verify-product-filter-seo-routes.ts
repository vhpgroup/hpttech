import assert from "node:assert/strict";
import {
  buildCleanProductBrandHref,
  buildCleanProductFilterHref,
  cleanProductBrandRedirectPath,
  cleanProductBrandRoutes,
  cleanProductFilterRedirectPath,
  cleanProductFilterRoutes,
  findCleanProductBrandRoute,
  findCleanProductFilterRoute,
} from "../lib/product-filter-seo-routes";

// Verifier cho URL SEO catalog: menu filter/brand phải sinh URL sạch, không query,
// không trùng route, và redirect từ URL query cũ phải khớp đúng landing mới.

const cleanPathPattern = /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const brandRoutes = cleanProductBrandRoutes();
const filterRoutes = cleanProductFilterRoutes();
const allHrefs = [...brandRoutes.map((route) => route.href), ...filterRoutes.map((route) => route.href)];

assert.equal(brandRoutes.length, 72, "số route brand sạch thay đổi, cần rà lại menu + SEO intent");
assert.equal(filterRoutes.length, 97, "số route filter sạch thay đổi, cần rà lại menu + SEO intent");

for (const href of allHrefs) {
  assert.match(href, cleanPathPattern, `href phải là URL path sạch, không dấu hỏi/ký tự lạ: ${href}`);
}

const duplicateHrefs = allHrefs.filter((href, index) => allHrefs.indexOf(href) !== index);
assert.deepEqual(duplicateHrefs, [], "không được có clean URL trùng nhau giữa brand/filter");

for (const route of brandRoutes) {
  assert.equal(
    buildCleanProductBrandHref(route.category, route.brand),
    route.href,
    `buildCleanProductBrandHref sai cho ${route.category}/${route.brand}`,
  );
  assert.equal(
    findCleanProductBrandRoute(route.href)?.brand,
    route.brand,
    `findCleanProductBrandRoute không tìm được ${route.href}`,
  );
  assert.equal(
    cleanProductBrandRedirectPath(`/${route.category}`, new URLSearchParams({ brand: route.brand })),
    route.href,
    `redirect brand query cũ không khớp ${route.href}`,
  );
}

for (const route of filterRoutes) {
  assert.ok(route.titlePart.trim(), `titlePart không được rỗng: ${route.href}`);
  assert.equal(
    buildCleanProductFilterHref(route.category, route.param, route.value),
    route.href,
    `buildCleanProductFilterHref sai cho ${route.category}/${route.param}/${route.value}`,
  );
  assert.equal(
    findCleanProductFilterRoute(route.href)?.value,
    route.value,
    `findCleanProductFilterRoute không tìm được ${route.href}`,
  );
  assert.equal(
    cleanProductFilterRedirectPath(`/${route.category}`, new URLSearchParams({ [route.param]: route.value })),
    route.href,
    `redirect filter query cũ không khớp ${route.href}`,
  );
}

assert.equal(
  cleanProductBrandRedirectPath("/may-scan", new URLSearchParams({ brand: "Canon", page: "2" })),
  undefined,
  "query nhiều tham số không được redirect sang landing SEO",
);
assert.equal(
  cleanProductFilterRedirectPath("/may-scan", new URLSearchParams({ size: "A4", brand: "Canon" })),
  undefined,
  "query nhiều filter không được redirect sang landing SEO",
);

console.log(`Product filter SEO route checks passed (${brandRoutes.length} brand, ${filterRoutes.length} filter).`);
