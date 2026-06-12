import { Client } from "pg";
import { cleanText, productShortDescription } from "./text";
import type { ScrapedProduct, ProductSpec } from "./types";

type UploadedImage = {
  id: string | number;
  url: string;
};

function escapeHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalize(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function specValue(specs: ProductSpec[], patterns: RegExp[]) {
  return specs.find((spec) => {
    const label = normalize(spec.label);
    return patterns.some((pattern) => pattern.test(label));
  })?.value;
}

function specItems(specs: ProductSpec[], limit = 14) {
  return specs
    .filter((spec) => cleanText(spec.label) && cleanText(spec.value))
    .slice(0, limit);
}

function wordCount(value: string) {
  return cleanText(value).split(/\s+/).filter(Boolean).length;
}

function firstWords(value: string, maxWords: number) {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function fallbackSellingPoints(product: ScrapedProduct) {
  const specs = product.data.specs;
  const points: string[] = [];
  const speed = specValue(specs, [/toc do/, /scan speed/]);
  const duplex = specValue(specs, [/quet (?:2|hai) mat/, /scan (?:2|hai) mat/, /duplex/]);
  const adf = specValue(specs, [/khay giay/, /khay nap/, /\badf\b/]);
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /document size/, /paper size/]);
  const resolution = specValue(specs, [/do phan giai/, /resolution/]);
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /connect/]);
  const duty = specValue(specs, [/chu ky/, /duty/]);

  if (speed) points.push(`Tốc độ quét ${speed}, hỗ trợ rút ngắn thời gian xử lý tài liệu.`);
  if (duplex) points.push(`Hỗ trợ quét hai mặt, giảm thao tác lật giấy thủ công.`);
  if (adf) points.push(`Khay nạp giấy ${adf}, phù hợp xử lý nhiều trang liên tục.`);
  if (paper) points.push(`Hỗ trợ khổ giấy ${paper}, đáp ứng nhiều nhóm hồ sơ khác nhau.`);
  if (resolution) points.push(`Độ phân giải ${resolution}, cho bản scan rõ nét để lưu trữ và OCR.`);
  if (connect) points.push(`Kết nối ${connect}, thuận tiện triển khai trong môi trường làm việc hiện có.`);
  if (duty) points.push(`Chu kỳ hoạt động ${duty}, phù hợp nhu cầu vận hành thường xuyên.`);
  points.push("Thông số được tổng hợp từ nguồn sản phẩm đã crawl, hạn chế suy diễn ngoài dữ liệu hiện có.");

  return points.slice(0, 7);
}

function extractSourceHighlights(value?: string) {
  const text = cleanText(value);
  const marker = text.match(/(?:điểm nổi bật|diem noi bat)\s*[:：]?/i);
  if (!marker || marker.index === undefined) return [];
  return text
    .slice(marker.index + marker[0].length)
    .split(/\s+-\s+/)
    .map((item) => item.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 7);
}

function faqItems(product: ScrapedProduct) {
  const title = cleanText(product.data.title);
  const specs = product.data.specs;
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /document size/, /paper size/]);
  const adf = specValue(specs, [/khay giay/, /khay nap/, /\badf\b/]);
  const duplex = specValue(specs, [/quet (?:2|hai) mat/, /scan (?:2|hai) mat/, /duplex/]);
  const os = specValue(specs, [/he dieu hanh/, /operating system/, /supported os/]);

  return [
    {
      question: `${title} phù hợp với nhu cầu nào?`,
      answer:
        `${title} phù hợp với nhu cầu số hóa tài liệu, lưu trữ hồ sơ và xử lý chứng từ trong môi trường làm việc cần thiết bị scan ổn định.`,
    },
    duplex
      ? {
          question: `${title} có quét hai mặt không?`,
          answer: `Có. Theo thông số hiện có, sản phẩm hỗ trợ quét hai mặt với giá trị: ${cleanText(duplex)}.`,
        }
      : undefined,
    adf
      ? {
          question: `${title} có khay nạp giấy tự động không?`,
          answer: `Có. Thông tin khay giấy/ADF hiện ghi nhận: ${cleanText(adf)}.`,
        }
      : undefined,
    paper
      ? {
          question: `${title} hỗ trợ khổ giấy nào?`,
          answer: `Thông số khổ giấy hiện ghi nhận: ${cleanText(paper)}.`,
        }
      : undefined,
    os
      ? {
          question: `${title} hỗ trợ hệ điều hành nào?`,
          answer: `Thông số hệ điều hành hiện ghi nhận: ${cleanText(os)}.`,
        }
      : undefined,
  ].filter((item): item is { question: string; answer: string } => Boolean(item)).slice(0, 5);
}

function htmlList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
}

