# API Contract — AI Sales Development

Đây là hợp đồng REST đề xuất cho backend MVP; chưa có backend triển khai. Base path `/api/v1`; JSON UTF-8; timestamp ISO-8601 UTC. Mọi endpoint nghiệp vụ cần xác thực, kiểm tra quyền và tenant ở server. Không tin `tenantId` từ body/query; backend lấy tenant từ phiên đăng nhập.

## Quy ước chung

- Thành công trả JSON theo resource hoặc collection; danh sách dùng `{ data, page, pageSize, total }`.
- Lỗi chuẩn: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "...", "message": "..." }], "requestId": "..." } }`.
- HTTP status: `200/201` thành công; `400` request sai; `401` chưa xác thực; `403` không đủ quyền; `404` không tìm thấy hoặc không thuộc tenant; `409` xung đột revision/idempotency; `422` quy tắc nghiệp vụ; `429` rate limit.
- Tiền trong API biểu diễn dưới dạng chuỗi decimal và ISO 4217 currency, ví dụ `{ "amount": "19.750000", "currency": "USD" }`; không dùng binary float cho quyết định giá.
- Create/import dùng `Idempotency-Key` khi client có thể retry. Update revision dùng `If-Match`/ETag hoặc `version` để ngăn ghi đè đồng thời.
- Phân trang `page` (1-based), `pageSize` (tối đa đề xuất 100); filter/sort được whitelist.
- Không đưa secret nhà cung cấp/AI vào frontend responses, browser storage hoặc logs.

## Category và pricing enums

```ts
export type ProductCategory = 'pcba' | 'wire_harness' | 'iot';
export type PricingMethod = 'gross_margin' | 'markup';
export type RfqStatus = 'new' | 'triage' | 'costing' | 'quoted' | 'won' | 'lost' | 'cancelled';
export type RevisionStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'superseded';
```

## Endpoints MVP

### Session / current user

- `GET /me` — hồ sơ người dùng, tenant và effective permissions.
- Auth cookie/session hoặc OAuth/OIDC bearer token theo quyết định triển khai; cookie cần CSRF protection.

### Customers & CRM

- `GET /customers?query=&status=&page=&pageSize=`
- `POST /customers`
- `GET /customers/{customerId}`
- `PATCH /customers/{customerId}`
- `GET /customers/{customerId}/contacts`, `POST /customers/{customerId}/contacts`
- `GET /opportunities?stage=&ownerId=&customerId=`
- `POST /opportunities`, `GET /opportunities/{id}`, `PATCH /opportunities/{id}`
- `POST /opportunities/{id}/activities`

Customer master status độc lập với CRM opportunity stage. Thay đổi stage cần event/audit.

### RFQ & upload

- `GET /rfqs?status=&category=&customerId=&ownerId=&dueBefore=&page=`
- `POST /rfqs`
- `GET /rfqs/{rfqId}`
- `PATCH /rfqs/{rfqId}` — chỉ các trường cho phép theo state; state transition dùng endpoint riêng.
- `POST /rfqs/{rfqId}/transitions` body `{ "toStatus": "costing", "reason": "..." }`.
- `POST /files/upload-intents` — xin upload URL; backend kiểm tra role, mime, size.
- `POST /rfqs/{rfqId}/files` — gắn file đã upload với RFQ.
- `GET /files/{fileId}/download-url` — URL ký ngắn hạn sau kiểm tra quyền.

### BOM import và revisions

- `POST /projects/{projectId}/bom-imports` — tạo staged import, trả `importId`, cột tìm thấy và warnings.
- `POST /bom-imports/{importId}/mapping` — map cột source sang part number/description/quantity/UOM/manufacturer.
- `GET /bom-imports/{importId}/preview?page=` — dòng hợp lệ và lỗi theo dòng.
- `POST /bom-imports/{importId}/confirm` — tạo revision khi toàn bộ kiểm tra đạt hoặc lỗi được xử lý.
- `GET /projects/{projectId}/bom-revisions`
- `GET /bom-revisions/{revisionId}/items?page=`
- `PATCH /bom-items/{itemId}` — chỉnh sửa có audit; revision đã khóa cần clone revision mới.

### Supplier quotes

- `GET /suppliers?query=&category=&country=`; `POST /suppliers`; `GET/PATCH /suppliers/{id}`.
- `POST /supplier-quotes` — lưu header/validity/source.
- `POST /supplier-quotes/{id}/items` — cập nhật price breaks/part numbers.
- `GET /supplier-quotes?partNumber=&asOf=&quantity=` — chỉ trả quote còn phù hợp/đánh dấu hết hạn.

### Costing

- `GET /projects/{projectId}/costing-revisions?category=`
- `POST /costing-revisions` — tạo draft cho project/RFQ/category.
- `GET /costing-revisions/{revisionId}`
- `PATCH /costing-revisions/{revisionId}` — chỉ draft; optimistic concurrency.
- `POST /costing-revisions/{revisionId}/recalculate` — server tính tổng và trả assumptions/calculation breakdown.
- `POST /costing-revisions/{revisionId}/submit-for-approval`
- `POST /costing-revisions/{revisionId}/cost-lines`; `PATCH/DELETE /cost-lines/{lineId}` — chỉ draft.

Request ví dụ:

```json
{
  "category": "pcba",
  "currency": "USD",
  "orderQuantity": "1000",
  "pricingMethod": "gross_margin",
  "pricingRate": "0.250000",
  "overheadRate": "0.080000",
  "lines": [
    {
      "description": "PCB fabrication",
      "quantityPerUnit": "1.000000",
      "uom": "pcs",
      "unitCost": "5.000000",
      "currency": "USD",
      "sourceType": "supplier_quote",
      "sourceReferenceId": "sq-item-uuid"
    }
  ]
}
```

`recalculate` response cần nêu `directCost`, `overheadBase`, `overheadAmount`, `setupCost`, `manufacturingCost`, `pricingMethod`, `pricingRate`, `sellingPrice`, `profitPerUnit`, `orderTotal`, `roundingPolicy`, `assumptions` — các số tiền là decimal strings. Backend validate margin < 1 và áp dụng policy đã lưu, không tin các total do client gửi.

### Approval & quotes

- `GET /approvals?status=pending`; `POST /approvals/{id}/decision` body `{ "decision": "approved|rejected", "comment": "..." }`.
- `POST /rfqs/{rfqId}/quotes` — tạo quote từ costing đã đủ điều kiện.
- `GET /quotes?customerId=&status=&rfqId=`; `GET /quotes/{quoteId}`.
- `POST /quotes/{quoteId}/revisions` — tạo revision mới từ dữ liệu đã chọn.
- `POST /quote-revisions/{revisionId}/issue` — chỉ khi approval/policy đạt; server đóng băng snapshot.
- `GET /quote-revisions/{revisionId}/export?format=pdf|xlsx` — stream/download theo quyền.
- Không sửa/xóa revision đã phát hành; thay đổi tạo revision kế tiếp.

### Dashboard, AI, settings

- `GET /dashboard/summary?from=&to=&category=&ownerId=` — quyền lọc server-side; KPI kèm định nghĩa/timezone/currency.
- `POST /ai/runs` — task được allowlist, references phải user có quyền đọc; trả kết quả, nguồn và nhãn AI-generated. Không hỗ trợ hành động phát hành quote.
- `GET /ai/runs/{id}` — kết quả nếu caller còn quyền nguồn dữ liệu.
- `GET /settings/costing`; `PATCH /settings/costing` — admin/pricing permissions, effective-dated versions.
- Secret/provider credentials chỉ qua secret manager và server-side admin provisioning; không có API trả plaintext secret.

## Data shapes

### Costing revision response (rút gọn)

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "rfqId": "uuid",
  "category": "pcba",
  "revisionNo": 2,
  "status": "draft",
  "currency": "USD",
  "orderQuantity": "1000",
  "pricingMethod": "gross_margin",
  "pricingRate": "0.250000",
  "overheadRate": "0.080000",
  "lines": [],
  "totals": {
    "directCost": "19.750000",
    "overheadAmount": "1.580000",
    "manufacturingCost": "21.330000",
    "profitPerUnit": "7.110000",
    "sellingPrice": "28.440000",
    "orderTotal": "28440.000000"
  },
  "assumptions": [],
  "version": 3,
  "updatedAt": "2026-11-14T00:00:00Z"
}
```

