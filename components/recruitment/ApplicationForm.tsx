"use client";

import Link from "next/link";
import { FileText, Send, Trash2, Upload } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

export function ApplicationForm({ jobTitle, jobCode }: { jobTitle: string; jobCode?: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState("");

  const handleFile = (selected?: File) => {
    setFileError("");
    setFile(null);
    if (!selected) return;
    const extension = selected.name.slice(selected.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError("CV phải có định dạng PDF, DOC hoặc DOCX.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError("Dung lượng CV không được vượt quá 5MB.");
      return;
    }
    setFile(selected);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!file) {
      setFileError("Vui lòng đính kèm CV.");
      return;
    }
    setStatus("Hệ thống tiếp nhận hồ sơ đang được hoàn thiện. Thông tin chưa được gửi.");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-600">Ứng tuyển ngay</p>
      <h2 className="mt-2 text-xl font-black text-primary-900">{jobTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Điền thông tin và đính kèm CV để ứng tuyển vị trí này.</p>

      {jobCode ? <input type="hidden" name="jobCode" value={jobCode} /> : null}
      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          Họ và tên <span className="text-red-600">*</span>
          <input required name="fullName" autoComplete="name" className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          Số điện thoại <span className="text-red-600">*</span>
          <input required name="phone" type="tel" autoComplete="tel" className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          Email <span className="text-red-600">*</span>
          <input required name="email" type="email" autoComplete="email" className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
        </label>

        <div>
          <span className="text-sm font-bold text-slate-700">CV đính kèm <span className="text-red-600">*</span></span>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          {file ? (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
              <FileText size={19} className="shrink-0 text-primary-600" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{file.name}</span>
              <button type="button" aria-label="Xóa CV" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }} className="text-slate-400 hover:text-red-600">
                <Trash2 size={17} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current?.click()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary-300 bg-primary-50/60 px-4 py-5 text-sm font-bold text-primary-600 hover:bg-primary-50">
              <Upload size={18} />
              Chọn CV
            </button>
          )}
          <p className="mt-1.5 text-xs text-slate-400">PDF, DOC hoặc DOCX, tối đa 5MB.</p>
          {fileError ? <p className="mt-1 text-xs font-semibold text-red-600" role="alert">{fileError}</p> : null}
        </div>

        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          Tin nhắn
          <textarea name="message" rows={4} className="rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
        </label>
        <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
          <input required type="checkbox" name="privacyConsent" className="mt-1 size-4 rounded border-slate-300 accent-primary-600" />
          <span>
            Tôi đồng ý để HPT Tech xử lý thông tin ứng tuyển theo{" "}
            <Link href="/chinh-sach-bao-mat" className="font-bold text-primary-600 hover:underline">chính sách bảo mật</Link>.
          </span>
        </label>
      </div>

      <button type="submit" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 text-sm font-bold text-white hover:bg-primary-700">
        Gửi hồ sơ ứng tuyển
        <Send size={16} />
      </button>
      {status ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800" role="status">{status}</p> : null}
    </form>
  );
}
