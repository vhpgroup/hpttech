import type { SanPhamHubData } from "@/lib/san-pham-hub";
import { HubHero } from "./HubHero";
import { HubProductGrid } from "./HubProductGrid";
import { HubBrandStrip } from "./HubBrandStrip";
import { HubSolutionLinks } from "./HubSolutionLinks";
import { HubCta } from "./HubCta";

type SanPhamHubProps = {
  data: SanPhamHubData;
};

/**
 * Server Component — trang hub /san-pham (không tham số).
 * Nhận data đã load từ page.tsx, phân phối xuống các section.
 * Các section chứa ProductCard (client) tự khai "use client" ở client boundary con.
 */
export function SanPhamHub({ data }: SanPhamHubProps) {
  const { groups, brands, solutionLinks, totalProducts } = data;

  // Map id → title cho hero quick-jump anchors
  const groupTitles: Record<string, string> = {};
  for (const group of groups) {
    groupTitles[group.id] = group.title;
  }
  const groupIds = groups.map((g) => g.id);

  return (
    <div className="font-sans">
      {/* 1. Hero + Trust Band */}
      <HubHero
        totalProducts={totalProducts}
        groupIds={groupIds}
        groupTitles={groupTitles}
      />

      {/* 2. Sections nhóm sản phẩm (xen kẽ nền) */}
      {groups.map((group, index) => (
        <HubProductGrid
          key={group.id}
          group={group}
          altBg={index % 2 === 0}
        />
      ))}

      {/* 3. Brand strip */}
      <HubBrandStrip brands={brands} />

      {/* 4. Giải pháp / landing links (pSEO) */}
      <HubSolutionLinks solutionLinks={solutionLinks} />

      {/* 5. CTA báo giá */}
      <HubCta />
    </div>
  );
}
