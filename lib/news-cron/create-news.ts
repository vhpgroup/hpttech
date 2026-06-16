import { formatSlug } from "@/lib/payload/utils/slugify";
import { getPayloadClient } from "@/lib/payload";

type PayloadDoc = Record<string, unknown>;

type NewsSource = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

type GeneratedArticle = {
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
};

type LeafCategory = {
  id: string | number;
  name: string;
  fullTitle: string;
  fullSlug: string;
};

export type CreateNewsCronResult = {
  ok: true;
  postId: string | number;
  title: string;
  slug: string;
  fullPath?: string;
  category: string;
  sourceCount: number;
  adminUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  telegramSent: boolean;
};

export type CreateNewsCronOptions = {
  status?: "draft" | "published";
};

const MORNING_CATEGORY_KEYWORDS = [
  "tin cong nghe",
  "xu huong cong nghe",
  "ai",
  "tu dong hoa",
  "bao mat",
  "thi truong thiet bi",
];

const AFTERNOON_CATEGORY_KEYWORDS = [
  "thiet bi",
  "giai phap van phong",
  "may in",
  "may scan",
  "may photocopy",
  "ha tang",
  "cntt",
  "chuyen doi so",
  "so hoa",
  "ocr",
  "quan ly tai lieu",
  "luu tru",
  "giao duc",
];

const BLOCKED_SOURCE_HOSTS = [
  "facebook.com",
  "m.facebook.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "pinterest.com",
  "shopee.vn",
  "lazada.vn",
  "tiki.vn",
];

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function textField(doc: PayloadDoc, key: string) {
  const value = doc[key];
  return typeof value === "string" ? value : undefined;
}

function relationId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return id;
  }
  return undefined;
}

