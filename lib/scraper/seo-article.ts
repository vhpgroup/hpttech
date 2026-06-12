import { Client } from "pg";
import { cleanText, productShortDescription } from "./text";
import type { ProductSpec, ScrapedProduct } from "./types";

type UploadedImage = {
  id: string | number;
  url: string;
};

type ProductKind =
  | "scanner"
  | "printer"
  | "camera"
  | "network"
  | "computer"
  | "accessory"
  | "office";

const BANNED_SEO_WORDS = [
  "tốt nhất",
  "số 1",
  "hoàn hảo",
  "đỉnh cao",
  "vượt trội nhất",
];

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

function specHasPositiveValue(value?: string) {
  if (!value) return false;
  return !/\b(khong|không|no|none|false|khong ho tro|không hỗ trợ)\b/i.test(
    normalize(value),
  );
}

function wordCount(value: string) {
  return cleanText(value).split(/\s+/).filter(Boolean).length;
}

function inferProductKind(title: string, specs: ProductSpec[]): ProductKind {
  const text = normalize(`${title} ${specs.map((spec) => `${spec.label} ${spec.value}`).join(" ")}`);
  if (/\b(scan|scanner|may quet|adf|ocr|duplex scan)\b/.test(text)) return "scanner";
  if (/\b(may in|printer|muc in|cartridge|toner|drum)\b/.test(text)) return "printer";
  if (/\b(camera|ip camera|dau ghi|nvr|cctv|hong ngoai)\b/.test(text)) return "camera";
  if (/\b(router|switch|wifi|access point|poe|firewall|mang lan|ethernet)\b/.test(text)) return "network";
  if (/\b(laptop|pc|may tinh|server|workstation|cpu|ram|ssd)\b/.test(text)) return "computer";
  if (/\b(cap|cable|adapter|phu kien|pin|sac)\b/.test(text)) return "accessory";
  return "office";
}

function productNoun(kind: ProductKind) {
  switch (kind) {
    case "scanner":
      return "máy scan";
    case "printer":
      return "máy in";
    case "camera":
      return "camera";
    case "network":
      return "thiết bị mạng";
    case "computer":
      return "thiết bị máy tính";
    case "accessory":
      return "phụ kiện";
    default:
      return "thiết bị văn phòng";
  }
}

function productDisplayName(title: string) {
  const cleaned = cleanText(title).replace(/[.!?]+$/, "");
  const [beforeDash] = cleaned.split(/\s+[–-]\s+/);
  if (beforeDash && beforeDash.length >= 8 && beforeDash.length <= 80) {
    return beforeDash.trim();
  }
  return cleaned;
}

function usageTitle(kind: ProductKind) {
  switch (kind) {
    case "scanner":
      return "Chất lượng scan và hiệu suất làm việc";
    case "printer":
      return "Chất lượng in và hiệu suất vận hành";
    case "camera":
      return "Khả năng quan sát và vận hành";
    case "network":
      return "Hiệu năng kết nối và độ ổn định";
    case "computer":
      return "Hiệu năng sử dụng trong công việc";
    default:
      return "Khả năng sử dụng thực tế";
  }
}

function keySpecs(specs: ProductSpec[], limit = 10) {
  return specs
    .map((spec) => ({
      label: cleanText(spec.label),
      value: cleanText(spec.value),
    }))
    .filter((spec) => spec.label && spec.value)
    .slice(0, limit);
}

function extractSourceHighlights(value?: string) {
  const text = cleanText(value);
  const marker = text.match(/(?:điểm nổi bật|dac diem noi bat|đặc điểm nổi bật|diem noi bat)\s*[:：]?/i);
  const source = marker && marker.index !== undefined ? text.slice(marker.index + marker[0].length) : text;

  return source
    .split(/\s+(?:[-•]|[0-9]+\.)\s+/)
    .map((item) => cleanText(item))
    .filter((item) => item.length >= 18)
    .slice(0, 8);
}

