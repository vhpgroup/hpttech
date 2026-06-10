import type { ExternalProduct } from "@/lib/search/search-provider";

export type ProductIntent = {
  budgetMax?: number;
  budgetMin?: number;
  category?: string;
  confidence: number;
  connectivity: string[];
  environment?: string;
  missingQuestions: string[];
  preferredFeatures: string[];
  requiredFeatures: string[];
  speedPPM?: number;
  useCase?: string;
};

export type AIRecommendedProduct = {
  aiScore: number;
  brand?: string;
  category?: string;
  model?: string;
  modelNormalized: string;
  name: string;
  priceText?: string;
  reason: string;
  sourceName?: string;
  sourceUrl?: string;
  specsSummary?: string;
};

export type ProductRecommendationResult = {
  error?: string;
  intent: ProductIntent;
  model?: string;
  products: AIRecommendedProduct[];
  source: "fallback" | "openai";
};

export type ProductRecommendationOptions = {
  externalProducts?: ExternalProduct[];
};

const DEFAULT_MISSING_QUESTIONS = [
  "Ngân sách dự kiến là bao nhiêu?",
  "Mỗi ngày cần xử lý khoảng bao nhiêu tài liệu?",
];

export function normalizeProductModel(value?: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8)
    : [];
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function confidenceValue(value: unknown) {
  const parsed = numberValue(value);
  if (parsed === undefined) return 0.55;
  return Math.max(0, Math.min(1, parsed));
}

function cleanIntent(value: unknown, question: string): ProductIntent {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const normalized = normalizeText(question);
  const isPrinter = normalized.includes("may in") || normalized.includes("printer");
  const isPhotocopier = normalized.includes("photo") || normalized.includes("copy");
  const isSchool = normalized.includes("truong") || normalized.includes("hoc sinh") || normalized.includes("giao duc");
  const category = typeof record.category === "string" && record.category.trim()
    ? record.category.trim()
    : isPrinter
      ? "printer"
      : isPhotocopier
        ? "photocopier"
        : "scanner";

  return {
    budgetMax: numberValue(record.budgetMax),
    budgetMin: numberValue(record.budgetMin),
    category,
    confidence: confidenceValue(record.confidence),
    connectivity: textArray(record.connectivity),
    environment:
      typeof record.environment === "string" && record.environment.trim()
        ? record.environment.trim()
        : isSchool
          ? "school"
          : undefined,
    missingQuestions: textArray(record.missingQuestions).length
      ? textArray(record.missingQuestions)
      : DEFAULT_MISSING_QUESTIONS,
    preferredFeatures: textArray(record.preferredFeatures),
    requiredFeatures: textArray(record.requiredFeatures),
    speedPPM: numberValue(record.speedPPM),
    useCase:
      typeof record.useCase === "string" && record.useCase.trim()
        ? record.useCase.trim()
        : normalized.includes("ke toan")
          ? "school_accounting"
          : undefined,
  };
}

function cleanProduct(value: unknown, index: number): AIRecommendedProduct | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) return undefined;
  const model = typeof record.model === "string" ? record.model.trim() : undefined;
  return {
    aiScore: Math.max(1, Math.min(100, numberValue(record.aiScore) ?? 90 - index * 4)),
    brand: typeof record.brand === "string" ? record.brand.trim() : undefined,
    category: typeof record.category === "string" ? record.category.trim() : undefined,
    model,
    modelNormalized: normalizeProductModel(model || name),
    name,
    priceText: typeof record.priceText === "string" ? record.priceText.trim() : undefined,
    reason:
      typeof record.reason === "string" && record.reason.trim()
        ? record.reason.trim()
        : "Phù hợp với nhu cầu đã mô tả và cần HPT tư vấn cấu hình chi tiết.",
    sourceName: typeof record.sourceName === "string" ? record.sourceName.trim() : undefined,
    sourceUrl: typeof record.sourceUrl === "string" ? record.sourceUrl.trim() : undefined,
    specsSummary: typeof record.specsSummary === "string" ? record.specsSummary.trim() : undefined,
  };
}

function parseJSONPayload(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Empty OpenAI response.");
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1] || trimmed;
  return JSON.parse(jsonText) as unknown;
}

function cleanResult(value: unknown, question: string): ProductRecommendationResult {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const products = Array.isArray(record.products)
    ? record.products
        .map((item, index) => cleanProduct(item, index))
        .filter((item): item is AIRecommendedProduct => Boolean(item))
        .slice(0, 5)
    : [];
  return {
    intent: cleanIntent(record.intent, question),
    products,
    source: "openai",
  };
}

