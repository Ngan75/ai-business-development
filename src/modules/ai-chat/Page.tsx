import { useState } from 'react';

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Xin chào! Tôi là Trợ lý AI Business. Tôi có thể giúp gì cho bạn về tối ưu BOM, tra cứu linh kiện hay tư vấn thiết kế PCB/Harness?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    const currentInput = input;
    setInput('');

    // Phản hồi giả lập từ AI
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          text: `Tôi đã nhận được câu hỏi về "${currentInput}". Hệ thống đang phân tích dữ liệu thị trường và thông số kỹ thuật. Bạn có cần tôi xuất danh sách linh kiện tương đương không?` 
        }
      ]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header Chat */}
      <div className="p-4 bg-slate-900 text-white font-semibold border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h2 className="text-sm font-bold">AI Business Assistant</h2>
            <p className="text-xs text-slate-400 font-normal">Sẵn sàng hỗ trợ phân tích kỹ thuật & báo giá</p>
          </div>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">Online</span>
      </div>

      {/* Khung tin nhắn */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-sky-600 text-white rounded-br-none shadow-sm' 
                : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Khung nhập liệu */}
      <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập câu hỏi hoặc yêu cầu cho AI (ví dụ: Tìm linh kiện thay thế cho STM32F407)..."
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button 
          onClick={handleSend}
          className="bg-sky-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}