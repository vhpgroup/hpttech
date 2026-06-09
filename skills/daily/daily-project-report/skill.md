---
name: daily-work-report
description: Tạo báo cáo công việc hằng ngày cho project dựa trên git commits và thay đổi code, rồi xuất ra file Word (.docx) để gửi sếp. Dùng khi người dùng yêu cầu "báo cáo hôm nay", "daily report", "tổng kết công việc", hoặc cần một bản tóm tắt những gì đã làm trong ngày.
---

# Báo cáo công việc hằng ngày

Mục tiêu: tạo một bản báo cáo ngắn gọn, rõ ràng về những gì đã làm trong ngày trên project, dựa trên dữ liệu thật từ git và trạng thái làm việc — không bịa.

## Khi nào dùng skill này
- Người dùng yêu cầu "báo cáo hôm nay", "daily report", "standup", "tổng kết công việc".
- Người dùng cần tóm tắt commit/thay đổi trong một khoảng thời gian.

## Quy trình

1. Xác định khoảng thời gian
   - Mặc định: từ 00:00 hôm nay đến hiện tại.
   - Nếu người dùng nói "hôm qua", "tuần này"... thì điều chỉnh tham số --since/--until tương ứng.

2. Thu thập dữ liệu (chạy trong terminal của project)
   - Commits trong ngày của tôi:
     git log --since="00:00" --until="now" --author="$(git config user.name)" --pretty=format:"- %h %s"
   - Thống kê file thay đổi: git diff --stat HEAD@{1} HEAD
   - Thay đổi chưa commit: git status --short
   - Branch hiện tại: git branch --show-current

3. Phân loại công việc theo nhóm
   - ✨ Tính năng mới (feat)
   - 🐛 Sửa lỗi (fix)
   - ♻️ Refactor / dọn code
   - 📝 Tài liệu / cấu hình
   - 🧪 Test
   Dựa vào prefix của commit message (feat/fix/refactor/docs/test...) để phân loại.

4. Viết báo cáo theo template ở dưới.
   - Ngắn gọn, dùng gạch đầu dòng.
   - Chỉ nêu việc có bằng chứng (commit/diff). Nếu thiếu dữ liệu thì ghi rõ "chưa commit" thay vì bịa.

5. Lưu kết quả
   - Lưu vào: reports/daily/YYYY-MM-DD.md (tạo thư mục nếu chưa có).
   - In bản báo cáo ra chat cho người dùng xem.

6. Xuất ra file Word (.docx) để gửi sếp
   - Dùng pandoc để chuyển markdown sang Word:
     pandoc reports/daily/YYYY-MM-DD.md -o reports/daily/Bao-cao-YYYY-MM-DD.docx
   - Nếu chưa cài pandoc: macOS `brew install pandoc`, Ubuntu `sudo apt install pandoc`, Windows `winget install pandoc`.
   - Nếu công ty có mẫu Word riêng (logo, font), dùng template:
     pandoc reports/daily/YYYY-MM-DD.md -o reports/daily/Bao-cao-YYYY-MM-DD.docx --reference-doc=template.docx
   - Sau khi xuất xong, in ra đường dẫn file .docx để người dùng đính kèm gửi sếp.

## Template báo cáo

# Báo cáo công việc — {YYYY-MM-DD}

**Project:** {tên project}  
**Branch:** {branch}

## ✅ Đã hoàn thành
- {nhóm}: {mô tả ngắn} ({số commit})

## 🚧 Đang làm dở
- {mô tả} — {trạng thái, % ước tính}

## 🧱 Vướng mắc / cần hỗ trợ
- {blocker, nếu có}

## 📌 Kế hoạch ngày mai
- {việc tiếp theo}

---
_Thống kê: {n} commits, {n} file thay đổi (+{thêm}/-{xóa})_

## Lưu ý
- Luôn dựa trên dữ liệu git thật; không suy diễn công việc không có bằng chứng.
- Giữ báo cáo dưới ~15 dòng để dễ đọc trong standup.
- Nếu repo không có commit nào trong ngày, hỏi người dùng họ đã làm gì hoặc dựa vào git status (thay đổi chưa commit).
- File Word là sản phẩm cuối để gửi sếp; kiểm tra lại nội dung .docx mở được bình thường trước khi gửi.