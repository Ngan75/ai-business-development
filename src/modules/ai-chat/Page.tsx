import { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, Sparkles, UserRound } from 'lucide-react';

type Message = { role: 'assistant' | 'user'; text: string };
const welcome: Message = { role: 'assistant', text: 'Xin chào! Tôi có thể hỗ trợ tra cứu các dữ liệu đã lưu trong workspace và hướng dẫn tính giá. Đây là trợ lý cục bộ theo quy tắc, chưa kết nối mô hình AI hay dữ liệu thị trường trực tiếp.' };
function safeRead<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function localAnswer(question: string): string {
  const q = question.toLocaleLowerCase('vi');
  const rfqs = safeRead<Array<{ status?: string; totalValue?: number; project?: string }>>('ai_business_rfq_data', []);
  const crm = safeRead<Array<{ dealValue?: number; name?: string; rating?: string }>>('ai_business_crm_data', []);
  const costs = safeRead<Record<string, Array<{ name?: string; quantity?: number; unitCost?: number }>>>('ai_sales_costs_by_category', {});
  const format = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  if (/rfq|báo giá nhà cung cấp/.test(q)) {
    const active = rfqs.filter((item) => !['Đã thành công', 'NG (giá cao)'].includes(item.status ?? ''));
    const total = active.reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
    return `Dữ liệu RFQ cục bộ: ${rfqs.length} yêu cầu, trong đó ${active.length} yêu cầu đang mở; tổng giá trị các RFQ đang mở là ${format(total)}. Đây là dữ liệu trình duyệt hiện tại, vui lòng đối chiếu với báo giá thực tế.`;
  }
  if (/crm|pipeline|cơ hội|khách hàng/.test(q)) {
    const value = crm.reduce((sum, item) => sum + (Number(item.dealValue) || 0), 0);
    const wins = crm.filter((item) => item.rating === 'Thành công').length;
    return `Dữ liệu CRM cục bộ: ${crm.length} cơ hội, pipeline ${format(value)}; ${wins} cơ hội được đánh dấu “Thành công”. Chưa có đồng bộ backend.`;
  }
  if (/cost|giá thành|giá bán|chi phí|margin|biên lợi nhuận/.test(q)) {
    const productType = /harness|bó dây|wire/.test(q) ? 'Wire harness' : /iot/.test(q) ? 'IoT' : 'BOM PCBA';
    const rows = costs[productType] ?? [];
    if (!rows.length) return `Chưa có chi phí lưu cho ${productType}. Mở Costing, cập nhật hoặc nhập bảng Excel để tính giá thành. Giá bán dựa trên công thức: giá thành sản xuất ÷ (1 − margin).`;
    const directCost = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitCost) || 0), 0);
    const settings = safeRead<{ overheadPercent?: number; marginPercent?: number }>('ai_sales_workspace_settings', {});
    const overheadRate = Number(settings.overheadPercent ?? 8) / 100;
    const marginRate = Math.min(Number(settings.marginPercent ?? 25), 99) / 100;
    const productionCost = directCost * (1 + overheadRate);
    const sellingPrice = productionCost / (1 - marginRate);
    return `${productType}: có ${rows.length} dòng chi phí. Vật tư & gia công ${format(directCost)}/SP; với chi phí chung ${Math.round(overheadRate * 100)}% và margin ${Math.round(marginRate * 100)}%, giá thành sản xuất ước tính ${format(productionCost)}/SP và giá bán gợi ý ${format(sellingPrice)}/SP. Kết quả phụ thuộc vào số liệu đã nhập; chưa bao gồm các khoản thuế/vận chuyển chưa khai báo.`;
  }
  if (/bom|linh kiện|vật tư/.test(q)) {
    const bom = safeRead<unknown[]>('ai_business_bom_data', []);
    const harness = safeRead<unknown[]>('ai_business_harness_data', []);
    return `Dữ liệu cục bộ hiện có ${bom.length} dòng BOM và ${harness.length} dòng Wiring Harness. Tôi không tra cứu được mã linh kiện, giá thị trường hay tồn kho trực tiếp. Hãy mở BOM AI / Harness AI và kiểm chứng với nhà cung cấp.`;
  }
  return 'Tôi chỉ có thể trả lời dựa trên dữ liệu lưu cục bộ và hướng dẫn quy trình. Bạn có thể hỏi: “Tóm tắt RFQ đang mở”, “Pipeline CRM hiện tại bao nhiêu?” hoặc “Tính giá Wire harness”. Đây không phải mô hình AI và không thay thế kiểm tra kỹ thuật / thương mại.';
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => safeRead<Message[]>('ai_sales_chat_history', [welcome]));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { try { localStorage.setItem('ai_sales_chat_history', JSON.stringify(messages.slice(-60))); } catch { /* Chat remains available for this session. */ } }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const send = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setMessages((current) => [...current, { role: 'user', text }]);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: 'assistant', text: localAnswer(text) }]);
      setSending(false);
    }, 180);
  };
  const clear = () => { setMessages([welcome]); try { localStorage.removeItem('ai_sales_chat_history'); } catch { /* Ignore storage errors. */ } };
  return <div className="assistant-page">
    <header className="assistant-heading"><div><div className="assistant-kicker"><i /> SALES ASSISTANT / LOCAL MODE</div><h1>Trợ lý kinh doanh</h1><p>Hỏi về dữ liệu workspace và tính giá dựa trên chi phí đã nhập.</p></div><button className="assistant-clear" onClick={clear}><RotateCcw size={13} /> Xóa hội thoại</button></header>
    <div className="assistant-disclaimer"><Sparkles size={15} /><span><strong>Chế độ prototype:</strong> câu trả lời được tạo bằng quy tắc tại trình duyệt, không gửi dữ liệu ra ngoài và không kết nối mô hình AI, web, nhà cung cấp hoặc tồn kho.</span></div>
    <section className="chat-panel" aria-label="Cuộc hội thoại">
      <div className="chat-header"><div className="chat-avatar"><Bot size={18} /></div><div><strong>AI Business Assistant</strong><small>Trợ lý dữ liệu cục bộ</small></div><span className="local-chip"><i /> LOCAL</span></div>
      <div className="chat-messages" aria-live="polite">{messages.map((message, index) => <div className={`chat-message-row ${message.role}`} key={`${index}-${message.role}`}>
        {message.role === 'assistant' && <span className="message-avatar"><Bot size={14} /></span>}
        <div className="message-bubble">{message.text}</div>
        {message.role === 'user' && <span className="message-avatar user"><UserRound size={14} /></span>}
      </div>)}{sending && <div className="chat-thinking">Đang xử lý câu hỏi…</div>}<div ref={bottomRef} /></div>
      <div className="quick-prompts"><span>Gợi ý:</span>{['Tóm tắt RFQ đang mở', 'Pipeline CRM hiện tại bao nhiêu?', 'Tính giá Wire harness'].map((prompt) => <button key={prompt} onClick={() => { setInput(prompt); }}>{prompt}</button>)}</div>
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Hỏi về Costing, CRM, RFQ hoặc BOM…" aria-label="Nhập câu hỏi" /><button type="submit" disabled={!input.trim() || sending}><Send size={15} /> Gửi</button></form>
    </section>
    <style>{`
      .assistant-page{max-width:1000px;margin:0 auto;padding:6px 12px;color:#17241f}.assistant-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;padding-bottom:20px;border-bottom:1px solid #e6ebe7}.assistant-kicker{font:9px 'DM Mono',monospace;letter-spacing:.1em;color:#849087}.assistant-kicker i,.local-chip i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ba878;margin-right:6px}.assistant-heading h1{font:700 28px 'Manrope',sans-serif;letter-spacing:-.04em;margin:12px 0 6px}.assistant-heading p{color:#7d8981;font-size:11px;margin:0}.assistant-clear{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #e2e8e3;border-radius:6px;background:white;color:#66736a;font-size:9px}.assistant-disclaimer{display:flex;align-items:flex-start;gap:9px;margin:14px 0;padding:11px 13px;border:1px solid #e6e9d9;border-radius:7px;background:#faf9f0;color:#777650;font-size:9px;line-height:1.6}.assistant-disclaimer svg{flex:0 0 auto;margin-top:1px}.assistant-disclaimer strong{color:#635f39}.chat-panel{display:flex;flex-direction:column;height:min(650px,calc(100vh - 260px));min-height:420px;overflow:hidden;background:white;border:1px solid #e3e9e4;border-radius:10px}.chat-header{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid #edf0ed}.chat-avatar,.message-avatar{width:30px;height:30px;display:grid;place-items:center;flex:0 0 auto;border-radius:8px;background:#eaf4ed;color:#37825a}.chat-header>div:nth-child(2){display:flex;flex-direction:column;gap:3px;flex:1}.chat-header strong{font-size:11px;color:#33443a}.chat-header small{font-size:9px;color:#8b968f}.local-chip{color:#43825c;background:#eef7f0;padding:4px 7px;border-radius:20px;font:8px 'DM Mono',monospace}.local-chip i{width:5px;height:5px;margin-right:4px}.chat-messages{flex:1;overflow:auto;padding:17px;background:#f8faf8}.chat-message-row{display:flex;align-items:flex-start;gap:8px;margin:0 0 13px}.chat-message-row.user{justify-content:flex-end}.message-avatar{width:25px;height:25px;background:white;border:1px solid #e7ece8;border-radius:50%;color:#58816a}.message-avatar.user{background:#e5f1e8}.message-bubble{max-width:min(76%,620px);border:1px solid #e7ece8;border-radius:2px 10px 10px 10px;padding:10px 12px;background:white;color:#435148;font-size:10px;line-height:1.7;white-space:pre-wrap}.user .message-bubble{border-color:#2b8058;border-radius:10px 2px 10px 10px;background:#2b8058;color:white}.chat-thinking{color:#88948c;font-size:9px;padding-left:34px}.quick-prompts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:9px 12px;border-top:1px solid #eef1ee}.quick-prompts>span{font-size:9px;color:#8d9890}.quick-prompts button{padding:5px 8px;border:1px solid #e5ebe6;border-radius:20px;background:white;color:#657269;font-size:8px}.quick-prompts button:hover{border-color:#9fc9ad;color:#31754e}.chat-composer{display:flex;gap:8px;padding:11px 12px;border-top:1px solid #edf0ed}.chat-composer input{flex:1;min-width:0;border:1px solid #e1e8e2;border-radius:7px;padding:10px 11px;outline:none;font-size:10px}.chat-composer input:focus{border-color:#5ba37b}.chat-composer button{display:flex;align-items:center;gap:6px;padding:0 13px;border:0;border-radius:7px;background:#237b57;color:white;font-size:10px;font-weight:600}.chat-composer button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:650px){.assistant-page{padding:0}.assistant-heading h1{font-size:24px}.assistant-heading{align-items:flex-start}.chat-panel{height:calc(100vh - 265px);min-height:400px}.quick-prompts{align-items:flex-start}.message-bubble{max-width:88%}.assistant-disclaimer{font-size:8px}}
    `}</style>
  </div>;
}
