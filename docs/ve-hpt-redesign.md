# Redesign trang Gioi thieu (Ve HPT) — Next.js

Ban thiet ke lai trang **/ve-hpt**, code bang cong nghe cua du an (Next.js App Router + TypeScript).
KHONG kem header/footer — trang render trong layout chung `app/(site)/layout.tsx`.

## Kien truc files
| File | Vai tro |
|---|---|
| `app/(site)/ve-hpt/page.tsx` | Route page: metadata qua `pageMetadata`, render `<AboutRedesign/>` |
| `components/about/AboutRedesign.tsx` | Client component: noi dung + reveal animation + form lien he. Anh tru so dung `next/image` |
| `components/about/about-redesign.css` | Style scoped `.vehpt` + block PERF mobile (blur off, fade-only reveal, content-visibility) |
| `scripts/ve-hpt-assets-data.json` | Nguon base64 cua 55 asset (logo doi tac, huy hieu, icon 3D, anh tru so, icon check) |
| `scripts/extract-ve-hpt-assets.cjs` | Giai ma JSON -> `public/ve-hpt/*.png|jpg`. Tu chay qua `predev`/`prebuild` (npm lifecycle). Idempotent |
| `public/ve-hpt/` | **File sinh tu dong — da gitignore.** Anh that phuc vu CDN cache + next/image |

## Vi sao dung co che extract thay vi commit anh truc tiep?
GitHub MCP khong commit duoc file nhi phan (base64 bi luu thanh text). Co che prebuild-extract cho ket qua tuong duong:
anh THAT trong ban deploy (CDN cache duoc, next/image toi uu duoc) nhung git chi chua text — de review, khong phinh repo.

## Hieu nang
- Client bundle giam ~750KB (khong con import about-assets.ts vao trang)
- 55 anh tai song song + cache rieng theo URL (truoc: nhung cung HTML/JS, tai lai moi lan)
- Anh tru so qua next/image: tu chuyen AVIF/WebP + srcset responsive
- Mobile scroll: xem block PERF trong CSS (PR #27)

## Van hanh
- `npm run dev` / `npm run build` -> script extract tu chay truoc (predev/prebuild)
- Chay tay khi can: `node scripts/extract-ve-hpt-assets.cjs`
- Them/doi anh: cap nhat `scripts/ve-hpt-assets-data.json` (key = ten file) roi chay lai script

## Viec con lai
- [ ] Noi form `#ctaForm` vao API/CRM thay `mailto:` (TODO trong AboutRedesign.tsx)
- [ ] Co the xoa `public/ve-hpt-redesign/index.html` (ban preview HTML tinh cu)
- [ ] Can nhac dua noi dung vao Payload CMS neu can bien tap qua admin

## So lieu da chot (KHONG doi)
20+ nam kinh nghiem · 100+ du an · **20+ nhan su & chuyen gia** · **5+ chung chi quoc te**
MST 0202253444 · Hotline 0967 286 889 · info@hpttech.vn

## Nguon do hoa
Logo doi tac & huy hieu: Wikimedia Commons · Icon 3D: Microsoft Fluent Emoji (MIT) · Anh tru so: tu lieu HPT
