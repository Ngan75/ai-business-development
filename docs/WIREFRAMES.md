# Wireframes — 12 menu AI Sales Development

Mô tả wireframe độ trung thực thấp để BA/UX/engineering thống nhất trước khi làm design chi tiết. Các sơ đồ là cấu trúc màn hình, không phải thiết kế pixel-perfect. Dùng chung header breadcrumb/page title, trạng thái loading/empty/error, bộ lọc và responsive behavior.

## 0. Khung ứng dụng dùng chung

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AI Business  / Breadcrumb                         Search   Help   User ▾    │
├────────────────┬─────────────────────────────────────────────────────────────┤
│ Dashboard      │ Page title                                  Primary action │
│ CRM            │ Description / scope                                         │
│ Customer       │                                                             │
│ RFQ            │ Main content: cards, filters, table/forms                   │
│ BOM AI         │                                                             │
│ PCB AI         │                                                             │
│ Harness AI     │                                                             │
│ AI Chat        │                                                             │
│ Costing        │                                                             │
│ Supplier       │                                                             │
│ Competitor     │                                                             │
│ Settings       │                                                             │
└────────────────┴─────────────────────────────────────────────────────────────┘
```

Desktop: sidebar thu gọn được; mobile: navigation drawer; main content không bị khóa chiều rộng. Mỗi form có label, validation inline, keyboard focus, confirm trước thao tác phá hủy. Thông tin AI/sample được gắn nhãn rõ.

## 1. Dashboard

```text
[Dashboard]                         [Khoảng thời gian ▾] [Category ▾]
[KPI: Pipeline] [RFQ mở] [Quote conversion] [Gross margin]
[Biểu đồ doanh thu / quote / margin theo tháng        ] [RFQ cần chú ý]
[Top customers / product category                    ] [Hoạt động gần đây]
```

- KPI có định nghĩa và click để mở danh sách tương ứng.
- Alert deadline/margin hiển thị nguồn và thời điểm; không đưa insight hard-code.

## 2. CRM

```text
[CRM / Cơ hội] [Tìm kiếm] [Stage ▾] [Owner ▾] [ + Tạo cơ hội ]
[Pipeline summary: tổng giá trị | weighted value | số cơ hội]
[Bảng: Mã | Cơ hội | Customer | Stage | Value | Close date | Owner | ...]
[Drawer detail: timeline | contact | notes | related RFQs/quotes]
```

- Opportunity detail mở drawer hoặc trang chi tiết; stage change ghi activity.

## 3. Customer

```text
[Khách hàng] [Tìm kiếm] [Ngành ▾] [Status ▾] [Nhập Excel] [ + Customer ]
[Bảng: Mã | Tên pháp nhân | Ngành | Khu vực | Owner | RFQ gần nhất | Status]
[Customer detail]
  [Thông tin công ty] [Contacts] [Opportunities] [RFQs/Quotes] [Lịch sử]
```

- Customer là master account; không dùng Customer status để thay CRM stage.

## 4. RFQ

```text
[RFQ] [Search] [Status ▾] [Category ▾] [Owner ▾] [ + Tạo RFQ ]
[RFQ table: Code | Customer | Project | Category | Qty | Due date | Status]
[RFQ detail]
  [Overview] [Requirements] [Files] [BOM] [Costing/Quote] [Activity]
  [Status timeline]                             [Gửi costing] [Tạo quote]
