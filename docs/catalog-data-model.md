# HPT Tech Catalog Data Model

## Mục tiêu

Catalog chuẩn tách dữ liệu thành các miền độc lập:

- `products`: thông tin chung của model sản phẩm.
- `product-variants`: SKU hoặc phiên bản bán thực tế.
- `product-offers`: giá, VAT, khuyến mãi và trạng thái bán.
- `product-inventory`: tồn kho nhập tay theo SKU và kho.
- `product-types`: loại sản phẩm và phiên bản schema.
- `attribute-definitions`: định nghĩa thông số theo loại sản phẩm.
- `product-ai-metadata`: metadata hỗ trợ AI, không phải dữ liệu gốc.

Giá trị thông số chuẩn được lưu trong `products.attributes`. Mỗi dòng tham chiếu
đến một `attribute-definition` và lưu giá trị trong đúng field theo `dataType`.

## Quy tắc sở hữu dữ liệu

| Dữ liệu | Collection sở hữu |
|---|---|
| Brand, model, MPN, nội dung, ảnh, datasheet | `products` |
| SKU, barcode, bảo hành của phiên bản | `product-variants` |
| Giá, VAT, giá khuyến mãi | `product-offers` |
| Số lượng và trạng thái kho | `product-inventory` |
| Kiểu, đơn vị, khả năng filter/compare | `attribute-definitions` |
| Use case, keyword, lợi thế | `product-ai-metadata` |

Không ghi giá hoặc tồn kho vào AI metadata. Không dùng title/name làm định danh.

## Migration không phá UI

Website hiện tại vẫn đọc `products.price`, `products.stockStatus` và
`products.specs`. Các field này được giữ làm lớp tương thích tạm thời.

### Giai đoạn 1

1. Thêm collections catalog chuẩn.
2. Sản phẩm mới dùng `dataModel = canonical`.
3. Dữ liệu cũ chưa migration giữ `dataModel = legacy` hoặc chưa có giá trị.
4. UI tiếp tục đọc field cũ nên không bị gián đoạn.

### Giai đoạn 2

1. Migration từng sản phẩm cũ sang Product + Variant + Offer + Inventory.
2. Tạo adapter catalog đọc từ collections mới.
3. So sánh kết quả UI mới và cũ.
4. Chuyển UI sang adapter mới.
5. Chỉ xóa field legacy sau khi không còn caller sử dụng.

## Hành vi CRUD hiện tại

### Thêm và sửa

- Storefront đọc Product kết hợp với SKU mặc định, Offer, Inventory và typed attributes.
- Product legacy vẫn dùng field cũ làm fallback.
- Mỗi Product chỉ có một SKU được đánh dấu mặc định.
- Mỗi SKU có tối đa một Offer trong phase hiện tại.
- Mỗi SKU chỉ có một bản ghi tồn kho cho cùng tên kho.
- Update một phần không làm thay đổi `internalId`.

### Xóa

- Không thể xóa Product còn Variant hoặc AI metadata.
- Không thể xóa Variant còn Offer hoặc Inventory.
- Thứ tự xóa an toàn:
  `AI Metadata → Inventory → Offer → Variant → Product`.
- Trong vận hành thông thường nên chuyển Product sang `archived` thay vì xóa.

## Import và export canonical

API import/export mặc định dùng file canonical, một dòng cho mỗi tổ hợp SKU và kho.
File chứa:

- Product identity và taxonomy.
- SKU/Variant.
- Offer và VAT.
- Inventory.
- Mỗi thông số kỹ thuật là một cột tiếng Việt theo loại sản phẩm.

Ví dụ file máy scan có các cột:

- Tốc độ scan một mặt (ppm)
- Tốc độ scan hai mặt (ipm)
- Sức chứa ADF (tờ)
- Scan hai mặt tự động
- Kết nối máy scan
- Khổ giấy tối đa máy scan

Nhân viên nhập `40`, `80`, `Có`, `USB, LAN`, `A4`. Hệ thống tự chuyển thành
typed attributes. Không cần viết JSON hoặc nhớ attribute code.

Import thực hiện theo thứ tự:

