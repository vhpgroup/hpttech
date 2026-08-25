import assert from "node:assert/strict";
import {
  anchorHeadingId,
  buildCategorySeoToc,
  extractLexicalHeadings,
  normalizeCategorySeoContent,
  splitLexicalByHeadings,
} from "../lib/category-seo-toc";

// Verifier cho khối NỘI DUNG SEO danh mục (landing /<slug>, mô hình samnec).
// Bảo vệ hợp đồng: mục lục "Xem nhanh" luôn khớp anchor thật trong bài, id ổn
// định khi người viết đổi số thứ tự, và khối tự ẩn khi chưa có nội dung.

function heading(tag: string, text: string) {
  return { type: "heading", tag, children: [{ type: "text", text }] };
}

function paragraph(text: string) {
  return { type: "paragraph", children: [{ type: "text", text }] };
}

function doc(children: unknown[]) {
  return { root: { type: "root", children } };
}

// --- anchor id: bỏ dấu tiếng Việt, cắt tiền tố số thứ tự -------------------

assert.equal(anchorHeadingId("Những thông số cơ bản của máy scan", 0), "muc-nhung-thong-so-co-ban-cua-may-scan");

// Tiền tố số La Mã / số Ả Rập bị cắt khỏi id → chèn thêm mục ở giữa bài KHÔNG
// làm đổi anchor của các mục sau (link đã chia sẻ/đã index vẫn sống).
assert.equal(anchorHeadingId("I. Những thông số cơ bản", 0), "muc-nhung-thong-so-co-ban");
assert.equal(anchorHeadingId("II. Những thông số cơ bản", 0), "muc-nhung-thong-so-co-ban");
assert.equal(anchorHeadingId("1. Máy scan Fujitsu", 0), "muc-may-scan-fujitsu");
assert.equal(anchorHeadingId("IV) Tiêu chí chọn mua", 0), "muc-tieu-chi-chon-mua");

// Heading không còn ký tự latin nào → fallback theo vị trí, không sinh id rỗng.
assert.equal(anchorHeadingId("!!!", 4), "muc-5");

// --- bóc heading + chống trùng id -----------------------------------------

const headings = extractLexicalHeadings(
  doc([
    paragraph("Đoạn dẫn nhập."),
    heading("h2", "I. Thông số cơ bản"),
    paragraph("Nội dung."),
    heading("h3", "1. Độ phân giải"),
    heading("h3", "2. Tốc độ quét"),
    heading("h2", "II. Phân loại máy scan"),
    heading("h4", "Ghi chú thêm"),
    heading("h5", "Không tính vào mục lục"),
  ]),
);

assert.deepEqual(
  headings.map((item) => [item.level, item.id]),
  [
    [2, "muc-thong-so-co-ban"],
    [3, "muc-do-phan-giai"],
    [3, "muc-toc-do-quet"],
    [2, "muc-phan-loai-may-scan"],
    [4, "muc-ghi-chu-them"],
  ],
);

// h5 trở xuống không vào mục lục (giữ mục lục gọn, đúng như samnec chỉ tới 2 tầng).
assert.equal(headings.length, 5);

// Hai heading cùng tên → id thứ hai được thêm hậu tố, không bao giờ trùng.
const dupHeadings = extractLexicalHeadings(
  doc([heading("h2", "Tivi Led"), heading("h2", "Tivi Led"), heading("h2", "Tivi Led")]),
);
assert.deepEqual(
  dupHeadings.map((item) => item.id),
  ["muc-tivi-led", "muc-tivi-led-2", "muc-tivi-led-3"],
);

// Heading LỒNG trong bảng/blockquote không được vào mục lục: split chỉ cắt ở tầng
// gốc, nên nếu đếm cả heading lồng thì mục lục dài hơn số anchor thật và lệch cặp
// (mục lục trỏ sang anchor của mục khác). Regression 26/08.
const nestedHeadingDoc = doc([
  heading("h2", "I. Mục thật"),
  {
    type: "table",
    children: [
      {
        type: "tablerow",
        children: [{ type: "tablecell", children: [heading("h3", "Heading trong bảng")] }],
      },
    ],
  },
  heading("h2", "II. Mục thật thứ hai"),
]);
const nestedHeadings = extractLexicalHeadings(nestedHeadingDoc);
assert.deepEqual(
  nestedHeadings.map((item) => item.text),
  ["I. Mục thật", "II. Mục thật thứ hai"],
  "heading lồng trong bảng phải bị bỏ qua",
);
const nestedSections = splitLexicalByHeadings(nestedHeadingDoc, nestedHeadings);
assert.deepEqual(
  nestedSections.map((section) => section.heading?.id ?? null),
  ["muc-muc-that", "muc-muc-that-thu-hai"],
  "mục lục và anchor phải khớp cặp dù có heading lồng",
);
// Bảng vẫn phải nằm trong nội dung của mục I (không bị mất khi cắt).
assert.equal(nestedSections[0].content.root.children.length, 1);

// --- cây mục lục -----------------------------------------------------------

const toc = buildCategorySeoToc(headings);
assert.equal(toc.length, 2, "chỉ h2 là mục gốc");
assert.deepEqual(
  toc[0].children.map((item) => item.text),
  ["1. Độ phân giải", "2. Tốc độ quét"],
);
assert.deepEqual(
  toc[1].children.map((item) => item.text),
  ["Ghi chú thêm"],
);