function specsHTML(specs: ProductSpec[]) {
  return `<ul>${specItems(specs)
    .map(
      (spec) =>
        `<li><strong>${escapeHTML(cleanText(spec.label))}:</strong> ${escapeHTML(cleanText(spec.value))}</li>`,
    )
    .join("")}</ul>`;
}

function faqHTML(product: ScrapedProduct) {
  return faqItems(product)
    .map(
      (item) =>
        `<h3>${escapeHTML(item.question)}</h3><p>${escapeHTML(item.answer)}</p>`,
    )
    .join("");
}

function imageHTML(image?: UploadedImage, alt?: string) {
  if (!image?.url) return "";
  return `<p><img src="${escapeHTML(image.url)}" alt="${escapeHTML(alt || "Ảnh sản phẩm")}" loading="lazy" /></p>`;
}

function trimToWordRange(html: string, minWords: number, maxWords: number) {
  const count = wordCount(html);
  if (count <= maxWords) return html;
  const trimmedText = firstWords(html.replace(/<[^>]+>/g, " "), maxWords - 20);
  return `<div class="payload-richtext"><p>${escapeHTML(trimmedText)}.</p></div>`;
}

export function buildProductSeoArticleHTML(
  product: ScrapedProduct,
  images: UploadedImage[],
) {
  const title = cleanText(product.data.title);
  const shortDescription = productShortDescription(title, product.data.specs);
  const specs = product.data.specs;
  const points = extractSourceHighlights(product.data.description);
  const sellingPoints = points.length ? points : fallbackSellingPoints(product);
  const mainImage = images[0];
  const imageAlt = `${title} - hình ảnh sản phẩm`;
  const speed = specValue(specs, [/toc do/, /scan speed/]);
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /document size/, /paper size/]);
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /connect/]);
  const warranty = product.data.warranty || specValue(specs, [/bao hanh/]) || "chính hãng";

  const html = `<div class="payload-richtext">
<h2>${escapeHTML(title)} cho nhu cầu số hóa tài liệu</h2>
<p>${escapeHTML(shortDescription)}</p>
<p>${escapeHTML(title)} được xây dựng cho người dùng cần một thiết bị scan rõ thông số, dễ đánh giá trước khi mua và có thể triển khai trong nhiều môi trường khác nhau. Nội dung dưới đây tổng hợp từ dữ liệu sản phẩm đã crawl, tập trung vào điểm mạnh thực tế, thông số kỹ thuật quan trọng, nhu cầu sử dụng phù hợp và các lưu ý khi chọn mua.</p>
${imageHTML(mainImage, imageAlt)}
<h2>Điểm nổi bật của ${escapeHTML(title)}</h2>
${htmlList(sellingPoints)}
<h2>Thiết kế và khả năng vận hành</h2>
<p>${escapeHTML(title)} phù hợp với các nhu cầu xử lý tài liệu thường xuyên như lưu trữ hồ sơ, scan chứng từ, số hóa hợp đồng, biểu mẫu, tài liệu hành chính hoặc dữ liệu cần đưa vào hệ thống quản lý. Khi chọn máy scan, người dùng không chỉ nhìn vào tên model mà cần xem tốc độ, khổ giấy, khay nạp, kết nối, độ phân giải và khả năng quét hai mặt để biết sản phẩm có phù hợp quy trình thực tế hay không.</p>
<p>${speed ? `Với thông số tốc độ ${escapeHTML(cleanText(speed))}, sản phẩm giúp giảm thời gian chờ khi xử lý nhiều tài liệu.` : "Sản phẩm được trình bày theo nhóm thông số thực tế để người dùng dễ đánh giá hiệu suất."} ${paper ? `Khả năng hỗ trợ khổ giấy ${escapeHTML(cleanText(paper))} giúp thiết bị đáp ứng nhiều loại hồ sơ khác nhau.` : ""} ${connect ? `Kết nối ${escapeHTML(cleanText(connect))} hỗ trợ triển khai linh hoạt trong hệ thống đang có.` : ""}</p>
<h2>Chất lượng scan và khả năng khai thác dữ liệu</h2>
<p>Một bản scan tốt cần rõ chữ, dễ lưu trữ và thuận tiện cho việc tìm kiếm về sau. Với nhóm máy scan tài liệu, độ phân giải, công nghệ quét, khả năng xử lý giấy và định dạng file là các yếu tố ảnh hưởng trực tiếp đến chất lượng đầu ra. Nếu đơn vị có nhu cầu OCR, lưu hồ sơ điện tử hoặc chia sẻ dữ liệu giữa nhiều bộ phận, việc chọn đúng máy scan ngay từ đầu giúp giảm thao tác thủ công và hạn chế phải quét lại tài liệu.</p>
<p>Trong quá trình sử dụng, người vận hành nên phân loại tài liệu trước khi scan, tháo ghim, làm phẳng giấy và kiểm tra mẫu đầu ra. Với các bộ hồ sơ quan trọng, nên thống nhất trước định dạng file, độ phân giải, cách đặt tên file và thư mục lưu trữ. Những bước này giúp khai thác thiết bị hiệu quả hơn, đặc biệt khi scan theo lô hoặc phục vụ dự án số hóa.</p>
<h2>Thông số kỹ thuật đáng chú ý</h2>
${specsHTML(specs)}
<h2>${escapeHTML(title)} phù hợp với những ai?</h2>
<p>${escapeHTML(title)} phù hợp với văn phòng, doanh nghiệp, cơ quan, trường học, bộ phận hành chính, kế toán, nhân sự, lưu trữ hoặc các nhóm làm việc cần chuyển tài liệu giấy thành dữ liệu số. Với nhu cầu cá nhân hoặc nhóm nhỏ, sản phẩm giúp scan tài liệu gọn hơn và dễ quản lý hơn. Với tổ chức có lượng hồ sơ lớn, thiết bị hỗ trợ chuẩn hóa quy trình số hóa và giảm phụ thuộc vào thao tác nhập liệu thủ công.</p>
<p>Nếu khối lượng scan mỗi ngày cao, nên ưu tiên các yếu tố như khay nạp giấy, tốc độ scan, quét hai mặt, độ bền vận hành và phần mềm đi kèm. Nếu tài liệu có nhiều kích thước hoặc chất liệu khác nhau, cần kiểm tra kỹ khổ giấy hỗ trợ, độ dày giấy và khả năng xử lý tài liệu đặc thù. Những thông tin này giúp chọn đúng sản phẩm thay vì chỉ dựa vào giá hoặc tên thương hiệu.</p>
<h2>Mua ${escapeHTML(title)} tại HPT Tech</h2>
<p>HPT Tech hỗ trợ tư vấn ${escapeHTML(title)} theo nhu cầu thực tế của từng khách hàng. Khi cần báo giá, khách hàng nên cung cấp loại tài liệu cần scan, số lượng trang dự kiến, môi trường sử dụng, yêu cầu kết nối, định dạng file mong muốn và nhu cầu xuất hóa đơn VAT nếu có. Đội ngũ tư vấn sẽ kiểm tra thông tin sản phẩm, tình trạng hàng và chính sách bảo hành trước khi xác nhận đơn.</p>
<p>Sản phẩm được tư vấn theo chính sách bảo hành ${escapeHTML(cleanText(warranty))}. Giá bán và tình trạng hàng có thể thay đổi theo thời điểm, vì vậy khách hàng nên liên hệ HPT Tech để nhận thông tin mới nhất trước khi đặt mua.</p>
<h2>Lợi ích khi chuẩn hóa quy trình scan tài liệu</h2>
<p>Một thiết bị scan phù hợp giúp quy trình xử lý hồ sơ rõ ràng hơn: tài liệu được số hóa nhanh, dễ đặt tên, dễ lưu trữ và dễ chia sẻ cho các bộ phận liên quan. Khi dữ liệu scan được tổ chức tốt, người dùng có thể giảm thời gian tìm kiếm hồ sơ giấy, hạn chế thất lạc chứng từ và hỗ trợ làm việc từ xa hoặc phối hợp nội bộ hiệu quả hơn. Đây là giá trị quan trọng với cả văn phòng nhỏ, doanh nghiệp đang mở rộng và các đơn vị có yêu cầu lưu trữ lâu dài.</p>
<h2>Câu hỏi thường gặp về ${escapeHTML(title)}</h2>
${faqHTML(product)}
</div>`;

  return trimToWordRange(html, 1000, 1500);
}