Số ví dụ chỉ minh họa serialization/công thức; không phải giá production. Với margin 25%, giá bán là manufacturing cost chia cho 0.75; số ở ví dụ làm tròn có thể không khớp tuyệt đối theo precision nội bộ, API thực cần trả giá trị tính từ decimal backend thống nhất.

## Security and audit requirements

- Mọi query/mutation nghiệp vụ giới hạn theo tenant và object-level permission; trả 404 khi resource thuộc tenant khác.
- Không cho phép client tự set `approved`, `issued`, `tenantId`, audit actor hoặc `createdBy` tùy ý.
- File upload giới hạn kích thước/định dạng; quét file theo hạ tầng; object private.
- Import chạy staging, validate, preview và confirm; lỗi không được làm mất dữ liệu hiện có.
- Ghi audit event cho thay đổi customer/RFQ/BOM/costing/settings/approval/quote; loại secret và PII không cần thiết khỏi log.
- Rate limit auth, import và AI; AI retrieval phải tái kiểm tra quyền ở từng record.

## Contract tests cần có

1. Tenant A không GET/PATCH/export được record của tenant B.
2. Quote không phát hành nếu costing chưa approved hoặc policy chưa thỏa.
3. Quote issued không thể PATCH; revision mới vẫn giữ snapshot cũ.
4. Margin 100%, giá/qty âm, currency không hợp lệ bị reject.
5. Repeated idempotency key không tạo duplicate RFQ/import/quote.
6. Import mapping sai/thiếu cột trả lỗi cụ thể và không commit dữ liệu.
7. API JSON trả tiền decimal string và currency code nhất quán.
