# Database Schema — AI Sales Development

Đề xuất PostgreSQL cho một backend multi-user. Tên bảng/cột dùng snake_case, khóa chính UUID, timestamp UTC. Tiền lưu `numeric`, không dùng floating point. Mọi bảng nghiệp vụ nên có `tenant_id`; API phải xác thực tenant từ phiên đăng nhập, không tin tenant_id do client tự gửi.

## 1. Quy ước chung

- `id uuid primary key default gen_random_uuid()`.
- `tenant_id uuid not null references tenants(id)` trên entity có phạm vi tenant.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
- Giá trị tiền có `amount numeric(19,6)` + `currency char(3)`; làm tròn khi trình bày/phát hành theo currency policy.
- Trường trạng thái nên dùng lookup/enum có migration được quản lý; không cho client ghi trạng thái tùy ý.
- Soft delete chỉ dùng ở master data phù hợp; bản quote/RFQ được lưu lịch sử thay vì xóa vật lý.
- Dùng foreign key, unique constraints và index theo tenant; bật Row Level Security nếu nền tảng hỗ trợ, nhưng vẫn enforce authorization tại service/API.

## 2. ERD quan hệ cốt lõi

```text
tenants ──< users, customers, suppliers, product_projects, crm_opportunities, rfqs
customers ──< customer_contacts, crm_opportunities, rfqs, quotes
product_projects ──< bom_revisions ──< bom_items
rfqs ──< rfq_files, rfq_status_events, quote_revisions
quote_revisions ──< costing_revisions ──< cost_lines
suppliers ──< supplier_quotes ──< supplier_quote_items
competitors ──< competitor_observations
users ──< approvals, audit_events, comments
```

## 3. Bảng nền tảng và CRM/customer

### `tenants`
- `id`, `name`, `slug`, `default_currency`, `timezone`, `created_at`.
- Unique: `slug`.

### `users`
- `id`, `tenant_id`, `email`, `display_name`, `is_active`, `created_at`, `updated_at`.
- Unique `(tenant_id, email)`.
- Mật khẩu/identity do auth provider quản lý; không lưu plain-text password.

### `roles`, `permissions`, `user_roles`, `role_permissions`
- Role: `id`, `tenant_id nullable` (null cho system roles), `name`.
- Permission: `id`, `key`, `description`.
- Join tables dùng composite unique; kiểm tra role và record scope ở API.

### `customers`
- `id`, `tenant_id`, `code`, `legal_name`, `display_name`, `industry`, `country_code`, `address`, `status`, `owner_user_id`, `notes`, timestamps.
- Unique `(tenant_id, code)`.
- `status`: lead/prospect/active/vip/inactive; status Customer không đồng nhất CRM deal stage.

### `customer_contacts`
- `id`, `tenant_id`, `customer_id`, `name`, `title`, `email`, `phone`, `is_primary`, `notes`.
- Index `(tenant_id, customer_id)`.

### `crm_opportunities`
- `id`, `tenant_id`, `customer_id`, `owner_user_id`, `code`, `name`, `stage`, `probability numeric(5,2)`, `expected_value numeric(19,6)`, `currency`, `expected_close_date`, `lost_reason`, timestamps.
- `stage`: discovery/qualification/proposal/negotiation/won/lost.
- Pipeline KPI tính từ expected value × probability, không trộn với giá trị RFQ/quote.

### `crm_activities`
- `id`, `tenant_id`, `opportunity_id`, `customer_id`, `user_id`, `activity_type`, `subject`, `body`, `occurred_at`, timestamps.
- Lưu lịch sử meeting/call/email/manual notes, không lưu token bí mật.

## 4. Product, RFQ và file

### `product_projects`
- `id`, `tenant_id`, `customer_id nullable`, `code`, `name`, `category`, `description`, `owner_user_id`, timestamps.
- `category`: `pcba`, `wire_harness`, `iot`.
- Unique `(tenant_id, code)`.