function fallbackHighlights(title: string, kind: ProductKind, specs: ProductSpec[]) {
  const points: string[] = [];
  const speed = specValue(specs, [/toc do/, /speed/, /ppm/, /ipm/]);
  const resolution = specValue(specs, [/do phan giai/, /resolution/]);
  const duplex = specValue(specs, [/hai mat/, /2 mat/, /duplex/]);
  const adf = specValue(specs, [/adf/, /khay nap/, /khay giay/]);
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /paper size/, /document size/]);
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /interface/, /connect/]);
  const os = specValue(specs, [/he dieu hanh/, /operating system/, /supported os/]);
  const warranty = specValue(specs, [/bao hanh/, /warranty/]);

  if (speed) points.push(`Hiệu suất xử lý theo thông số ${cleanText(speed)}, phù hợp nhu cầu vận hành thường xuyên.`);
  if (specHasPositiveValue(duplex)) points.push(`Hỗ trợ xử lý hai mặt, giúp giảm thao tác thủ công khi làm việc với tài liệu nhiều trang.`);
  if (adf) points.push(`Khay nạp/khay giấy ${cleanText(adf)}, thuận tiện khi cần xử lý nhiều tài liệu liên tục.`);
  if (paper) points.push(`Hỗ trợ khổ tài liệu hoặc khổ giấy ${cleanText(paper)}, đáp ứng nhiều nhóm hồ sơ khác nhau.`);
  if (resolution) points.push(`Độ phân giải ${cleanText(resolution)}, giúp đầu ra rõ ràng hơn khi lưu trữ hoặc khai thác dữ liệu.`);
  if (connect) points.push(`Kết nối ${cleanText(connect)}, dễ triển khai trong môi trường làm việc hiện có.`);
  if (os) points.push(`Tương thích ${cleanText(os)}, thuận tiện cho đội ngũ kỹ thuật khi cài đặt và vận hành.`);
  if (warranty) points.push(`Bảo hành ${cleanText(warranty)}, hỗ trợ khách hàng yên tâm hơn khi đưa thiết bị vào sử dụng.`);

  if (!points.length) {
    points.push(
      `${title} có thông tin kỹ thuật được tổng hợp từ nguồn sản phẩm đã crawl, phù hợp để khách hàng tham khảo trước khi chọn mua.`,
    );
    points.push(
      `Thiết bị thuộc nhóm ${productNoun(kind)}, có thể được HPT Tech tư vấn theo nhu cầu sử dụng thực tế của từng khách hàng.`,
    );
  }

  return points.slice(0, 8);
}

function highlights(product: ScrapedProduct, kind: ProductKind) {
  const sourcePoints = extractSourceHighlights(product.data.description);
  const points = sourcePoints.length >= 4
    ? sourcePoints
    : fallbackHighlights(cleanText(product.data.title), kind, product.data.specs);
  return points.slice(0, 8);
}

function htmlList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
}

function specsHTML(specs: ProductSpec[]) {
  const items = keySpecs(specs, 10);
  if (!items.length) return `<p>NEED_REVIEW: specifications</p>`;

  return `<ul>${items
    .map((spec) => `<li><strong>${escapeHTML(spec.label)}:</strong> ${escapeHTML(spec.value)}</li>`)
    .join("")}</ul>`;
}

function imageHTML(image?: UploadedImage, alt?: string) {
  if (!image?.url) return `<p>NEED_REVIEW_BLOCKING: product_image</p>`;
  return `<figure><img src="${escapeHTML(image.url)}" alt="${escapeHTML(alt || "Ảnh sản phẩm")}" loading="lazy" style="max-width:100%;height:auto;" /></figure>`;
}

function introParagraphs(title: string, kind: ProductKind, shortDescription: string, specs: ProductSpec[]) {
  const noun = productNoun(kind);
  const speed = specValue(specs, [/toc do/, /speed/, /ppm/, /ipm/]);
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /interface/, /connect/]);
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /paper size/, /document size/]);

  const secondParts = [
    speed ? `hiệu suất ${cleanText(speed)}` : "",
    paper ? `khả năng xử lý ${cleanText(paper)}` : "",
    connect ? `kết nối ${cleanText(connect)}` : "",
  ].filter(Boolean);

  return [
    `${shortDescription || `${title} là ${noun} chính hãng được HPT Tech cung cấp cho nhu cầu sử dụng chuyên nghiệp.`} Sản phẩm phù hợp với khách hàng cần một thiết bị có thông tin rõ ràng, dễ đối chiếu thông số và có thể triển khai trong môi trường làm việc thực tế.`,
    secondParts.length
      ? `Điểm đáng chú ý của ${title} nằm ở ${secondParts.join(", ")}. Những thông tin này giúp người mua nhanh chóng đánh giá sản phẩm có phù hợp với quy mô sử dụng, hạ tầng hiện có và yêu cầu vận hành hằng ngày hay không.`
      : `${title} được trình bày theo các thông tin đã crawl từ nguồn sản phẩm, giúp người mua tham khảo trước khi yêu cầu tư vấn cấu hình, báo giá hoặc phương án triển khai.`,
  ];
}

