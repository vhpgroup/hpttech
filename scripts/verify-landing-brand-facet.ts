import assert from "node:assert";
import { relationMatches } from "@/lib/landing-pages";

const brand = (id: number, slug: string, name: string) => ({ id, slug, name });

const canonCandidates = ["1", "canon", "Canon"];

assert.equal(
  relationMatches(brand(1, "canon", "Canon"), canonCandidates),
  true,
  "Canon must match the Canon facet",
);
assert.equal(
  relationMatches(brand(10, "xerox", "Xerox"), canonCandidates),
  false,
  "Xerox(10) must not leak into Canon(1)",
);
assert.equal(
  relationMatches(brand(52, "zeutschel", "Zeutschel"), ["2", "epson", "Epson"]),
  false,
  "Zeutschel(52) must not leak into Epson(2)",
);
assert.equal(
  relationMatches(brand(48, "czur", "CZUR"), ["8", "plustek", "Plustek"]),
  false,
  "CZUR(48) must not leak into Plustek(8)",
);
assert.equal(
  relationMatches(brand(56, "gp", "GP"), ["6", "avision", "Avision"]),
  false,
  "GP(56) must not leak into Avision(6)",
);
assert.equal(
  relationMatches(brand(40, "hp-laptop", "HP"), ["7", "40", "hp", "hp-laptop"]),
  true,
  "HP-laptop(40) must match when the facet includes id 40",
);
assert.equal(
  relationMatches(brand(5, "kodak-alaris", "Kodak Alaris"), ["kodak"]),
  true,
  "'kodak' must still match 'Kodak Alaris'",
);

console.log("OK verify-landing-brand-facet: 7 assertions passed");