export function fallbackProductRecommendations(question: string, error?: string): ProductRecommendationResult {
  const intent = cleanIntent({}, question);
  const normalized = normalizeText(question);
  const schoolAccounting = normalized.includes("ke toan") || normalized.includes("truong");
  const products: AIRecommendedProduct[] = [
    {
      aiScore: 95,
      brand: "Ricoh",
      category: "scanner",
      model: "fi-8040",
      modelNormalized: normalizeProductModel("fi-8040"),
      name: "Ricoh fi-8040",
      reason: schoolAccounting
        ? "Phù hợp phòng kế toán nhà trường vì có ADF, scan hai mặt và đủ mạnh cho số hóa chứng từ, hồ sơ."
        : "Phù hợp cho văn phòng cần scan tài liệu ổn định, có ADF và tốc độ tốt.",
      specsSummary: "ADF, scan hai mặt, nhóm máy scan tài liệu văn phòng.",
    },
    {
      aiScore: 91,
      brand: "Brother",
      category: "scanner",
      model: "ADS-4300N",
      modelNormalized: normalizeProductModel("ADS-4300N"),
      name: "Brother ADS-4300N",
      reason: "Phù hợp vì có LAN, scan hai mặt và tốc độ khoảng 40ppm, hợp nhu cầu kế toán và hành chính.",
      specsSummary: "Khoảng 40ppm, LAN, ADF, scan hai mặt.",
    },
    {
      aiScore: 88,
      brand: "Epson",
      category: "scanner",
      model: "DS-790WN",
      modelNormalized: normalizeProductModel("DS-790WN"),
      name: "Epson WorkForce DS-790WN",
      reason: "Phù hợp nếu cần vận hành độc lập hơn với màn hình, kết nối mạng và luồng scan tài liệu thường xuyên.",
      specsSummary: "Máy scan tài liệu có mạng, phù hợp nhóm văn phòng.",
    },
    {
      aiScore: 85,
      brand: "Canon",
      category: "scanner",
      model: "DR-M260",
      modelNormalized: normalizeProductModel("DR-M260"),
      name: "Canon imageFORMULA DR-M260",
      reason: "Phù hợp cho khối lượng scan trung bình đến cao, cần độ bền và tốc độ xử lý tốt.",
      specsSummary: "ADF, scan tài liệu tốc độ cao, hợp hồ sơ văn phòng.",
    },
    {
      aiScore: 82,
      brand: "HP",
      category: "scanner",
      model: "ScanJet Pro 3600 f1",
      modelNormalized: normalizeProductModel("ScanJet Pro 3600 f1"),
      name: "HP ScanJet Pro 3600 f1",
      reason: "Phù hợp nếu cần máy scan đa năng hơn, có flatbed để xử lý giấy tờ đặc thù bên cạnh ADF.",
      specsSummary: "ADF kết hợp flatbed, phù hợp giấy tờ hỗn hợp.",
    },
  ];
  return { error, intent, products, source: "fallback" };
}

