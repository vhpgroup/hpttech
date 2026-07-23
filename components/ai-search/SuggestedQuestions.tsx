import { ChevronRight, MessageCircleQuestion } from "lucide-react";

type SuggestedQuestionsProps = {
  questions: string[];
  onSelect: (question: string) => void;
};

export default function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircleQuestion size={18} className="text-primary-700" />
        <h2 className="text-base font-bold text-slate-950">Bạn có thể hỏi thêm</h2>
      </div>
      <div className="grid gap-2">
        {questions.map((question) => (
          <button
            type="button"
            key={question}
            onClick={() => onSelect(question)}
            className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
          >
            <span>{question}</span>
            <ChevronRight size={16} className="shrink-0" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect("Tôi muốn tư vấn thêm theo tình hình tồn kho và ngân sách hiện tại.")}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary-700 bg-white text-sm font-bold text-primary-700 transition hover:bg-primary-50"
      >
        <MessageCircleQuestion size={17} />
        Đặt câu hỏi khác
      </button>
    </section>
  );
}
