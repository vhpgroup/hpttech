"use client";

import { useMemo, useState } from "react";
import { HPT_DATA } from "@/lib/data";
import { HOME_FLOORS } from "@/lib/floors";
import CompareDock from "./CompareDock";
import FeaturedSection from "./FeaturedSection";
import { ProductFloor } from "./ProductFloor";
import { useCompare } from "./useCompare";

export function HomeFloors() {
  const [activeFloorId, setActiveFloorId] = useState(HOME_FLOORS[0]?.id ?? "");
  const { items, isComparing, add, toggle, remove, clear } = useCompare();
  const activeFloor = useMemo(
    () => HOME_FLOORS.find((floor) => floor.id === activeFloorId) ?? HOME_FLOORS[0],
    [activeFloorId],
  );

  return (
    <>
      <FeaturedSection onToggleCompare={toggle} isComparing={isComparing} />

      {activeFloor ? (
        <ProductFloor
          title="Top sản phẩm bán chạy"
          tabs={HOME_FLOORS}
          activeId={activeFloor.id}
          onSelectTab={setActiveFloorId}
          products={activeFloor.products}
          onToggleCompare={toggle}
          isComparing={isComparing}
        />
      ) : null}

      <CompareDock
        items={items}
        products={HPT_DATA.products}
        onAdd={add}
        onRemove={(product) => remove(product.id)}
        onClear={clear}
      />
    </>
  );
}
