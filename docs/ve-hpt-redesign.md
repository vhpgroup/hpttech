# Redesign trang Gioi thieu (Ve HPT)

Ban thiet ke lai trang **/ve-hpt** — phien ban KHONG kem header/footer (dung header/footer san co cua web).

## File tren branch nay
| File | Mo ta |
|---|---|
| `public/ve-hpt-redesign/index.html` | Trang hoan chinh, TU CHUA 100% (CSS + JS + toan bo anh/icon nhung data URI) — xem truc tiep tai `/ve-hpt-redesign/index.html` khi chay du an |

## Cach tich hop vao app/(site)
1. Tao route moi hoac thay noi dung route `ve-hpt` hien tai.
2. Lay phan `<style>` trong `<head>` + toan bo `<main>...</main>` + khoi `<script>` cuoi file, dua vao page component (hoac dung `dangerouslySetInnerHTML` giai doan dau).
3. Font: trang dung **Be Vietnam Pro** (Google Fonts, weights 400–800) — them vao layout neu site chua co.
4. Cac muc trong trang co id anchor: `#ve-chung-toi`, `#khach-hang`, `#linh-vuc`, `#du-an`, `#doi-tac`, `#lien-he` — co the tro tu menu chinh cua site.

## Viec can lam khi tich hop that
- [ ] **Form lien he** (`#ctaForm`): hien gui qua `mailto:info@hpttech.vn`. Can noi vao API/CRM (da danh dau `TODO (deploy)` trong HTML).
- [ ] **og:image** dang tro `https://hpttech.vn/ve-hpt-redesign/hpt-team.jpg` — cap nhat theo duong dan media thuc te.
- [ ] Toi uu dung luong: tach anh tru so + cac icon data-URI thanh file rieng trong `public/` hoac CMS media (hien nhung inline de ban preview tu chua, ~800KB).
- [ ] Xoa favicon inline trong `<head>` neu site da co favicon rieng.

## So lieu da duoc xac nhan (KHONG doi)
- 20+ nam kinh nghiem · 100+ du an · **20+ nhan su & chuyen gia** · **5+ chung chi quoc te**
- MST: 0202253444 · Hotline: 0967 286 889 · info@hpttech.vn

## Nguon do hoa
- Logo doi tac (Dell, HPE, Cisco, ...): Wikimedia Commons (logo chinh hang).
- Huy hieu co quan (Quoc huy, Cong an hieu, Bo KHCN, EVN, ...): Wikimedia Commons.
- Icon 3D: Microsoft Fluent Emoji (MIT License) — dung thuong mai OK.