// h3 đứng TRƯỚC h2 đầu tiên (người viết đánh sai cấp) vẫn phải xuất hiện ở mục
// lục thay vì bị rơi mất.
const orphanToc = buildCategorySeoToc(
  extractLexicalHeadings(doc([heading("h3", "Mục con mồ côi"), heading("h2", "Mục chính")])),
);
assert.deepEqual(
  orphanToc.map((item) => item.text),
  ["Mục con mồ côi", "Mục chính"],
);

// --- cắt bài theo mục -----------------------------------------------------

const body = doc([
  paragraph("Dẫn nhập 1."),
  paragraph("Dẫn nhập 2."),
  heading("h2", "I. Thông số"),
  paragraph("Nội dung thông số."),
  heading("h3", "1. Độ phân giải"),
  paragraph("Nội dung độ phân giải."),
]);
const bodyHeadings = extractLexicalHeadings(body);
const sections = splitLexicalByHeadings(body, bodyHeadings);

assert.equal(sections.length, 3);
assert.equal(sections[0].heading, null, "mục đầu là đoạn dẫn nhập, không có heading");
assert.equal(sections[0].content.root.children.length, 2);
assert.equal(sections[1].heading?.id, "muc-thong-so");
assert.equal(sections[2].heading?.id, "muc-do-phan-giai");

// Hợp đồng cốt lõi: mọi mục trong mục lục PHẢI có anchor thật trong bài, nếu
// không link "Xem nhanh" sẽ bấm vào hư không.
const renderedIds = new Set(sections.flatMap((s) => (s.heading ? [s.heading.id] : [])));
for (const item of bodyHeadings) {
  assert.ok(renderedIds.has(item.id), `Thiếu anchor cho mục "${item.text}"`);
}

// Chính heading KHÔNG được lặp lại trong nội dung mục (nếu không tiêu đề bị in hai lần).
for (const section of sections) {
  const hasHeadingNode = section.content.root.children.some(
    (node) => Boolean(node) && typeof node === "object" && (node as { type?: string }).type === "heading",
  );
  assert.ok(!hasHeadingNode, "node heading phải bị tách khỏi nội dung mục");
}

// --- normalize: khối tự ẩn khi chưa có gì để hiện --------------------------

assert.equal(normalizeCategorySeoContent(null, "Tìm hiểu về máy scan"), null);
assert.equal(normalizeCategorySeoContent({}, "Tìm hiểu về máy scan"), null);

// Rich text "rỗng" của Lexical vẫn có 1 paragraph trống → phải coi là chưa có nội dung.
assert.equal(
  normalizeCategorySeoContent(
    { body: { root: { type: "root", children: [{ type: "paragraph", children: [] }] } } },
    "Tìm hiểu về máy scan",
  ),
  null,
  "paragraph rỗng không được coi là có nội dung",
);

// Tắt công tắc thì ẩn dù đã viết bài.
assert.equal(
  normalizeCategorySeoContent({ enabled: false, body }, "Tìm hiểu về máy scan"),
  null,
);

// Chỉ có FAQ, chưa có bài → vẫn hiện (FAQ schema đã đủ giá trị SEO).
const faqOnly = normalizeCategorySeoContent(
  { faqs: [{ question: "Máy scan nào bền nhất?", answer: "Dòng Fujitsu fi-series." }] },
  "Tìm hiểu về máy scan",
);
assert.ok(faqOnly);
assert.equal(faqOnly.faqs.length, 1);

// FAQ thiếu câu hỏi hoặc thiếu trả lời bị loại, không sinh schema hỏng.
const partialFaq = normalizeCategorySeoContent(
  {
    body,
    faqs: [
      { question: "Có xuất VAT không?", answer: "Có, xuất hóa đơn VAT đầy đủ." },
      { question: "Thiếu câu trả lời", answer: "   " },
      { question: "", answer: "Thiếu câu hỏi" },
    ],
  },
  "Tìm hiểu về máy scan",
);
assert.ok(partialFaq);
assert.deepEqual(
  partialFaq.faqs.map((faq) => faq.question),
  ["Có xuất VAT không?"],
);

// Mặc định: bật mục lục, tiêu đề "Xem nhanh", heading fallback theo tên danh mục.
assert.equal(partialFaq.heading, "Tìm hiểu về máy scan");
assert.equal(partialFaq.tocTitle, "Xem nhanh");
assert.equal(partialFaq.showToc, true);
assert.equal(partialFaq.seo.noIndex, false);
assert.equal(partialFaq.seo.title, undefined);

// Ghi đè SEO của content được tôn trọng; chuỗi toàn khoảng trắng coi như bỏ trống.
const overridden = normalizeCategorySeoContent(
  {
    body,
    heading: "  Cẩm nang chọn máy scan  ",
    tocTitle: "   ",
    showToc: false,
    seo: { title: "Máy scan chính hãng 2026", description: "   ", noIndex: true },
  },
  "Tìm hiểu về máy scan",
);
assert.ok(overridden);
assert.equal(overridden.heading, "Cẩm nang chọn máy scan");
assert.equal(overridden.tocTitle, "Xem nhanh", "tocTitle trắng → fallback");
assert.equal(overridden.showToc, false);
assert.equal(overridden.seo.title, "Máy scan chính hãng 2026");
assert.equal(overridden.seo.description, undefined, "description trắng → coi như bỏ trống");
assert.equal(overridden.seo.noIndex, true);

console.log("Category SEO content checks passed.");
