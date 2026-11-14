# PRD — AI Sales Development & Quotation Platform

- **Phiên bản:** 1.0 — 13/11/2026
- **Trạng thái:** Bản yêu cầu sản phẩm đề xuất; cần chủ sản phẩm xác nhận chính sách giá, quyền duyệt và tích hợp trước khi đưa vào production.
- **Đối tượng:** Ban giám đốc, Sales/BD, kỹ sư BOM/Costing, Sourcing, quản trị viên.

## 1. Tóm tắt sản phẩm

Nền tảng hỗ trợ quy trình bán hàng B2B cho doanh nghiệp sản xuất/gia công điện tử: tiếp nhận cơ hội và RFQ, quản lý khách hàng, phân tích BOM PCBA/Wire harness/IoT, lập costing, xin duyệt và phát hành báo giá, theo dõi kết quả. AI có vai trò trợ lý đề xuất có thể kiểm chứng; không tự đưa ra giá mua/bán hoặc cam kết chất lượng nếu không có dữ liệu và người có thẩm quyền phê duyệt.

Ứng dụng hiện tại là frontend React + TypeScript. Các module và dữ liệu mẫu trong trình duyệt là prototype; yêu cầu xác thực, backend, database, phân quyền, audit log và lưu file là phạm vi cần triển khai để vận hành nhiều người dùng.

## 2. Mục tiêu và chỉ số thành công

- Giảm thời gian từ khi nhận RFQ đến báo giá đầu tiên ít nhất 30% sau khi có dữ liệu baseline.
- 100% báo giá phát hành có phiên bản, tiền tệ, hiệu lực, điều khoản và người duyệt.
- Tính được giá thành/giá bán riêng theo nhóm BOM PCBA, Wire harness và IoT.
- Theo dõi tỷ lệ chuyển RFQ thành quote, quote thành đơn hàng, gross margin và thời gian xử lý.
- Không ghi nhận đề xuất AI thành chi phí/giá đã xác nhận nếu chưa có người dùng chấp thuận.

Các mục tiêu trên là mục tiêu cần đo, không phải kết quả đã được chứng minh.

## 3. Người dùng và quyền hạn

| Vai trò | Nhu cầu chính | Quyền mặc định đề xuất |
| --- | --- | --- |
| Sales/BD | Khách hàng, cơ hội, RFQ, báo giá và follow-up | Tạo/sửa hồ sơ và bản nháp; xem giá được phép |
| Cost engineer | BOM, routing, định mức và costing | Quản lý cost breakdown; gửi duyệt |
| Procurement | Nhà cung cấp, quote, MOQ, lead time | Quản lý dữ liệu sourcing và báo giá NCC |
| Sales/Pricing manager | Duyệt giá, margin, ngoại lệ | Duyệt/từ chối; cấu hình ngưỡng được phân quyền |
| Admin | Người dùng, cấu hình, danh mục | Quản trị tenant và cấu hình hệ thống |
| Executive/read-only | KPI và hồ sơ được phép xem | Chỉ đọc báo cáo và dữ liệu theo phạm vi |

Phân quyền thực tế cần dựa trên role + phạm vi tổ chức/khách hàng, và được kiểm tra ở backend, không chỉ ẩn nút trên frontend.

## 4. Phạm vi

### Trong phạm vi phiên bản đầu
- 12 menu: Dashboard, CRM, Customer, RFQ, BOM AI, PCB AI, Harness AI, AI Chat, Costing, Supplier, Competitor, Settings.
- Phân loại sản phẩm: BOM PCBA, Wire harness, IoT.
- Quản lý khách hàng, liên hệ, cơ hội, RFQ, BOM, nhà cung cấp, costing và báo giá có phiên bản.
- Import/export Excel với kiểm tra cột, preview, lỗi theo dòng và xác nhận trước khi thay dữ liệu.
- Xuất PDF/Excel báo giá; lưu bản nháp và trạng thái duyệt.
- Nhật ký thay đổi quan trọng, quản lý người dùng, cấu hình mặc định.
- AI có thể tóm tắt, phân loại hoặc đưa gợi ý có nguồn dữ liệu rõ ràng và nhãn “chưa xác minh”.

### Ngoài phạm vi MVP
- Tự động đặt hàng hoặc cam kết giá với nhà cung cấp.
- Tự động đọc mọi định dạng CAD/Gerber/ảnh và kết luận DFM chính thức.
- Hạch toán kế toán, ERP/MRP hoàn chỉnh, quản lý sản xuất shop-floor.
- Tự gửi email/quote ra ngoài mà không có bước người dùng xác nhận.
- Khẳng định dữ liệu giá thị trường real-time nếu chưa kết nối API được cấp phép.

## 5. Quy tắc costing và báo giá

