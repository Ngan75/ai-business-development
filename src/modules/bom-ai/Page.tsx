import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function BOMPage() {
  const [bomData, setBomData] = useState<any[]>(() => {
    const saved = localStorage.getItem('ai_business_bom_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [columns, setColumns] = useState<string[]>(() => {
    const savedCols = localStorage.getItem('ai_business_bom_columns');
    return savedCols ? JSON.parse(savedCols) : [];
  });

  // Lưu trữ độ rộng của từng cột (đơn vị pixel)
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  
  // Chiều cao dòng (padding)
  const [rowPadding, setRowPadding] = useState<number>(6);

  const [isDragging, setIsDragging] = useState(false);
  const resizingColumnRef = useRef<{ name: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('ai_business_bom_data', JSON.stringify(bomData));
    localStorage.setItem('ai_business_bom_columns', JSON.stringify(columns));
  }, [bomData, columns]);

  // Thiết lập độ rộng mặc định thông minh dựa trên độ dài tên cột khi nạp file
  const initColumnWidths = (cols: string[]) => {
    const initialWidths: { [key: string]: number } = {};
    cols.forEach((col) => {
      const len = col.length;
      if (len < 5) initialWidths[col] = 70;
      else if (len < 12) initialWidths[col] = 120;
      else if (len < 20) initialWidths[col] = 180;
      else initialWidths[col] = 250;
    });
    setColumnWidths(initialWidths);
  };

  // Nạp file Excel
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rawRows.length === 0) return;

      let headerIndex = -1;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const rowStr = rawRows[i].map((c: any) => String(c).toLowerCase()).join(' ');
        if (
          rowStr.includes('scode') ||
          rowStr.includes('description') ||
          rowStr.includes('name') ||
          rowStr.includes('qty') ||
          rowStr.includes('material')
        ) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) headerIndex = 0;

      const headers = rawRows[headerIndex].map((h: any) => String(h).trim()).filter((h: string) => h !== '');
      setColumns(headers);
      initColumnWidths(headers);

      const parsedData: any[] = [];
      for (let i = headerIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowText = row.join('').toLowerCase();
        if (!rowText || rowText.includes('total') || rowText.includes('tổng cộng')) continue;

        const rowObj: any = {};
        let hasData = false;
        headers.forEach((h: string, colIdx: number) => {
          const val = row[colIdx] !== undefined ? row[colIdx] : '';
          rowObj[h] = val;
          if (val !== '') hasData = true;
        });

        if (hasData) {
          parsedData.push(rowObj);
        }
      }

      setBomData(parsedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
      e.target.value = '';
    }
  };

  // Drag & Drop File
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processExcelFile(file);
  };

  // Xử lý sự kiện kéo gian ranh giới cột (Column Resize)
  const handleMouseDownResize = (colName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentWidth = columnWidths[colName] || 120;
    resizingColumnRef.current = {
      name: colName,
      startX: e.clientX,
      startWidth: currentWidth,
    };

    document.addEventListener('mousemove', handleMouseMoveResize);
    document.addEventListener('mouseup', handleMouseUpResize);
  };

  const handleMouseMoveResize = (e: MouseEvent) => {
    if (!resizingColumnRef.current) return;
    const { name, startX, startWidth } = resizingColumnRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // Chiều rộng tối thiểu 50px
    setColumnWidths((prev) => ({
      ...prev,
      [name]: newWidth,
    }));
  };

  const handleMouseUpResize = () => {
    resizingColumnRef.current = null;
    document.removeEventListener('mousemove', handleMouseMoveResize);
    document.removeEventListener('mouseup', handleMouseUpResize);
  };

  const exportToExcel = () => {
    if (bomData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(bomData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM_Export');
    XLSX.writeFile(workbook, 'BOM_Boc_Tach_Export.xlsx');
  };

  const getTotalQty = () => {
    return bomData.reduce((sum, row) => {
      const qtyKey = Object.keys(row).find((k) => k.toLowerCase().includes('qty') || k.toLowerCase().includes('số lượng'));
      const val = qtyKey ? parseFloat(row[qtyKey]) || 0 : 0;
      return sum + val;
    }, 0);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header & Xuất file */}
      <div className="flex justify-between items-center border-b pb-3 border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">BOM AI - Phân tích & Tối ưu hóa BOM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Tải lên danh sách linh kiện (BOM) để AI tự động kiểm tra giá, tồn kho và gợi ý tối ưu chi phí.</p>
        </div>

        <button
          onClick={exportToExcel}
          className="bg-sky-600 text-white px-3 py-1.5 text-xs rounded-lg font-medium hover:bg-sky-700 transition shadow-sm flex items-center gap-1.5"
        >
          <span>📥 Xuất báo cáo BOM (.xlsx)</span>
        </button>
      </div>

      {/* Upload Area */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-3 text-center block cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/50 scale-[1.005]'
            : 'border-sky-300 bg-sky-50/20 hover:border-sky-400 hover:bg-sky-50/40'
        }`}
      >
        <div className="text-sky-600 font-semibold text-xs">
          Kéo thả file BOM (.xlsx, .csv) vào đây hoặc bấm để chọn file
        </div>
        <div className="text-slate-400 text-[11px] mt-0.5">
          Hỗ trợ các định dạng tiêu chuẩn từ Altium, Eagle, OrCAD, Excel...
        </div>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {/* Cards Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-sky-50/40 border border-sky-100 rounded-lg">
          <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">TỔNG SỐ LOẠI LINH KIỆN</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">
            {bomData.length} <span className="text-xs font-normal text-slate-500">loại</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">TỔNG SỐ LƯỢNG (QTY)</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">
            {getTotalQty().toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">PCS</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-lg">
          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">CẢNH BÁO RỦI RO CHUỖI CUNG ỨNG</div>
          <div className="text-lg font-bold text-amber-800 mt-0.5">
            0 Linh kiện khan hiếm
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Chuyên Nghiệp */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Thanh công cụ điều chỉnh độ cao dòng */}
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <h2 className="font-semibold text-slate-800">
            Danh sách linh kiện bóc tách ({bomData.length} loại)
          </h2>

          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
            <span>Độ cao dòng:</span>
            <input
              type="range"
              min="3"
              max="16"
              value={rowPadding}
              onChange={(e) => setRowPadding(Number(e.target.value))}
              className="w-24 accent-sky-600 cursor-pointer"
            />
            <span className="w-6 text-right font-semibold">{rowPadding}px</span>
          </div>
        </div>

        {/* Khung cuộn đa hướng (Ngang & Dọc) */}
        <div className="max-h-[580px] overflow-auto relative">
          <table className="text-left text-xs text-slate-700 border-collapse min-w-full">
            {/* Tiêu đề cố định khi cuộn dọc */}
            <thead className="bg-emerald-100 text-slate-900 font-bold border-b border-slate-300 sticky top-0 z-20 shadow-sm">
              <tr>
                {columns.map((col, idx) => {
                  const width = columnWidths[col] || 130;
                  return (
                    <th
                      key={idx}
                      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                      className="px-2 py-2.5 border-r border-slate-300/80 last:border-r-0 align-middle text-center bg-emerald-100 relative group"
                    >
                      {/* Tên tiêu đề chữ nằm ngang không bị ép vỡ */}
                      <div className="truncate font-bold px-1" title={col}>
                        {col}
                      </div>

                      {/* Thanh kéo kích thước cột (Column Resizer Handle) */}
                      <div
                        onMouseDown={(e) => handleMouseDownResize(col, e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-sky-500/50 group-hover:bg-sky-400/30 transition"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bomData.length > 0 ? (
                bomData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-sky-50/40 transition">
                    {columns.map((col, cIdx) => {
                      const width = columnWidths[col] || 130;
                      return (
                        <td
                          key={cIdx}
                          style={{
                            width: `${width}px`,
                            minWidth: `${width}px`,
                            maxWidth: `${width}px`,
                            paddingTop: `${rowPadding}px`,
                            paddingBottom: `${rowPadding}px`,
                          }}
                          className="px-2 border-r border-slate-100 last:border-r-0 align-middle truncate"
                          title={row[col] !== undefined ? String(row[col]) : ''}
                        >
                          {row[col] !== undefined ? String(row[col]) : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length || 1} className="p-8 text-center text-slate-400">
                    Chưa có dữ liệu BOM. Hãy <b>kéo thả file Excel</b> hoặc <b>bấm vào khung phía trên</b> để tải file lên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}