### `rfqs`
- `id`, `tenant_id`, `code`, `customer_id`, `opportunity_id nullable`, `product_project_id nullable`, `owner_user_id`, `category`, `requested_quantity numeric(18,4)`, `currency`, `received_at`, `due_at`, `status`, `requirements jsonb`, timestamps.
- Unique `(tenant_id, code)`.
- `status`: new/triage/costing/quoted/won/lost/cancelled.
- `rfq_status_events`: `id`, `tenant_id`, `rfq_id`, `from_status`, `to_status`, `changed_by`, `reason`, `created_at`.

### `stored_files`
- `id`, `tenant_id`, `object_key`, `original_filename`, `mime_type`, `size_bytes`, `sha256`, `uploaded_by`, `created_at`.
- Object private; signed download URLs ngắn hạn. Không dùng user filename làm object path.
- `rfq_files`: `tenant_id`, `rfq_id`, `stored_file_id`, `file_kind`, composite unique.

## 5. BOM và costing

### `bom_revisions`
- `id`, `tenant_id`, `product_project_id`, `revision`, `source_file_id nullable`, `status`, `created_by`, `created_at`.
- Unique `(tenant_id, product_project_id, revision)`.

### `bom_items`
- `id`, `tenant_id`, `bom_revision_id`, `line_number`, `part_number`, `description`, `category`, `quantity_per_unit numeric(18,6)`, `uom`, `manufacturer`, `manufacturer_part_number`, `preferred_supplier_id nullable`, `unit_cost numeric(19,6) nullable`, `currency nullable`, `source_type`, `source_reference jsonb`, `risk_flags jsonb`.
- Unique `(tenant_id, bom_revision_id, line_number)`.
- `source_type`: customer_bom/supplier_quote/manual/ai_suggestion.

### `costing_revisions`
- `id`, `tenant_id`, `product_project_id`, `rfq_id nullable`, `revision_no`, `category`, `status`, `currency`, `order_quantity numeric(18,4)`, `direct_cost numeric(19,6)`, `setup_cost numeric(19,6)`, `overhead_base numeric(19,6)`, `overhead_rate numeric(9,6)`, `overhead_amount numeric(19,6)`, `manufacturing_cost numeric(19,6)`, `pricing_method` (gross_margin/markup), `pricing_rate numeric(9,6)`, `selling_price numeric(19,6)`, `profit_per_unit numeric(19,6)`, `assumptions jsonb`, `created_by`, timestamps.
- `status`: draft/in_review/approved/rejected/superseded.
- Unique `(tenant_id, product_project_id, revision_no)`.
- Store calculated values as a snapshot; backend recalculates and validates before approval.

### `cost_lines`
- `id`, `tenant_id`, `costing_revision_id`, `line_no`, `cost_type`, `description`, `quantity_per_unit numeric(18,6)`, `uom`, `unit_cost numeric(19,6)`, `currency`, `extended_cost numeric(19,6)`, `included_in_direct_cost boolean`, `source_type`, `supplier_quote_item_id nullable`, `source_note`, timestamps.
- `cost_type`: component/material/pcb_fabrication/assembly/labor/test/tooling/nre/freight/other.

### `costing_settings`
- `id`, `tenant_id`, `category`, `currency`, `overhead_rate numeric(9,6)`, `overhead_base_policy`, `pricing_method`, `default_pricing_rate numeric(9,6)`, `minimum_margin numeric(9,6)`, `tax_rate numeric(9,6)`, `effective_from`, `updated_by`, timestamps.
- Version by effective date; avoid mutating a setting used by an issued quote without preserving the old version.

## 6. Supplier, competitor, quote, approval

### `suppliers`
- `id`, `tenant_id`, `code`, `name`, `country_code`, `categories text[]`, `lead_time_days`, `moq numeric(18,4)`, `rating numeric(4,2)`, `api_status`, `is_active`, timestamps.
- Unique `(tenant_id, code)`.

### `supplier_quotes`, `supplier_quote_items`
- Supplier quote header: `id`, `tenant_id`, `supplier_id`, `quote_number`, `currency`, `valid_from`, `valid_until`, `lead_time_days`, `source_file_id nullable`, `status`, `received_at`.
- Item: `id`, `tenant_id`, `supplier_quote_id`, `part_number`, `description`, `break_quantity numeric(18,4)`, `unit_price numeric(19,6)`, `moq`, `uom`, `manufacturer`, `stock_quantity nullable`.
- Index `(tenant_id, part_number, received_at desc)`.