function designParagraphs(title: string, kind: ProductKind, specs: ProductSpec[]) {
  const speed = specValue(specs, [/toc do/, /speed/, /ppm/, /ipm/]);
  const resolution = specValue(specs, [/do phan giai/, /resolution/]);
  const adf = specValue(specs, [/adf/, /khay nap/, /khay giay/]);
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /paper size/, /document size/]);

  if (kind === "scanner") {
    return [
      `${title} hướng đến nhu cầu số hóa tài liệu trong văn phòng, doanh nghiệp, trường học hoặc đơn vị cần xử lý hồ sơ định kỳ. Thiết kế của máy scan thường được đánh giá qua khả năng đặt máy, cách nạp tài liệu, độ thuận tiện khi vận hành và sự ổn định khi xử lý nhiều trang liên tục.`,
      `${adf ? `Thông số khay nạp/khay giấy ${cleanText(adf)} hỗ trợ người dùng giảm thao tác nạp từng tờ.` : "Với các nhu cầu scan tài liệu thông dụng, người dùng nên kiểm tra kỹ khay nạp và cách xử lý giấy trước khi triển khai."} ${speed ? `Hiệu suất ${cleanText(speed)} giúp rút ngắn thời gian chờ khi xử lý hồ sơ nhiều trang.` : ""} ${paper ? `Khả năng hỗ trợ ${cleanText(paper)} giúp thiết bị linh hoạt hơn với nhiều nhóm tài liệu.` : ""}`,
      `${resolution ? `Độ phân giải ${cleanText(resolution)} là yếu tố quan trọng khi cần bản scan rõ chữ, dễ lưu trữ hoặc phục vụ OCR.` : "Chất lượng đầu ra phụ thuộc vào độ phân giải, loại tài liệu, phần mềm sử dụng và cách thiết lập trước khi scan."} Khi vận hành thực tế, người dùng nên phân loại tài liệu, tháo ghim và kiểm tra mẫu đầu ra để hạn chế phải quét lại.`,
    ];
  }

  if (kind === "printer") {
    return [
      `${title} phù hợp với nhu cầu in ấn trong môi trường cá nhân, văn phòng hoặc nhóm làm việc cần thiết bị ổn định. Khi chọn máy in, người dùng thường quan tâm đến tốc độ in, chất lượng bản in, khả năng in hai mặt, khay giấy, loại mực sử dụng và chi phí vận hành.`,
      `${speed ? `Thông số tốc độ ${cleanText(speed)} giúp đánh giá khả năng đáp ứng khi cần in tài liệu thường xuyên.` : "Người mua nên đối chiếu khối lượng in mỗi ngày với cấu hình máy để chọn đúng model."} ${paper ? `Khả năng hỗ trợ ${cleanText(paper)} giúp thiết bị phù hợp hơn với nhiều loại giấy.` : ""}`,
    ];
  }

  if (kind === "camera") {
    return [
      `${title} được xem xét theo các yếu tố như độ phân giải, góc quan sát, khả năng hoạt động trong điều kiện ánh sáng khác nhau, phương thức lưu trữ và độ ổn định khi vận hành liên tục.`,
      `${resolution ? `Độ phân giải ${cleanText(resolution)} giúp người dùng đánh giá mức độ chi tiết của hình ảnh.` : "Người mua nên kiểm tra yêu cầu quan sát thực tế trước khi chọn camera."} Thiết bị cần được lắp đặt đúng vị trí để phát huy hiệu quả giám sát và hạn chế điểm mù.`,
    ];
  }

  return [
    `${title} được lựa chọn dựa trên sự phù hợp giữa cấu hình, tính năng và môi trường sử dụng. Với nhóm ${productNoun(kind)}, người mua nên quan tâm đến độ ổn định, khả năng triển khai, mức độ tương thích và nhu cầu vận hành thực tế.`,
    `${speed ? `Thông số hiệu suất ${cleanText(speed)} là một điểm cần lưu ý khi so sánh với các model khác.` : "Các thông số kỹ thuật nên được đối chiếu với nhu cầu sử dụng trước khi quyết định."} ${paper ? `Thông tin hỗ trợ ${cleanText(paper)} cũng giúp xác định phạm vi ứng dụng của sản phẩm.` : ""}`,
  ];
}