function databaseURL() {
  return (
    process.env.DATABASE_URI ||
    process.env.POSTGRES_URL ||
    (!process.env.VERCEL
      ? "postgres://payload:payload@127.0.0.1:5433/hpttech_payload"
      : undefined)
  );
}

export async function updateProductSeoHTML(
  productId: string | number,
  summaryHTML: string,
  descriptionHTML: string,
  shortDescription: string,
) {
  const connectionString = databaseURL();
  if (!connectionString) return;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query(
      `
        update products
        set short_description = $1,
            summary_h_t_m_l = $2,
            description_h_t_m_l = $3,
            updated_at = now()
        where id = $4
      `,
      [shortDescription, summaryHTML, descriptionHTML, productId],
    );
    await client.query(
      `
        update _products_v
        set version_short_description = $1,
            version_summary_h_t_m_l = $2,
            version_description_h_t_m_l = $3,
            updated_at = now(),
            version_updated_at = now()
        where parent_id = $4
          and version__status = 'published'
      `,
      [shortDescription, summaryHTML, descriptionHTML, productId],
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function seoArticleWordCount(html: string) {
  return wordCount(html);
}

export function summaryHTML(shortDescription: string) {
  return `<div class="payload-richtext"><p>${escapeHTML(shortDescription)}</p></div>`;
}
