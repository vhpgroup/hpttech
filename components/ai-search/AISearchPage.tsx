"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AIRecommendationSummary from "@/components/ai-search/AIRecommendationSummary";
import AISearchHero from "@/components/ai-search/AISearchHero";
import AIUnderstandingCard from "@/components/ai-search/AIUnderstandingCard";
import ConsultationBox from "@/components/ai-search/ConsultationBox";
import ProductComparisonTable from "@/components/ai-search/ProductComparisonTable";
import QuickFilters from "@/components/ai-search/QuickFilters";
import RelatedProducts from "@/components/ai-search/RelatedProducts";
import SuggestedQuestions from "@/components/ai-search/SuggestedQuestions";
import {
  DEFAULT_AI_SEARCH_FILTERS,
  DEFAULT_AI_SEARCH_QUERY,
  QUICK_SEARCH_PROMPTS,
  RELATED_AI_PRODUCTS,
  SIDEBAR_QUESTIONS,
  type AISearchFilters,
  type AISearchProduct,
} from "@/lib/ai-search/mock-data";
import { analyzeAISearchQuestion, filterAISearchProducts } from "@/lib/ai-search/search";

const CONTACT = {
  phone: "0918 871 414",
  email: "lienhe@hpttech.vn",
  zaloHref: "https://zalo.me/0967286889",
};

export default function AISearchPage() {
  const [query, setQuery] = useState(DEFAULT_AI_SEARCH_QUERY);
  const [requirements, setRequirements] = useState(() => analyzeAISearchQuestion(DEFAULT_AI_SEARCH_QUERY));
  const [filters, setFilters] = useState<AISearchFilters>({ ...DEFAULT_AI_SEARCH_FILTERS });

  const products = useMemo(() => filterAISearchProducts(filters), [filters]);

  const runSearch = (nextQuery = query) => {
    const searchText = nextQuery.trim() || DEFAULT_AI_SEARCH_QUERY;
    setQuery(searchText);
    setRequirements(analyzeAISearchQuestion(searchText));
  };

  const handlePromptSelect = (prompt: string) => {
    setQuery(prompt);
    runSearch(prompt);
  };

  const handleCompare = (product: AISearchProduct) => {
    window.dispatchEvent(new CustomEvent<AISearchProduct>("hpt:compare:add", { detail: product }));
  };

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 md:py-6">
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-blue-700">Trang chủ</Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span>AI Search</span>
        </nav>

        <AISearchHero
          query={query}
          prompts={QUICK_SEARCH_PROMPTS}
          onQueryChange={setQuery}
          onPromptSelect={handlePromptSelect}
          onSearch={() => runSearch()}
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <AIUnderstandingCard requirements={requirements} />
              <AIRecommendationSummary products={products} />
            </div>

            <ProductComparisonTable products={products} zaloHref={CONTACT.zaloHref} onCompare={handleCompare} />
            <RelatedProducts products={RELATED_AI_PRODUCTS} />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <SuggestedQuestions questions={SIDEBAR_QUESTIONS} onSelect={handlePromptSelect} />
            <QuickFilters
              filters={filters}
              resultCount={products.length}
              onChange={setFilters}
              onReset={() => setFilters({ ...DEFAULT_AI_SEARCH_FILTERS })}
            />
            <ConsultationBox phone={CONTACT.phone} email={CONTACT.email} zaloHref={CONTACT.zaloHref} />
          </aside>
        </div>
      </div>
    </main>
  );
}