```

- Wizard tạo RFQ: 1) khách hàng/dự án 2) category/quantity 3) yêu cầu/file 4) review/submit.

## 5. BOM AI

```text
[BOM AI] [Project ▾] [Revision ▾] [Upload Excel]
[Dropzone: file / choose file] [Template download]
[Import mapping: Part number | Description | Qty | UOM | Manufacturer]
[Preview: rows accepted / warnings / errors] [Cancel] [Confirm import]
[Table: Line | MPN | Description | Category | Qty | Supplier | Source | Risk]
[AI suggestions panel: suggestion + rationale + source + Accept / Dismiss]
```

- Không gắn “AI” vào bước validate thông thường; phân biệt rule warnings với AI suggestions.

## 6. PCB AI

```text
[PCB AI / DFM estimate] [Project ▾] [PCB revision ▾] [Add input files]
[Board: length | width | layers | material | copper | finish | panelization]
[Production: quantity | SMT/DIP | components | test | yield | NRE]
[Estimate summary: PCB fab | Assembly | Test | NRE | assumptions]
[Checks table: Rule | Measured | Limit/source | Status | Engineer review]
```

- Kết quả DFM phải chỉ rõ rule set/version và nguồn; nếu chỉ demo thì ghi “mock estimate”.

## 7. Harness AI

```text
[Harness AI] [Project ▾] [Revision ▾] [Import harness BOM]
[Summary: wire types | connector types | total length | estimated labor]
[Process assumptions: cut/strip/crimp | terminals | assembly | continuity test]
[Table: Wire/Part | Length | Ends | Connector | Qty | Unit cost | Source]
[Cost breakdown] [Warnings/review] [Save revision]
```

- Cho chỉnh định mức và labor time; chi phí đề xuất không được tự coi là supplier-confirmed.

## 8. AI Chat

```text
[AI Assistant] [Context: RFQ / Project ▾] [Sources enabled ▣]
[Conversation: user question / answer / citations / assumptions]
[Suggested prompts: summarize RFQ | explain cost variance | draft follow-up]
[Message composer.......................................] [Send]
[Answer actions: Copy | Add note | Create draft (confirmation required)]
```

- Hiển thị “AI-generated”, nguồn record/updated-at, trạng thái provider; không có action gửi email/quote trực tiếp.

## 9. Costing

```text
[Costing] [Project ▾] [Category: BOM PCBA | Wire harness | IoT]
[Revision ▾] [Qty] [Currency] [Overhead policy] [Pricing method: margin/markup]
[Cost lines: Item | Qty/unit | UOM | Unit cost | Currency | Source | Extended]
[+ Add line] [Import Excel] [Recommendations (optional, cited)]
[Summary: Direct | Setup/NRE | Overhead | Manufacturing cost | Profit | Sell price]
[Margin guardrail] [Save draft] [Request approval] [Export quote]
```

- Thay đổi assumptions cập nhật calculation preview; approved/issued snapshot không bị sửa.

## 10. Supplier

```text
[Suppliers] [Search] [Category ▾] [Country ▾] [ + Add supplier ] [Import]
[Table: Code | Name | Categories | MOQ | Lead time | Rating | API/source status]
[Supplier detail: profile | quotes | part prices | performance | files]
[Compare suppliers: selected parts / break quantity / price / currency / lead time]
```

- “API connected” chỉ hiển thị từ trạng thái kết nối thực, không phải hard-coded badge.

## 11. Competitor

```text
[Competitor] [Segment ▾] [Observed date range] [ + Add observation ]
[Benchmark table: Product | Our price | Observed competitor | Delta | Lead time]
[Observation detail: source | date | confidence | notes | verified by]
[Positioning summary / scenarios] [Export]
```

- Không trình bày dữ liệu không có nguồn như giá thị trường xác thực.

## 12. Settings

```text
[Settings navigation: Company | Costing | Approvals | Users & Roles | AI]
[Company: currency | locale | tax policy]
[Costing: category defaults | overhead base/rate | margin vs markup | floor]
[Approval: thresholds | approver roles | escalation]
[Users & roles: member list | invitations | permissions]
[AI: provider/model policy | retention | allowed data categories]
[Save changes] [Change history]
```

- Secret key không được hiển thị/ghi vào browser storage; cài đặt nhạy cảm chỉ admin được xem/sửa.

## 13. Common states and responsive notes

- **Empty:** hướng dẫn hành động đầu tiên và link đến template import.
- **Loading:** skeleton phù hợp layout; tránh hiển thị số 0 như dữ liệu thật.
- **Error:** mô tả có thể khắc phục, correlation ID nếu cần support; không lộ stack trace.
- **Import:** chọn file → map cột → preview/errors → confirm; giữ dữ liệu cũ nếu import lỗi.
- **Unsaved changes:** cảnh báo khi rời form; autosave chỉ khi hành vi và lịch sử rõ.
- **Mobile:** cards thay bảng rộng; bảng có scroll ngang; modal thành full-screen drawer.
- **Accessibility:** tương phản, focus indicator, label/aria, không chỉ dùng màu để thể hiện trạng thái.

## 14. Điều cần UX/product xác nhận

- Logo/brand, bộ font và màu chuẩn.
- Sales cần dashboard mặc định theo owner hay toàn công ty.
- Có cần approval workflow nhiều cấp không.
- Template PDF/Excel, ngôn ngữ, currency và điều khoản báo giá.
- Các cột bắt buộc cho từng định dạng BOM và harness thực tế.