### Cơ sở tính
Mỗi cost line thuộc một revision costing, có mô tả, số lượng định mức trên một sản phẩm, đơn giá, tiền tệ, nguồn giá, ngày hiệu lực và trạng thái xác minh. Chi phí trực tiếp mỗi sản phẩm là tổng `định mức × đơn giá` của các dòng được đánh dấu tính vào giá.

- `direct_cost = Σ(qty_per_unit × unit_cost)`
- `manufacturing_cost = direct_cost + setup/NRE phân bổ + overhead`
- `overhead = overhead_base × overhead_rate` theo chính sách cấu hình; nêu rõ base.
- Nếu margin là phần trăm trên giá bán: `selling_price = manufacturing_cost / (1 - margin_rate)`; margin phải nhỏ hơn 100%.
- Nếu công ty dùng markup: `selling_price = manufacturing_cost × (1 + markup_rate)`. Hai thuật ngữ margin và markup không được dùng lẫn.
- `profit_per_unit = selling_price - manufacturing_cost`; `order_total = selling_price × order_quantity`.
- Thuế, vận chuyển, tooling/NRE, hao hụt/yield, phí thanh toán, điều kiện Incoterms phải là cấu phần riêng hoặc được ghi rõ là chưa bao gồm.

Mỗi quote lưu snapshot các dòng chi phí, tỷ giá và quy tắc tại thời điểm phát hành để giá cũ không đổi khi cấu hình được cập nhật. Giá mẫu trên giao diện là dữ liệu giả định, phải thay bằng dữ liệu đã kiểm chứng.

### Duyệt giá
- Báo giá mới mặc định là Draft.
- Giá thấp hơn margin floor, vượt ngưỡng chiết khấu, thiếu nguồn giá hoặc có đề xuất chưa xác minh phải được cảnh báo và/hoặc chuyển approval theo cấu hình.
- Chỉ người có quyền mới phát hành phiên bản Approved/Issued.
- Lưu người tạo, người duyệt, timestamp, lý do thay đổi và lịch sử phiên bản.

## 6. Yêu cầu theo 12 menu

| Menu | Yêu cầu sản phẩm / tiêu chí chấp nhận cấp cao |
| --- | --- |
| Dashboard | KPI theo khoảng thời gian, tiền tệ và danh mục; tổng hợp từ dữ liệu thực; lọc theo quyền; drill-down đến RFQ/quote. Không dùng số liệu hard-code trong production. |
| CRM | Quản lý cơ hội, owner, stage, giá trị dự kiến, xác suất, ngày dự kiến đóng và tương tác; tính pipeline nhất quán; lọc và tìm kiếm. |
| Customer | Hồ sơ pháp nhân, địa chỉ, ngành, trạng thái, người liên hệ và lịch sử mua/RFQ/quote; Customer là master account, CRM là cơ hội bán hàng. |
| RFQ | Tạo RFQ gắn khách hàng, danh mục, sản lượng, yêu cầu kỹ thuật, deadline, file và owner; theo dõi New/Review/Costing/Quoted/Won/Lost/Cancelled; log trạng thái. |
| BOM AI | Import BOM, map cột, validate mã/qty/UOM, phát hiện duplicate/missing; giữ file nguồn và phiên bản; AI chỉ đề xuất phân loại/thay thế có lý do và nguồn. |
| PCB AI | Nhập thông số PCB, số lớp/kích thước/vật liệu, lô, process, test và NRE; sinh estimate có giả định; không coi DFM mock là kết quả kiểm định thật. |
| Harness AI | BOM dây/connector/terminal, chiều dài, số đầu bấm, routing/process, labor/test; tính định mức; hỗ trợ import và ghi nguồn giá. |
| AI Chat | Hỏi đáp trên dữ liệu được phép; hiển thị nguồn record và thời điểm; không tiết lộ dữ liệu khách hàng khác; không thực hiện gửi quote hoặc thay giá khi chưa xác nhận. |
| Costing | Phân loại BOM PCBA/Wire harness/IoT; sửa cost line, quantity, overhead, currency, margin/markup; tính lại tức thì; lưu revision; cảnh báo thiếu dữ liệu; xuất breakdown. |
| Supplier | Hồ sơ NCC, danh mục, MOQ, lead time, địa điểm, đánh giá; lưu supplier quote theo ngày/điều kiện; so sánh lựa chọn và nguồn dữ liệu. |
| Competitor | Lưu quan sát đối thủ có nguồn/ngày/độ tin cậy; đối chiếu mức giá và lead time; giới hạn quyền xem thông tin nhạy cảm; AI không suy đoán thành dữ liệu xác thực. |
| Settings | Cấu hình currency, thuế, overhead base/rate, margin floor, approval rules, danh mục; quản lý role và AI provider; không lưu secret API key ở localStorage/browser. |

## 7. Luồng nghiệp vụ chính