1. Kiểm tra Product Type và Attribute Definitions.
2. Upsert Product ở trạng thái draft.
3. Upsert Variant theo SKU.
4. Upsert Offer theo Variant.
5. Upsert Inventory theo Variant + warehouse.
6. Chỉ chuyển Product sang trạng thái yêu cầu sau khi toàn bộ bước trước thành công.

Export chỉ xuất Product có `dataModel = canonical`. Product legacy phải migration
trước để tránh tạo file thiếu Product Type hoặc typed attributes.

## Validation khi publish

Sản phẩm `canonical` chỉ được publish khi có:

- `internalId`
- `productType`
- `brand`
- `model`
- `name`
- `slug`
- Đủ mọi attribute definition được đánh dấu `required`
- Giá trị attribute đúng `dataType`, `unit` và enum options
- Không nhập trùng một attribute

Draft được phép thiếu dữ liệu để nhân viên có thể hoàn thiện dần.

## Seed schema mẫu

Chạy:

```powershell
npm run payload:seed-catalog
```

Script seed có tính idempotent và tạo:

- Product type: scanner, printer, photocopier
- Attribute definitions cho ba loại
- Brand Ricoh và category Máy scan nếu chưa có
- Product mẫu RICOH fi-8170
- SKU `RICOH-FI8170`
- Offer trạng thái Liên hệ
- Tồn kho mẫu tại Kho chính
- AI metadata chưa xác minh

Seed chỉ nên chạy trên môi trường local hoặc staging trước khi duyệt dữ liệu.

## Checklist kiểm tra trong Payload Admin

- [ ] Nhìn thấy nhóm `Catalog chuẩn`.
- [ ] Có ba Product Types đang active.
- [ ] Mỗi Product Type có đúng bộ Attribute Definitions.
- [ ] Không thể tạo trùng code của attribute definition.
- [ ] Không thể tạo trùng SKU.
- [ ] Product draft được lưu khi chưa đủ thông tin.
- [ ] Product canonical không publish được nếu thiếu attribute bắt buộc.
- [ ] Product không publish được nếu dataType hoặc unit sai schema.
- [ ] Enum không nhận giá trị ngoài options.
- [ ] Offer không nhận giá khuyến mãi cao hơn giá bán.
- [ ] Inventory không nhận quantity âm hoặc số thập phân.
- [ ] RICOH fi-8170 vẫn mở được trên trang sản phẩm hiện tại.
- [ ] Typecheck và production build thành công.

## Cách nhập một sản phẩm mới

1. Kiểm tra `Product Type` đã tồn tại.
2. Kiểm tra bộ `Attribute Definitions`; không tạo code mới chỉ vì khác cách viết.
3. Tạo `Product` ở trạng thái draft:
   - Chọn `Catalog chuẩn`.
   - Kiểm tra `internalId` được tự sinh.
   - Chọn product type và brand.
   - Nhập model, MPN, name, slug, mô tả, ảnh và datasheet.
   - Khai báo nguồn dữ liệu.
4. Nhập `Thuộc tính chuẩn` theo schema:
   - Chọn definition.
   - Chọn đúng dataType và unit.
   - Chỉ nhập field giá trị tương ứng.
5. Tạo `Product Variant`:
   - SKU duy nhất.
   - Liên kết Product.
   - Nhập tên phiên bản, barcode và bảo hành nếu có.
6. Tạo `Product Offer` cho Variant.
7. Tạo `Product Inventory` cho Variant và kho.
8. Tạo AI metadata nếu cần, để `verified = false` cho đến khi người phụ trách duyệt.
9. Quay lại Product và chuyển sang `published`.

## Thêm loại sản phẩm mới

Phase hiện tại dùng enum code để tránh category tự do. Khi thêm loại mới:

1. Thêm code vào `PRODUCT_TYPE_OPTIONS` trong `lib/catalog-schema.ts`.
2. Seed hoặc tạo Product Type tương ứng.
3. Tạo Attribute Definitions có code ổn định.
4. Thêm test validation và một sản phẩm mẫu.

Không cần sửa schema `products`, AI Search hoặc Compare khi thêm loại sản phẩm.