function practicalParagraphs(title: string, kind: ProductKind, specs: ProductSpec[]) {
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /interface/, /connect/]);
  const os = specValue(specs, [/he dieu hanh/, /operating system/, /supported os/]);
  const fileFormat = specValue(specs, [/dinh dang file/, /file format/]);

  if (kind === "scanner") {
    return [
      `${title} giúp chuyển đổi tài liệu giấy thành dữ liệu số để lưu trữ, chia sẻ và tìm kiếm thuận tiện hơn. Với các phòng ban như kế toán, hành chính, nhân sự hoặc lưu trữ, việc có một thiết bị scan phù hợp giúp giảm thời gian xử lý hồ sơ và hạn chế thất lạc chứng từ.`,
      `${fileFormat ? `Thông tin định dạng file ${cleanText(fileFormat)} hỗ trợ người dùng xác định cách lưu tài liệu sau khi scan.` : "Khi triển khai, đơn vị nên thống nhất định dạng file, cách đặt tên và thư mục lưu trữ để dữ liệu dễ quản lý."}`,
    ];
  }

  if (kind === "printer") {
    return [
      `${title} hỗ trợ nhu cầu in tài liệu hằng ngày như hợp đồng, báo giá, biểu mẫu, hồ sơ nội bộ hoặc tài liệu giao dịch. Một máy in phù hợp giúp giảm thời gian chờ, ổn định quy trình xử lý giấy tờ và kiểm soát chi phí vận hành tốt hơn.`,
      "Người dùng nên xác định trước khối lượng in, loại giấy, nhu cầu in màu hoặc in trắng đen để chọn đúng cấu hình.",
    ];
  }

  return [
    `${title} phù hợp khi khách hàng cần một thiết bị có thể đưa vào vận hành ổn định trong môi trường thực tế. Giá trị của sản phẩm không chỉ nằm ở thông số riêng lẻ mà còn ở khả năng đáp ứng đúng công việc hằng ngày.`,
    `${connect ? `Kết nối ${cleanText(connect)} giúp việc triển khai linh hoạt hơn trong hệ thống hiện có.` : ""} ${os ? `Thông tin tương thích ${cleanText(os)} cần được kiểm tra trước khi cài đặt.` : ""}`.trim(),
  ].filter(Boolean);
}

function integrationParagraph(title: string, kind: ProductKind, specs: ProductSpec[]) {
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /interface/, /connect/]);
  const os = specValue(specs, [/he dieu hanh/, /operating system/, /supported os/]);
  const software = specValue(specs, [/phan mem/, /software/, /ocr/]);

  const details = [
    connect ? `kết nối ${cleanText(connect)}` : "",
    os ? `tương thích ${cleanText(os)}` : "",
    software ? `phần mềm/OCR ${cleanText(software)}` : "",
  ].filter(Boolean);

  if (details.length) {
    return `${title} có các thông tin triển khai đáng chú ý gồm ${details.join(", ")}. Đây là nhóm dữ liệu quan trọng khi doanh nghiệp cần tích hợp thiết bị vào hệ thống hiện có, phân quyền người dùng, chuẩn hóa quy trình làm việc hoặc giao cho bộ phận kỹ thuật cài đặt.`;
  }

  return `${title} nên được triển khai sau khi đã kiểm tra vị trí sử dụng, hạ tầng hiện có và yêu cầu vận hành của người dùng cuối. Với nhóm ${productNoun(kind)}, HPT Tech có thể tư vấn phương án phù hợp thay vì chỉ dựa vào tên model hoặc một vài thông số rời rạc.`;
}

