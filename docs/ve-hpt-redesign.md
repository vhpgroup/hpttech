# Redesign trang Gioi thieu (Ve HPT) — Next.js

Ban thiet ke lai trang **/ve-hpt**, code bang **cong nghe cua du an** (Next.js App Router + TypeScript).
KHONG kem header/footer — trang render ben trong layout chung `app/(site)/layout.tsx` (da co Header/Navbar/Footer).

## Files
| File | Vai tro |
|---|---|
| `app/(site)/ve-hpt/page.tsx` | Route page (server component): metadata qua `pageMetadata`, render `<AboutRedesign/>` |
| `components/about/AboutRedesign.tsx` | Client component: toan bo noi dung trang + reveal animation + form lien he |
| `components/about/about-redesign.css` | Style scoped duoi `.vehpt` (khong dung cham style site); tu import font Be Vietnam Pro |
| `components/about/about-assets.ts` | 54 asset base64 (logo doi tac, huy hieu co quan, icon 3D, anh tru so) |
| `public/ve-hpt-redesign/index.html` | Ban preview HTML tinh doc lap (tham khao/so sanh — co the xoa khi da merge) |

## Ghi chu ky thuat
- Trang cu dung `AboutEnterprisePage` + du lieu Payload CMS. Ban moi la **noi dung tinh** trong component —
  neu muon quan ly qua CMS, tach cac text/list vao collection Payload sau.
- CSS scoped: moi selector deu duoi `.vehpt`, CSS variables khai bao tai `.vehpt` — an toan khi nhung chung layout.
- Form `#ctaForm`: hien gui qua `mailto:info@hpttech.vn` (danh dau TODO trong code). Khi co API/CRM, thay handler trong `AboutRedesign.tsx`.
- Anchor id trong trang: `#ve-chung-toi`, `#khach-hang`, `#linh-vuc`, `#du-an`, `#doi-tac`, `#lien-he` (menu site co the tro toi).
- Toi uu sau (khuyen nghi): chuyen assets base64 trong `about-assets.ts` thanh file that trong `public/` + `next/image` de giam bundle (~750KB) — lam sau khi merge, khong chan viec review.

## So lieu da chot (KHONG doi)
- 20+ nam kinh nghiem · 100+ du an · **20+ nhan su & chuyen gia** · **5+ chung chi quoc te**
- MST 0202253444 · Hotline 0967 286 889 · info@hpttech.vn · Tru so: SB04 Vinhomes Marina, P. An Bien, TP. Hai Phong

## Nguon do hoa (giay phep ro rang)
- Logo doi tac & huy hieu co quan: Wikimedia Commons (ban chinh thuc)
- Icon 3D: Microsoft Fluent Emoji — MIT License
- Anh tru so + doi ngu: tu lieu cua HPT
