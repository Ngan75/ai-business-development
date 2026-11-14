# Roadmap — AI Sales Development

Roadmap đề xuất theo năng lực và phụ thuộc, không phải cam kết ngày phát hành. Mỗi sprint giả định 2 tuần; team/velocity chưa được cung cấp nên cần hiệu chỉnh sau Sprint 0. Tham chiếu business scope trong `docs/PRD.md` và schema trong `docs/DATABASE_SCHEMA.md`.

## Nguyên tắc triển khai

- Làm nền tảng backend, dữ liệu và quyền truy cập trước khi biến prototype localStorage thành hệ thống đa người dùng.
- Phát hành MVP theo luồng Customer → RFQ → Costing → Approval → Quote; không cần hoàn tất 12 menu cùng lúc.
- Mọi số liệu sản xuất/giá cần có nguồn, tiền tệ, thời điểm và trạng thái xác minh.
- AI gợi ý có thể tắt, có nguồn và có người xác nhận; không cho AI tự phát hành giá.
- Kết thúc mỗi sprint bằng demo, acceptance check, review rủi ro và cập nhật backlog.

## Sprint 0 — Discovery & quyết định nghiệp vụ

**Mục tiêu:** khóa các chính sách giá, quy trình và tiêu chí nghiệm thu.

- Phỏng vấn Sales, Costing, Procurement, Pricing Manager, Admin.
- Chốt gross margin hay markup, overhead base, currency/FX, rounding, yield, tooling/NRE, tax/freight.
- Xác nhận 12 menu, role, approval thresholds và mẫu Excel hiện hành.
- Thu thập dữ liệu mẫu đã ẩn danh cho BOM PCBA, Wire harness, IoT.
- Chọn hosting, auth provider, Postgres/object storage, email và AI provider.

**Nghiệm thu:** decision log được chủ sản phẩm duyệt; có data dictionary và acceptance criteria ưu tiên.

## Sprint 1 — Nền tảng ứng dụng và bảo mật

- Backend API, Postgres migrations, auth, tenant/user/role.
- CI: build, lint, test, migration check; environment secrets.
- API authorization và audit event nền tảng.
- Frontend API client, loading/error states, responsive shell 12 menu.
- Thay các API key giả lập trong Settings bằng secret handling server-side; xóa giá trị key hard-coded.

**Nghiệm thu:** đăng nhập/role; kiểm thử người dùng tenant khác không truy cập dữ liệu; CI green.

## Sprint 2 — Customer, CRM và Supplier master

- CRUD/search/filter cho Customer, contact, opportunity, activity.
- Supplier master và import ban đầu có preview/mapping.
- Customer status riêng biệt CRM stage.
- Dashboard KPI đầu tiên lấy từ API với date range.

**Nghiệm thu:** create/update/search, validation, authorization, audit và import errors rõ ràng.

## Sprint 3 — RFQ và file/document handling

- RFQ create/update, category, quantity, deadline, owner, status events.
- Upload file riêng tư vào object storage và metadata DB.
- RFQ list/search/filter, Excel import/export staging.
- Activity/comment cơ bản và reminder nội bộ nếu có hạ tầng.

**Nghiệm thu:** RFQ liên kết Customer; state transitions hợp lệ; file được bảo vệ quyền truy cập.

## Sprint 4 — BOM ingestion và supplier quote

- BOM revision/items; Excel mapping, preview, duplicate/missing validation.
- Supplier quote header/items, price breaks, MOQ, validity, currency, lead time.
- Gắn nguồn giá/nguồn file vào từng line.
- BOM AI bắt đầu bằng rule-based classification có confidence và sửa tay; chưa dùng AI để tự thay linh kiện.

**Nghiệm thu:** nhập BOM có thể preview/rollback; dữ liệu nguồn tra được; không phá revision cũ.

## Sprint 5 — Costing PCBA + Wire harness

- Template category BOM PCBA và Wire harness, cost line CRUD, direct cost.
- Overhead, setup/NRE, yield/quantity logic theo policy đã chốt.
- Tính margin hoặc markup đúng thuật ngữ; currency/rounding tests.
- Lưu revision và compare revisions; cảnh báo thiếu source hoặc giá hết hạn.

**Nghiệm thu:** unit tests cho các ca tiêu chuẩn, biên, 0 quantity, invalid rate; đối chiếu ví dụ đã được Costing duyệt.

## Sprint 6 — IoT, quote, approval và exports

- IoT costing template và tùy chỉnh routing/cost lines.
- Quote revisions, quote items, immutable snapshot.
- Approval queue theo policy; approve/reject/comment.
- Xuất PDF/Excel có terms, expiry, version, assumptions và disclaimer.

**Nghiệm thu:** chỉ người có quyền phát hành quote Approved; thay giá tạo revision mới; export khớp DB snapshot.

## Sprint 7 — AI Chat & AI-assisted review (guarded)

- Backend AI gateway; provider secrets ở server; timeout/rate limit/usage tracking.
- Chat retrieval giới hạn theo quyền và nguồn RFQ/BOM/costing.
- Gợi ý phân loại/summary/điểm cần kiểm tra kèm citations và “AI suggestion”.
- User review/accept/dismiss, log AI run; không tự áp dụng giá.

**Nghiệm thu:** test prompt injection/data boundary, không rò dữ liệu cross-tenant, AI output có references, fallback khi provider lỗi.

## Sprint 8 — Dashboard, Competitor, analytics và hardening

- Dashboard theo thời gian/category/owner với drilldown và permission.
- Competitor observations có nguồn, ngày, confidence, không giả lập market feed.
- KPI conversion, cycle time, margin, lost reasons.
- Accessibility, performance, backup/restore drill, security review, UAT, release checklist.

**Nghiệm thu:** KPI có định nghĩa và đối chiếu mẫu; UAT sign-off; rollback/backup runbook.

## Định nghĩa hoàn thành (DoD)

- Acceptance criteria được kiểm thử; API authorization và input validation có test.
- Unit tests cho công thức tiền; integration tests cho state transitions và tenant isolation.
- Lint/build/test/migration checks chạy trong CI.
- Không có secret trong source, log, localStorage hay artifact.
- Có telemetry tối thiểu, lỗi có thông điệp hữu ích, tài liệu vận hành cập nhật.
- Demo được với dữ liệu synthetic được gắn nhãn; production data không dùng sample assumptions.

## Rủi ro / phụ thuộc

| Phụ thuộc hoặc rủi ro | Hành động |
| --- | --- |
| Chính sách margin/overhead chưa xác nhận | Sprint 0 quyết định; chặn phát hành quote nếu chưa cấu hình |
| Workbook BOM không đồng nhất | Thu thập mẫu, mapping preview, không ép một định dạng |
| API NCC/licensing | Chỉ tích hợp sau khi xác nhận điều khoản và credential |
| AI privacy và độ chính xác | Security review, data minimization, citations, người duyệt |
| Team/effort chưa biết | Re-estimate sau Sprint 0; roadmap là thứ tự ưu tiên, không hứa deadline |
| Prototype dùng localStorage | Giữ như demo; migrate có kiểm soát, không coi là source of truth production |

## Release phases

- **MVP:** Sprint 0–6, tập trung flow định giá và báo giá có kiểm soát.
- **AI-assisted release:** Sprint 7, chỉ sau khi API/data authorization sẵn sàng.
- **Scale & analytics:** Sprint 8 và các sprint tiếp theo; tích hợp ERP/email/API theo business case.
