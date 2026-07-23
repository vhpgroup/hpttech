import type { Config } from "tailwindcss";

/**
 * ⚠️ STUB CÓ CHỦ ĐÍCH — đừng thêm màu/font vào đây.
 *
 * Dự án dùng Tailwind CSS v4 (@tailwindcss/postcss): toàn bộ design token
 * (màu primary-*/accent-*/surface/ink/border, font, shadow) được khai báo
 * DUY NHẤT trong khối `@theme` của `app/globals.css`. Tailwind v4 KHÔNG đọc
 * file config này trừ khi CSS có directive `@config` (hiện không dùng).
 *
 * File trước đây chứa bảng màu + font "Manrope" từ prototype cũ, gây hiểu
 * nhầm nguồn chân lý token (xem AGENTS.md — mục "Chuẩn hóa token màu").
 * Muốn đổi brand: sửa `--color-primary-*` trong `app/globals.css`.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ]
};

export default config;