function fitParagraphs(title: string, kind: ProductKind) {
  if (kind === "scanner") {
    return [
      `${title} phù hợp với văn phòng, doanh nghiệp, trường học, bệnh viện, cơ quan nhà nước hoặc bộ phận cần số hóa hồ sơ thường xuyên. Sản phẩm đặc biệt hữu ích cho các nhóm xử lý hợp đồng, chứng từ kế toán, hồ sơ nhân sự, biểu mẫu hành chính và tài liệu lưu trữ.`,
      "Nếu nhu cầu scan mỗi ngày rất thấp, khách hàng có thể cân nhắc model nhỏ hơn để tối ưu chi phí. Nếu cần xử lý khối lượng lớn liên tục, scan khổ lớn hoặc yêu cầu tích hợp sâu với hệ thống quản lý tài liệu, nên trao đổi thêm với HPT Tech để chọn model cao hơn.",
    ];
  }

  if (kind === "printer") {
    return [
      `${title} phù hợp với cá nhân, hộ kinh doanh, văn phòng, trường học hoặc doanh nghiệp cần in tài liệu thường xuyên. Sản phẩm nên được chọn dựa trên khối lượng in, nhu cầu in màu/trắng đen, số người dùng chung và chi phí mực in dự kiến.`,
      "Nếu nhu cầu in rất ít, khách hàng có thể chọn model gọn hơn. Nếu cần in số lượng lớn, in hai mặt thường xuyên hoặc chia sẻ qua mạng, nên cân nhắc dòng có hiệu suất và kết nối phù hợp hơn.",
    ];
  }

  return [
    `${title} phù hợp với khách hàng cần một sản phẩm rõ thông số, có nguồn cung chính hãng và được tư vấn theo nhu cầu sử dụng thực tế. Thiết bị có thể dùng cho cá nhân, văn phòng, doanh nghiệp, trường học, bệnh viện hoặc cơ quan tùy theo cấu hình và mục đích triển khai.`,
    "Nếu nhu cầu sử dụng đơn giản, khách hàng có thể chọn model thấp hơn để tối ưu chi phí. Nếu cần vận hành liên tục, tích hợp hệ thống hoặc dùng cho nhiều người, nên cân nhắc model cao hơn sau khi được tư vấn.",
  ];
}

function buyingAdvice(title: string, kind: ProductKind) {
  return `Trước khi chọn ${title}, khách hàng nên xác định rõ nhu cầu sử dụng, tần suất vận hành, số lượng người dùng, yêu cầu kết nối và các thông số bắt buộc cho công việc. Với nhóm ${productNoun(kind)}, không nên chỉ nhìn vào tên model hoặc giá bán, mà cần đối chiếu thông số với tình huống sử dụng thật. Nếu cần dùng ở quy mô lớn, nên chọn model có hiệu suất cao hơn; nếu nhu cầu cơ bản, model thấp hơn có thể giúp tiết kiệm ngân sách.`;
}

function hptPolicy(title: string) {
  return `${title} được HPT Tech tư vấn và cung cấp theo định hướng sản phẩm chính hãng, bảo hành theo tiêu chuẩn nhà sản xuất hoặc hãng phân phối. Khách hàng được hỗ trợ chọn cấu hình theo nhu cầu thực tế, phù hợp cho cá nhân, doanh nghiệp, trường học, bệnh viện và cơ quan nhà nước khi có yêu cầu. HPT Tech hỗ trợ báo giá, tư vấn giải pháp, giao hàng toàn quốc và phối hợp kiểm tra thông tin sản phẩm trước khi xác nhận đơn hàng.`;
}