### `competitors`, `competitor_observations`
- Competitor master: `id`, `tenant_id`, `name`, `market_segment`, `notes`.
- Observation: `id`, `tenant_id`, `competitor_id`, `product_project_id nullable`, `observed_price numeric(19,6) nullable`, `currency`, `lead_time_days nullable`, `source_url nullable`, `source_type`, `observed_at`, `confidence numeric(5,2)`, `notes`, `created_by`.
- Treat as dated observation, not verified market truth unless source supports it.

### `quotes`, `quote_revisions`, `quote_items`
- `quotes`: `id`, `tenant_id`, `quote_number`, `rfq_id`, `customer_id`, `status`, `owner_user_id`, `created_at`, `updated_at`.
- `quote_revisions`: `id`, `tenant_id`, `quote_id`, `revision_no`, `costing_revision_id`, `currency`, `valid_until`, `payment_terms`, `delivery_terms`, `tax_amount`, `freight_amount`, `total_amount`, `snapshot jsonb`, `issued_at`, `issued_by`, timestamps.
- `quote_items`: `id`, `tenant_id`, `quote_revision_id`, `product_project_id`, `description`, `quantity`, `unit_price`, `line_total`, `currency`.
- Unique `(tenant_id, quote_id, revision_no)`. Issued revision immutable; changes create next revision.

### `approval_requests`, `approval_events`
- Request: `id`, `tenant_id`, `entity_type`, `entity_id`, `requested_by`, `status`, `policy_snapshot jsonb`, `created_at`, `resolved_at`.
- Event: `id`, `tenant_id`, `approval_request_id`, `reviewer_id`, `decision`, `comment`, `created_at`.
- Quy tắc approval đánh giá tại backend; kiểm tra quyền, ngưỡng margin và conflict-of-interest policy.

## 7. AI, audit và settings

### `ai_runs`
- `id`, `tenant_id`, `user_id`, `task_type`, `provider`, `model`, `input_record_refs jsonb`, `prompt_version`, `status`, `output jsonb`, `usage jsonb`, `created_at`.
- Tránh lưu raw prompt chứa PII nếu không cần; áp dụng retention policy và redaction.

### `audit_events`
- `id`, `tenant_id`, `actor_user_id nullable`, `action`, `entity_type`, `entity_id`, `before jsonb nullable`, `after jsonb nullable`, `ip_hash nullable`, `created_at`.
- Append-only, không ghi secret/credential.

### `tenant_settings`
- `tenant_id`, `key`, `value jsonb`, `updated_by`, `updated_at`.
- Chỉ dùng cho cấu hình không bí mật; API key/provider secret lưu secret manager server-side.

## 8. Indexes, constraints và số liệu

- Index tenant-scoped: `(tenant_id, status, updated_at desc)` cho RFQ/quote/opportunity; `(tenant_id, customer_id)`; `(tenant_id, category)`.
- Kiểm tra giá, quantity, rate không âm; tỷ lệ margin nằm trong [0,1) và approval policy có thể đặt thấp hơn.
- Đơn giá phải cùng currency với revision hoặc được chuyển đổi server-side với tỷ giá và timestamp ghi rõ.
- Không tính dashboard bằng số mẫu; tạo query/view tổng hợp theo permission và date range.
- Idempotency key cho import hoặc tạo quote từ thao tác có thể gửi lặp.

## 9. Migration từ prototype

Prototype dùng localStorage, không có identity, tenant isolation, audit hoặc đồng bộ. Không nên tự động migrate dữ liệu cá nhân của trình duyệt thành dữ liệu production. Cần export JSON/Excel, xác nhận owner, validate schema, preview/import vào tenant đích, lưu nguồn nhập và báo lỗi. Mẫu giá demo phải gắn `source_type='sample'` và không được phát hành thành quote.

## 10. Lưu ý triển khai

Đây là schema logical đề xuất, chưa phải migration đã chạy. Trước khi tạo migration cần chọn Postgres version/auth provider, chính sách tenant/RLS, retention, currency/rounding, approval rules và tên enum chuẩn. Tạo migration có rollback và tests cho foreign keys, tenant boundaries, immutable quote revisions và công thức costing.