export async function recommendProductsWithOpenAI(
  question: string,
  options: ProductRecommendationOptions = {},
): Promise<ProductRecommendationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) return fallbackProductRecommendations(question, "OPENAI_API_KEY is not configured.");
  const externalProducts = options.externalProducts?.slice(0, 15) || [];

  const responseSchema = {
    additionalProperties: false,
    properties: {
      intent: {
        additionalProperties: false,
        properties: {
          budgetMax: { type: ["number", "null"] },
          budgetMin: { type: ["number", "null"] },
          category: { type: "string" },
          confidence: { type: "number" },
          connectivity: { items: { type: "string" }, type: "array" },
          environment: { type: ["string", "null"] },
          missingQuestions: { items: { type: "string" }, type: "array" },
          preferredFeatures: { items: { type: "string" }, type: "array" },
          requiredFeatures: { items: { type: "string" }, type: "array" },
          speedPPM: { type: ["number", "null"] },
          useCase: { type: ["string", "null"] },
        },
        required: [
          "budgetMax",
          "budgetMin",
          "category",
          "confidence",
          "connectivity",
          "environment",
          "missingQuestions",
          "preferredFeatures",
          "requiredFeatures",
          "speedPPM",
          "useCase",
        ],
        type: "object",
      },
      products: {
        items: {
          additionalProperties: false,
          properties: {
            aiScore: { type: "number" },
            brand: { type: "string" },
            category: { type: "string" },
            model: { type: "string" },
            name: { type: "string" },
            priceText: { type: ["string", "null"] },
            reason: { type: "string" },
            sourceName: { type: ["string", "null"] },
            sourceUrl: { type: ["string", "null"] },
            specsSummary: { type: ["string", "null"] },
          },
          required: [
            "aiScore",
            "brand",
            "category",
            "model",
            "name",
            "priceText",
            "reason",
            "sourceName",
            "sourceUrl",
            "specsSummary",
          ],
          type: "object",
        },
        maxItems: 5,
        minItems: 5,
        type: "array",
      },
    },
    required: ["intent", "products"],
    type: "object",
  };

  const candidatePrompt = externalProducts.length
    ? [
        "Market candidates from Search Provider. If this list is present, choose and rank products only from this list. Do not invent models outside this list. Keep sourceName and sourceUrl from the selected candidate.",
        JSON.stringify(
          externalProducts.map((product, index) => ({
            brand: product.brand || null,
            candidateId: index + 1,
            category: product.category || null,
            confidence: product.confidence,
            model: product.model || null,
            name: product.name,
            sourceName: product.sourceName,
            sourceUrl: product.sourceUrl,
            specsSummary: product.specsSummary || null,
          })),
        ),
      ].join("\n")
    : "No Search Provider candidates are available. You may recommend products from general product knowledge, but never claim HPT stock or HPT price.";

  const prompt = [
    "Bạn là chuyên gia tư vấn thiết bị văn phòng cho HPT Tech.",
    "Nhiệm vụ: đọc nhu cầu người dùng, bóc tách intent, rồi đề xuất đúng khoảng 5 sản phẩm phù hợp nhất theo kiến thức sản phẩm chung.",
    "Bạn được quyền đề xuất sản phẩm dù HPT chưa có trong database. Không được khẳng định tồn kho, giá HPT hoặc trạng thái có hàng tại HPT.",
    "Trả về duy nhất JSON hợp lệ theo schema:",
    `{
  "intent": {
    "category": "scanner|printer|photocopier|other",
    "useCase": "string",
    "environment": "string",
    "budgetMin": number,
    "budgetMax": number,
    "speedPPM": number,
    "connectivity": ["string"],
    "requiredFeatures": ["string"],
    "preferredFeatures": ["string"],
    "missingQuestions": ["string"],
    "confidence": number
  },
  "products": [
    {
      "name": "string",
      "brand": "string",
      "model": "string",
      "category": "string",
      "priceText": "string",
      "specsSummary": "string",
      "sourceName": "string",
      "sourceUrl": "string",
      "aiScore": number,
      "reason": "string"
    }
  ]
}`,
    "Neu co Market candidates, ket qua products phai den tu danh sach do va phai giu sourceUrl/sourceName cua ung vien.",
    "Yêu cầu ranking: sản phẩm rank 1 phù hợp nhất, aiScore 1-100. Lý do ngắn, thực dụng, tiếng Việt.",
    candidatePrompt,
    `Nhu cầu người dùng: ${question}`,
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [{ role: "user", content: prompt }],
      max_output_tokens: 3000,
      model,
      reasoning: { effort: "low" },
      text: {
        format: {
          name: "product_recommendation",
          schema: responseSchema,
          strict: true,
          type: "json_schema",
        },
      },
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => undefined);
    const message =
      typeof errorPayload?.error?.message === "string"
        ? errorPayload.error.message
        : `OpenAI request failed with status ${response.status}.`;
    return fallbackProductRecommendations(question, message);
  }
  const payload = await response.json().catch(() => ({}));
  const outputText =
    typeof payload.output_text === "string"
      ? payload.output_text
      : Array.isArray(payload.output)
        ? payload.output
            .flatMap((item: { content?: Array<{ text?: string; type?: string }> }) => item.content || [])
            .map((item: { text?: string }) => item.text || "")
            .join("\n")
        : "";

  try {
    const parsed = cleanResult(parseJSONPayload(outputText), question);
    return parsed.products.length
      ? { ...parsed, model, source: "openai" }
      : fallbackProductRecommendations(question, "OpenAI returned no products.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse OpenAI response.";
    return fallbackProductRecommendations(question, message);
  }
}