function faqItems(title: string, kind: ProductKind, specs: ProductSpec[]) {
  const speed = specValue(specs, [/toc do/, /speed/, /ppm/, /ipm/]);
  const connect = specValue(specs, [/ket noi/, /giao tiep/, /interface/, /connect/]);
  const duplex = specValue(specs, [/hai mat/, /2 mat/, /duplex/]);
  const paper = specValue(specs, [/kho giay/, /kho tai lieu/, /paper size/, /document size/]);
  const os = specValue(specs, [/he dieu hanh/, /operating system/, /supported os/]);
  const warranty = specValue(specs, [/bao hanh/, /warranty/]);
  const questions = [
    {
      question: `${title} phù hợp với ai?`,
      answer:
        kind === "scanner"
          ? `${title} phù hợp với văn phòng, doanh nghiệp, trường học, cơ quan hoặc bộ phận cần số hóa tài liệu thường xuyên.`
          : `${title} phù hợp với khách hàng cần thiết bị chính hãng, có thông số rõ ràng và được tư vấn theo nhu cầu sử dụng thực tế.`,
    },
    speed
      ? {
          question: `${title} có hiệu suất bao nhiêu?`,
          answer: `Thông số hiệu suất hiện ghi nhận: ${cleanText(speed)}.`,
        }
      : undefined,
    specHasPositiveValue(duplex)
      ? {
          question: `${title} có hỗ trợ xử lý hai mặt không?`,
          answer: `Có. Dữ liệu thông số hiện ghi nhận: ${cleanText(duplex)}.`,
        }
      : undefined,
    connect
      ? {
          question: `${title} hỗ trợ kết nối nào?`,
          answer: `Thông tin kết nối hiện ghi nhận: ${cleanText(connect)}.`,
        }
      : undefined,
    paper
      ? {
          question: `${title} hỗ trợ khổ giấy hoặc tài liệu nào?`,
          answer: `Thông số hiện ghi nhận: ${cleanText(paper)}.`,
        }
      : undefined,
    os
      ? {
          question: `${title} tương thích hệ điều hành nào?`,
          answer: `Thông tin tương thích hiện ghi nhận: ${cleanText(os)}.`,
        }
      : undefined,
    warranty
      ? {
          question: `${title} bảo hành như thế nào?`,
          answer: `Thông tin bảo hành hiện ghi nhận: ${cleanText(warranty)}.`,
        }
      : {
          question: `${title} có được bảo hành không?`,
          answer: "Thông tin này cần được HPT Tech xác nhận theo từng cấu hình hoặc lô hàng.",
        },
  ].filter((item): item is { question: string; answer: string } => Boolean(item));

  return questions.slice(0, 8);
}

function faqHTML(title: string, kind: ProductKind, specs: ProductSpec[]) {
  return faqItems(title, kind, specs)
    .map((item) => `<h3>${escapeHTML(item.question)}</h3><p>${escapeHTML(item.answer)}</p>`)
    .join("");
}

function paragraphHTML(paragraphs: string[]) {
  return paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
}

function stripBannedWords(html: string) {
  return BANNED_SEO_WORDS.reduce(
    (output, word) => output.replace(new RegExp(word, "gi"), ""),
    html,
  );
}

export function buildProductSeoArticleHTML(product: ScrapedProduct, images: UploadedImage[]) {
  const title = productDisplayName(product.data.title);
  const specs = product.data.specs;
  const kind = inferProductKind(title, specs);
  const shortDescription = productShortDescription(title, specs);
  const mainImage = images[0];
  const intro = introParagraphs(title, kind, shortDescription, specs);
  const descriptionHTML = `<div class="payload-richtext" data-content-rule="hpt-product-seo-v1.3">
<h2>Giới thiệu sản phẩm</h2>
${paragraphHTML(intro)}
${imageHTML(mainImage, title)}
<h2>Đặc điểm nổi bật</h2>
${htmlList(highlights(product, kind))}
<h2>Thiết kế, tính năng và hiệu năng</h2>
${paragraphHTML(designParagraphs(title, kind, specs))}
<h2>${escapeHTML(usageTitle(kind))}</h2>
${paragraphHTML(practicalParagraphs(title, kind, specs))}
<h2>Kết nối, phần mềm và khả năng mở rộng</h2>
<p>${escapeHTML(integrationParagraph(title, kind, specs))}</p>
<h2>${escapeHTML(title)} phù hợp với nhu cầu nào?</h2>
${paragraphHTML(fitParagraphs(title, kind))}
<h2>Lưu ý khi chọn mua</h2>
<p>${escapeHTML(buyingAdvice(title, kind))}</p>
<h2>Thông số kỹ thuật đáng chú ý</h2>
${specsHTML(specs)}
<h2>Chính sách bán hàng tại HPT Tech</h2>
<p>${escapeHTML(hptPolicy(title))}</p>
<p>Xem thêm <a href="/san-pham">danh mục sản phẩm HPT Tech</a> hoặc liên hệ đội ngũ tư vấn để được gợi ý model phù hợp.</p>
<h2>Câu hỏi thường gặp về ${escapeHTML(title)}</h2>
${faqHTML(title, kind, specs)}
</div>`;

  return stripBannedWords(descriptionHTML);
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