function appBaseURL() {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw.replace(/\/$/, "")}`;
}

function currentVietnamHour() {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date()),
  );
}

function dateStamp() {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).format(new Date());
}

async function getLeafCategories(): Promise<LeafCategory[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "post-categories",
    depth: 0,
    limit: 1000,
    sort: "sortOrder",
  });

  const docs = res.docs as PayloadDoc[];
  const parentIds = new Set(
    docs
      .map((doc) => relationId(doc.parent))
      .filter((id): id is string | number => id !== undefined),
  );

  return docs
    .filter((doc) => {
      const id = relationId(doc.id);
      return id && !parentIds.has(id);
    })
    .map((doc) => ({
      id: relationId(doc.id)!,
      name: textField(doc, "name") || "",
      fullTitle: textField(doc, "fullTitle") || textField(doc, "name") || "",
      fullSlug: textField(doc, "fullSlug") || textField(doc, "slug") || "",
    }))
    .filter((category) => category.id && category.name);
}

function pickCategory(categories: LeafCategory[], hour = currentVietnamHour()) {
  const preferredCategory = process.env.NEWS_CRON_CATEGORY?.trim();
  if (preferredCategory) {
    const normalizedPreferred = normalizeText(preferredCategory);
    const exact = categories.find((category) => {
      const values = [category.name, category.fullTitle, category.fullSlug].map(normalizeText);
      return values.some((value) => value === normalizedPreferred);
    });
    if (exact) return exact;

    const partial = categories.find((category) => {
      const haystack = normalizeText(`${category.name} ${category.fullTitle} ${category.fullSlug}`);
      return haystack.includes(normalizedPreferred);
    });
    if (partial) return partial;

    throw new Error(`Khong tim thay category NEWS_CRON_CATEGORY=${preferredCategory}`);
  }

  const keywords = hour < 12 ? MORNING_CATEGORY_KEYWORDS : AFTERNOON_CATEGORY_KEYWORDS;
  const pool = categories.filter((category) => {
    const haystack = normalizeText(`${category.fullTitle} ${category.fullSlug}`);
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  const candidates = pool.length ? pool : categories;
  if (!candidates.length) throw new Error("Không tìm thấy category con cuối cùng trong post-categories.");

  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return candidates[dayIndex % candidates.length];
}

function generateTopic(category: LeafCategory) {
  if (process.env.NEWS_CRON_TOPIC?.trim()) return process.env.NEWS_CRON_TOPIC.trim();

  const categoryText = category.fullTitle || category.name;
  const normalized = normalizeText(categoryText);
  const pools: Array<{ match: (value: string) => boolean; topics: string[] }> = [
    {
      match: (value) => value.includes("bao mat"),
      topics: [
        "Những lưu ý bảo mật thiết thực cho doanh nghiệp và người dùng",
        "Cách giảm rủi ro an toàn thông tin trong môi trường văn phòng",
        "Bảo mật dữ liệu doanh nghiệp: các bước cơ bản cần duy trì",
      ],
    },
    {
      match: (value) => value.includes("ai") || value.includes("tu dong hoa"),
      topics: [
        "Ứng dụng AI và tự động hóa giúp công việc văn phòng hiệu quả hơn",
        "AI trong doanh nghiệp: nên bắt đầu từ những quy trình nào",
        "Tự động hóa quy trình văn phòng: lợi ích và lưu ý khi triển khai",
      ],
    },
    {
      match: (value) => value.includes("may in"),
      topics: [
        "Cách chọn máy in văn phòng phù hợp theo nhu cầu sử dụng thực tế",
        "Những tiêu chí cần xem khi mua máy in cho doanh nghiệp",
        "Máy in văn phòng: nên quan tâm tốc độ, chi phí hay khả năng kết nối",
      ],
    },
    {
      match: (value) => value.includes("may scan") || value.includes("so hoa"),
      topics: [
        "Số hóa tài liệu trong văn phòng: lợi ích, thiết bị cần có và lưu ý triển khai",
        "Cách chọn máy scan cho nhu cầu lưu trữ hồ sơ và xử lý tài liệu",
        "Số hóa hồ sơ giấy: doanh nghiệp nên chuẩn bị gì trước khi triển khai",
      ],
    },
    {
      match: (value) => value.includes("ha tang") || value.includes("cntt") || value.includes("mang"),
      topics: [
        "Các yếu tố cần chuẩn bị khi nâng cấp hạ tầng CNTT cho doanh nghiệp",
        "Hạ tầng CNTT doanh nghiệp: những hạng mục nên kiểm tra định kỳ",
        "Triển khai hệ thống CNTT văn phòng: cách giảm gián đoạn vận hành",
      ],
    },
    {
      match: (value) => value.includes("thi truong"),
      topics: [
        "Xu hướng thị trường thiết bị công nghệ văn phòng đáng chú ý hiện nay",
        "Thiết bị văn phòng thay đổi ra sao khi doanh nghiệp tăng nhu cầu số hóa",
        "Các nhóm thiết bị công nghệ văn phòng được doanh nghiệp quan tâm",
      ],
    },
  ];
  const matched = pools.find((pool) => pool.match(normalized));
  if (matched) {
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return matched.topics[dayIndex % matched.topics.length];
  }

  if (normalized.includes("bao mat")) {
    return `Những lưu ý bảo mật thiết thực cho doanh nghiệp và người dùng trong năm ${new Date().getFullYear()}`;
  }
  if (normalized.includes("ai") || normalized.includes("tu dong hoa")) {
    return `Ứng dụng AI và tự động hóa giúp công việc văn phòng hiệu quả hơn`;
  }
  if (normalized.includes("may in")) {
    return `Cách chọn máy in văn phòng phù hợp theo nhu cầu sử dụng thực tế`;
  }
  if (normalized.includes("may scan") || normalized.includes("so hoa")) {
    return `Số hóa tài liệu trong văn phòng: lợi ích, thiết bị cần có và lưu ý triển khai`;
  }
  if (normalized.includes("ha tang") || normalized.includes("cntt") || normalized.includes("mang")) {
    return `Các yếu tố cần chuẩn bị khi nâng cấp hạ tầng CNTT cho doanh nghiệp`;
  }
  if (normalized.includes("thi truong")) {
    return `Xu hướng thị trường thiết bị công nghệ văn phòng đáng chú ý hiện nay`;
  }

  return `${categoryText}: những điều người mua nên biết trước khi lựa chọn giải pháp`;
}

function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isUsableSource(source: NewsSource) {
  if (!source.title || !source.url || source.content.length < 120) return false;
  const host = sourceHost(source.url);
  if (!host) return false;
  return !BLOCKED_SOURCE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

async function tavilySearch(topic: string, category: LeafCategory) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("Thiếu TAVILY_API_KEY.");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      include_answer: false,
      include_images: true,
      include_raw_content: false,
      max_results: 10,
      query: `${topic} ${category.fullTitle} nguồn uy tín thông tin mới`,
      search_depth: process.env.TAVILY_NEWS_SEARCH_DEPTH || process.env.TAVILY_SEARCH_DEPTH || "advanced",
      topic: "general",
    }),
    signal: AbortSignal.timeout(Number(process.env.TAVILY_NEWS_TIMEOUT_MS || 20_000)),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Tavily lỗi ${response.status}: ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    images?: Array<string | { url?: string }>;
    results?: Array<{ content?: string; score?: number; title?: string; url?: string }>;
  };
  const seen = new Set<string>();
  const sources = (payload.results || [])
    .flatMap((item): NewsSource[] => {
      if (!item.url || !item.title || !item.content) return [];
      return [{
        content: item.content.replace(/\s+/g, " ").trim(),
        score: item.score,
        title: item.title.replace(/\s+/g, " ").trim(),
        url: item.url,
      }];
    })
    .filter(isUsableSource)
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .slice(0, 8);

  const images = (payload.images || [])
    .map((image) => (typeof image === "string" ? image : image.url))
    .filter((url): url is string => Boolean(url));

  return { images, sources };
}

function openAIModel() {
  return process.env.OPENAI_NEWS_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function articlePrompt(topic: string, category: LeafCategory, sources: NewsSource[]) {
  return [
    "Bạn là writer SEO tiếng Việt cho HPT Tech.",
    "Viết bài mới hoàn toàn, không copy câu chữ nguồn, không bịa số liệu, không dùng giọng quảng cáo quá đà.",
    "Đối tượng đọc: tất cả mọi người, gồm cá nhân, văn phòng, doanh nghiệp, trường học, cơ quan.",
    "Không dùng các từ tuyệt đối như tốt nhất, số 1, hoàn hảo, đỉnh cao, vượt trội nhất.",
    "Nếu nguồn không có số liệu cụ thể thì viết theo hướng khuyến nghị/lưu ý, không tự tạo số.",
    "Trả về JSON hợp lệ, không markdown.",
    "",
    `Category: ${category.fullTitle}`,
    `Chủ đề: ${topic}`,
    `Ngày tham chiếu: ${dateStamp()}`,
    "",
    "Nguồn tham khảo:",
    ...sources.map((source, index) => `${index + 1}. ${source.title} - ${source.url}\nTóm tắt: ${source.content}`),
    "",
    "Schema JSON:",
    `{
  "title": "55-75 ký tự, tự nhiên",
  "excerpt": "1-2 câu ngắn",
  "metaTitle": "55-65 ký tự",
  "metaDescription": "140-160 ký tự",
  "sections": [{"heading":"H2","paragraphs":["đoạn 1","đoạn 2"]}],
  "faq": [{"question":"", "answer":""}]
}`,
    "Yêu cầu độ dài khoảng 900-1300 từ, chia 5-7 section, FAQ 4-6 câu.",
  ].join("\n");
}

function extractJSON(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

async function generateArticle(topic: string, category: LeafCategory, sources: NewsSource[]): Promise<GeneratedArticle> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Thiếu OPENAI_API_KEY.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          content: articlePrompt(topic, category, sources),
          role: "user",
        },
      ],
      model: openAIModel(),
      response_format: { type: "json_object" },
      temperature: 0.55,
    }),
    signal: AbortSignal.timeout(Number(process.env.OPENAI_NEWS_TIMEOUT_MS || 60_000)),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI lỗi ${response.status}: ${body.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI không trả nội dung bài viết.");

  const parsed = JSON.parse(extractJSON(content)) as Partial<GeneratedArticle>;
  if (!parsed.title || !parsed.excerpt || !Array.isArray(parsed.sections)) {
    throw new Error("OpenAI trả JSON thiếu title/excerpt/sections.");
  }

  return {
    excerpt: parsed.excerpt,
    faq: Array.isArray(parsed.faq) ? parsed.faq : [],
    metaDescription: parsed.metaDescription || parsed.excerpt.slice(0, 160),
    metaTitle: parsed.metaTitle || parsed.title,
    sections: parsed.sections,
    title: parsed.title,
  };
}

function textNode(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function paragraph(text: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    type: "paragraph",
    version: 1,
  };
}

function heading(text: string, tag: "h2" | "h3" = "h2") {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    tag,
    type: "heading",
    version: 1,
  };
}

// Kept only for optional reference output while the default article body hides sources.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function richTextContent(article: GeneratedArticle, sources: NewsSource[]) {
  const children: unknown[] = [];
  for (const section of article.sections) {
    if (section.heading) children.push(heading(section.heading));
    for (const item of section.paragraphs || []) {
      if (item?.trim()) children.push(paragraph(item.trim()));
    }
  }

  if (article.faq?.length) {
    children.push(heading("FAQ", "h2"));
    for (const item of article.faq) {
      if (item.question) children.push(heading(item.question, "h3"));
      if (item.answer) children.push(paragraph(item.answer));
    }
  }

  children.push(heading("Nguồn tham khảo", "h2"));
  for (const source of sources) {
    children.push(paragraph(`${source.title}: ${source.url}`));
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

function richTextContentForPost(article: GeneratedArticle) {
  const children: unknown[] = [];
  for (const section of article.sections) {
    if (section.heading) children.push(heading(section.heading));
    for (const item of section.paragraphs || []) {
      if (item?.trim()) children.push(paragraph(item.trim()));
    }
  }

  if (article.faq?.length) {
    children.push(heading("FAQ", "h2"));
    for (const item of article.faq) {
      if (item.question) children.push(heading(item.question, "h3"));
      if (item.answer) children.push(paragraph(item.answer));
    }
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

async function ensureUniqueSlug(title: string) {
  const payload = await getPayloadClient();
  const titleExists = await payload.find({
    collection: "posts",
    depth: 0,
    limit: 1,
    where: {
      title: {
        equals: title,
      },
    },
  });
  const safeDate = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).format(new Date());
  const safeTime = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date()).replace(":", "h");
  const finalTitle = titleExists.totalDocs > 0 ? `${title} (${safeDate})` : title;
  const baseSlug = formatSlug(finalTitle);

  for (let index = 0; index < 20; index += 1) {
    const suffix =
      index === 0
        ? ""
        : index === 1
          ? `-${new Date().toISOString().slice(0, 10)}`
          : index === 2
            ? `-${new Date().toISOString().slice(0, 10)}-${safeTime}`
            : `-${new Date().toISOString().slice(0, 10)}-${safeTime}-${index}`;
    const slug = `${baseSlug}${suffix}`;
    const res = await payload.find({
      collection: "posts",
      depth: 0,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
      },
    });
    if (res.totalDocs === 0) {
      return {
        slug,
        title: finalTitle,
      };
    }
  }
  throw new Error(`Bài viết bị trùng slug/title: ${title}`);
}

function imageFilename(url: string) {
  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.match(/\.(png|jpe?g|webp|gif|avif)$/i)?.[0] || ".jpg";
    return `${formatSlug(parsed.hostname)}-${Date.now()}${ext.toLowerCase()}`;
  } catch {
    return `news-${Date.now()}.jpg`;
  }
}

async function uploadRemoteImage(imageUrl: string | undefined, alt: string) {
  if (!imageUrl) return undefined;
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "HPTTechNewsBot/1.0",
      },
      signal: AbortSignal.timeout(Number(process.env.NEWS_IMAGE_TIMEOUT_MS || 15_000)),
    });
    if (!response.ok) return undefined;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return undefined;

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    if (data.length < 1024 || data.length > Number(process.env.NEWS_IMAGE_MAX_BYTES || 5_000_000)) {
      return undefined;
    }

    const payload = await getPayloadClient();
    const media = await payload.create({
      collection: "media",
      data: {
        alt,
        folder: "news-cron",
        tags: "news,cron",
      },
      file: {
        data,
        mimetype: contentType.split(";")[0] || "image/jpeg",
        name: imageFilename(imageUrl),
        size: data.length,
      },
    });
    return media as PayloadDoc;
  } catch (error) {
    console.warn("[news-cron] image upload skipped", error);
    return undefined;
  }
}

function absoluteImageURL(value: string, pageUrl: string) {
  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return undefined;
  }
}

async function findOpenGraphImage(sources: NewsSource[]) {
  for (const source of sources.slice(0, 5)) {
    try {
      const response = await fetch(source.url, {
        headers: {
          "User-Agent": "HPTTechNewsBot/1.0",
        },
        signal: AbortSignal.timeout(Number(process.env.NEWS_OG_TIMEOUT_MS || 10_000)),
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;

      const html = await response.text();
      const match =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i) ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i);
      const image = match?.[1] ? absoluteImageURL(match[1], source.url) : undefined;
      if (image) return image;
    } catch {
      // Try the next source.
    }
  }
  return undefined;
}

// Legacy sender kept for rollback while the current notification omits source references.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendTelegramPreviewMessage(
  result: Omit<CreateNewsCronResult, "telegramSent">,
  token: string,
  chatId: string,
) {
  const threadId = process.env.TELEGRAM_NEWS_THREAD_ID || process.env.TELEGRAM_MESSAGE_THREAD_ID;
  const messageThreadId = threadId ? Number(threadId) : undefined;
  const text = [
    "Bài viết tự động đã tạo bản nháp",
    `Tiêu đề: ${result.title}`,
    `Danh mục: ${result.category}`,
    `Nguồn tham khảo: ${result.sourceCount}`,
    result.adminUrl ? `Admin: ${result.adminUrl}` : "",
    result.previewUrl ? `Preview: ${result.previewUrl}` : "",
  ].filter(Boolean).join("\n");

  const message = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: false,
      text,
      ...(Number.isInteger(messageThreadId) ? { message_thread_id: messageThreadId } : {}),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000)),
  }).catch(() => undefined);

  if (!message?.ok) {
    const body = await message?.text().catch(() => "");
    console.warn("[news-cron] Telegram sendMessage failed", message?.status, body?.slice(0, 300));
  }

  if (!result.thumbnailUrl) return Boolean(message?.ok);

  const photo = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    body: JSON.stringify({
      caption: result.title,
      chat_id: chatId,
      photo: result.thumbnailUrl,
      ...(Number.isInteger(messageThreadId) ? { message_thread_id: messageThreadId } : {}),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000)),
  }).catch(() => undefined);

  if (!photo?.ok) {
    const body = await photo?.text().catch(() => "");
    console.warn("[news-cron] Telegram sendPhoto failed", photo?.status, body?.slice(0, 300));
  }

  return Boolean(message?.ok || photo?.ok);
}

async function sendTelegramPreviewMessageV2(
  result: Omit<CreateNewsCronResult, "telegramSent">,
  token: string,
  chatId: string,
) {
  const threadId = process.env.TELEGRAM_NEWS_THREAD_ID || process.env.TELEGRAM_MESSAGE_THREAD_ID;
  const messageThreadId = threadId ? Number(threadId) : undefined;
  const text = [
    "Bai viet tu dong da tao",
    `Tieu de: ${result.title}`,
    `Danh muc: ${result.category}`,
    result.adminUrl ? `Admin: ${result.adminUrl}` : "",
    result.previewUrl ? `Preview: ${result.previewUrl}` : "",
  ].filter(Boolean).join("\n");

  const message = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: false,
      text,
      ...(Number.isInteger(messageThreadId) ? { message_thread_id: messageThreadId } : {}),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000)),
  }).catch(() => undefined);

  if (!message?.ok) {
    const body = await message?.text().catch(() => "");
    console.warn("[news-cron] Telegram sendMessage failed", message?.status, body?.slice(0, 300));
  }

  if (!result.thumbnailUrl) return Boolean(message?.ok);

  const photo = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    body: JSON.stringify({
      caption: result.title,
      chat_id: chatId,
      photo: result.thumbnailUrl,
      ...(Number.isInteger(messageThreadId) ? { message_thread_id: messageThreadId } : {}),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000)),
  }).catch(() => undefined);

  if (!photo?.ok) {
    const body = await photo?.text().catch(() => "");
    console.warn("[news-cron] Telegram sendPhoto failed", photo?.status, body?.slice(0, 300));
  }

  return Boolean(message?.ok || photo?.ok);
}

async function sendTelegramPreview(result: Omit<CreateNewsCronResult, "telegramSent">) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  return sendTelegramPreviewMessageV2(result, token, chatId);

  const text = [
    "Bài viết tự động đã tạo bản nháp",
    `Tiêu đề: ${result.title}`,
    `Danh mục: ${result.category}`,
    `Nguồn tham khảo: ${result.sourceCount}`,
    result.adminUrl ? `Admin: ${result.adminUrl}` : "",
    result.previewUrl ? `Preview: ${result.previewUrl}` : "",
  ].filter(Boolean).join("\n");

  const threadId = process.env.TELEGRAM_NEWS_THREAD_ID || process.env.TELEGRAM_MESSAGE_THREAD_ID;
  const messageThreadId = threadId ? Number(threadId) : undefined;
  const message = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: false,
      text,
      ...(Number.isInteger(messageThreadId) ? { message_thread_id: messageThreadId } : {}),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000)),
  }).catch(() => undefined);

  if (!message?.ok) {
    const body = await message?.text().catch(() => "");
    console.warn("[news-cron] Telegram sendMessage failed", message?.status, body?.slice(0, 300));
  }

  if (!result.thumbnailUrl) return Boolean(message?.ok);

  const photo = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    body: JSON.stringify({
      caption: result.title,
      chat_id: chatId,
      photo: result.thumbnailUrl,
      ...(Number.isInteger(messageThreadId) ? { message_thread_id: messageThreadId } : {}),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000)),
  }).catch(() => undefined);

  if (!photo?.ok) {
    const body = await photo?.text().catch(() => "");
    console.warn("[news-cron] Telegram sendPhoto failed", photo?.status, body?.slice(0, 300));
  }

  return Boolean(message?.ok || photo?.ok);
}

async function revalidateNewsPaths(fullPath?: string, slug?: string) {
  const baseURL = appBaseURL();
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;

  await fetch(`${baseURL}/api/revalidate`, {
    body: JSON.stringify({
      collection: "posts",
      path: fullPath,
      slug,
    }),
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-secret": secret,
    },
    method: "POST",
  }).catch((error) => {
    console.warn("[news-cron] revalidate failed", error);
  });
}

export async function createNewsCronPost(options: CreateNewsCronOptions = {}): Promise<CreateNewsCronResult> {
  const categories = await getLeafCategories();
  const category = pickCategory(categories);
  const topic = generateTopic(category);
  const { images, sources } = await tavilySearch(topic, category);

  if (sources.length < 5) {
    throw new Error(`Không đủ nguồn tham khảo uy tín. Hiện có ${sources.length}/5.`);
  }

  const article = await generateArticle(topic, category, sources);
  const unique = await ensureUniqueSlug(article.title);
  article.title = unique.title;

  const ogImage = await findOpenGraphImage(sources);
  const thumbnail = await uploadRemoteImage(ogImage || images[0], article.title);
  const thumbnailId = relationId(thumbnail?.id);
  const thumbnailUrl = textField(thumbnail || {}, "url");
  const payload = await getPayloadClient();
  const status = options.status || (process.env.NEWS_CRON_STATUS === "published" ? "published" : "draft");
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const post = await payload.create({
    collection: "posts",
    data: {
      category: category.id,
      content: richTextContentForPost(article),
      ...(thumbnailId ? { thumbnail: thumbnailId } : {}),
      postType: "news",
      publishedAt,
      seo: {
        description: article.metaDescription,
        ...(thumbnailId ? { image: thumbnailId } : {}),
        title: article.metaTitle,
      },
      slug: unique.slug,
      status,
      summary: article.excerpt,
      title: article.title,
    },
    overrideAccess: true,
  }) as PayloadDoc;

  const postId = post.id as string | number;
  const fullPath = textField(post, "fullPath") || unique.slug;
  const baseURL = appBaseURL();
  const result: Omit<CreateNewsCronResult, "telegramSent"> = {
    adminUrl: `${baseURL}/admin/collections/posts/${postId}`,
    category: category.fullTitle,
    fullPath,
    ok: true,
    postId,
    previewUrl: `${baseURL}/tin-tuc/${fullPath}`,
    slug: unique.slug,
    sourceCount: sources.length,
    thumbnailUrl: thumbnailUrl
      ? new URL(thumbnailUrl, `${baseURL}/`).toString()
      : undefined,
    title: article.title,
  };

  await revalidateNewsPaths(fullPath, unique.slug);
  const telegramSent = await sendTelegramPreview(result);

  return {
    ...result,
    telegramSent,
  };
}