1. Sales tạo/cập nhật Customer và CRM opportunity.
2. Tạo RFQ, điền danh mục sản phẩm, sản lượng, deadline, yêu cầu và file.
3. Cost engineer import/kiểm tra BOM hoặc định mức; Procurement thu thập giá NCC.
4. Tạo costing revision cho đúng category, lưu nguồn giá, currency và giả định.
5. Tính giá thành, margin/markup, tổng đơn hàng; nhận gợi ý AI nếu phù hợp.
6. Người có quyền rà soát và duyệt; sửa đổi tạo revision mới, không ghi đè lịch sử.
7. Xuất quote PDF/Excel, phát hành bản Approved/Issued cho khách hàng.
8. Ghi nhận phản hồi Won/Lost, lý do, follow-up và KPI.

## 8. Yêu cầu phi chức năng

- Bảo mật: xác thực, RBAC, tenant isolation, mã hóa truyền tải, quản lý secrets phía server, audit log.
- Riêng tư: AI chỉ nhận dữ liệu tối thiểu cần thiết; chính sách lưu/xóa dữ liệu và consent rõ ràng.
- Tính đúng: số tiền dùng decimal ở backend/database, lưu tiền tệ và tỷ giá; kiểm thử công thức, làm tròn theo policy.
- Khả dụng: dữ liệu bền vững qua nhiều người dùng; backup/restore; lỗi import/export có thể giải thích.
- Hiệu năng: danh sách có phân trang; KPI truy vấn tổng hợp; upload giới hạn dung lượng và loại file.
- Trải nghiệm: desktop/tablet/mobile, bàn phím, nhãn form, trạng thái loading/error/empty, locale vi-VN và en-US.
- Quan sát: log, metrics, error tracking; không ghi API key hay dữ liệu nhạy cảm vào log.

## 9. Dữ liệu và tích hợp

- Database quan hệ PostgreSQL đề xuất; chi tiết trong `docs/DATABASE_SCHEMA.md`.
- File upload lưu object storage riêng tư; database chỉ lưu metadata và quyền truy cập.
- Backend API chịu trách nhiệm xác thực, tính giá, audit và provider AI.
- Tích hợp nhà cung cấp/ERP/email là adapter có timeout, retry có kiểm soát và theo dõi nguồn.

## 10. Các quyết định cần chủ sản phẩm xác nhận

1. Currency mặc định và quy tắc tỷ giá: USD, VND hay nhiều tiền tệ?
2. Overhead gồm những thành phần nào và áp trên direct cost hay một base khác?
3. Công ty dùng gross margin hay markup? Có margin floor theo category/khách hàng không?
4. Tính hao hụt/yield, NRE/tooling, MOQ, freight, VAT và điều khoản giao hàng thế nào?
5. Ai duyệt giá và ngưỡng nào bắt buộc duyệt?
6. Customer và CRM hiện có mẫu dữ liệu nào cần migrate? Quy tắc import/merge?
7. Provider AI nào được phép dùng; dữ liệu nào được gửi cho provider?
8. Supplier/competitor API nào có giấy phép và dữ liệu được cập nhật theo lịch nào?

## 11. Điều kiện nghiệm thu MVP

- Có xác thực và role enforcement ở API; người dùng chỉ thấy tenant/phạm vi được phép.
- Có thể tạo Customer → RFQ → BOM/costing revision → quote → approval → issued quote.
- Ba category có template riêng và người dùng tùy chỉnh line; công thức được test với margin/markup, overhead và số lượng.
- Import báo lỗi cột/dòng cụ thể, cho preview, không xóa dữ liệu hiện có khi lỗi.
- Quote đã phát hành giữ nguyên snapshot sau khi thay supplier price hoặc settings.
- Export PDF/Excel khớp giá trị với màn hình và thể hiện giả định/điều khoản.
- Unit/integration tests cho công thức và phân quyền; build/lint/test chạy trong CI.
- AI output có nguồn, confidence/giới hạn và thao tác xác nhận của người dùng.

## 12. Rủi ro và giảm thiểu

| Rủi ro | Giảm thiểu |
| --- | --- |
| Giá mẫu bị hiểu nhầm là báo giá thật | Gắn nhãn sample, không dùng dữ liệu mẫu khi phát hành |
| Margin/markup hoặc overhead hiểu khác nhau | Chốt policy, đặt tên rõ, test và lưu snapshot |
| AI đưa gợi ý sai | Hiển thị nguồn/giả định; approval bắt buộc; không tự ghi đè giá |
| Import Excel sai cột/sai đơn vị | Mapping preview, validation, staging và rollback |
| localStorage mất dữ liệu/không đồng bộ | Chỉ dùng demo; chuyển persistence sang backend có backup |
| Dữ liệu khách hàng lộ qua AI | Server-side authorization, data minimization, redaction và provider review |
