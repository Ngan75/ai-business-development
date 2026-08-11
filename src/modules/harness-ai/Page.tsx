import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function HarnessPage() {
  const [harnessList, setHarnessList] = useState<any[]>(() => {
    const saved = localStorage.getItem('ai_business_harness_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [columns, setColumns] = useState<string[]>(() => {
    const savedCols = localStorage.getItem('ai_business_harness_columns');
    return savedCols ? JSON.parse(savedCols) : [];
  });

  // Lưu trữ độ rộng động từng cột (px)
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => {
    const savedWidths = localStorage.getItem('ai_business_harness_widths');
    return savedWidths ? JSON.parse(savedWidths) : {};
  });

  const [isDragging, setIsDragging] = useState(false);
  const resizingColumnRef = useRef<{ name: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('ai_business_harness_data', JSON.stringify(harnessList));
    localStorage.setItem('ai_business_harness_columns', JSON.stringify(columns));
    localStorage.setItem('ai_business_harness_widths', JSON.stringify(columnWidths));
  }, [harnessList, columns, columnWidths]);

  // Hàm tính độ rộng động khởi tạo dựa trên độ dài nội dung thực tế trong từng cột
  const calculateAutoWidths = (headers: string[], dataRows: any[]) => {
    const widths: { [key: string]: number } = {};

    headers.forEach((col) => {
      // Tìm độ dài chuỗi lớn nhất giữa Tên tiêu đề và Dữ liệu trong cột
      let maxLength = String(col || '').length;

      dataRows.forEach((row) => {
        const cellValue = String(row[col] || '');
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });

      // Quy đổi độ dài ký tự sang Pixels (khoảng 8.5px/ký tự + 28px padding)
      const calculatedPx = Math.min(Math.max(maxLength * 8.5 + 28, 65), 350);
      widths[col] = Math.round(calculatedPx);
    });

    setColumnWidths(widths);
  };

  // Nạp File Excel
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rawRows.length === 0) return;

      // Tìm dòng tiêu đề (Header row)
      let headerIndex = -1;
      for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
        const rowStr = rawRows[i].map((c: any) => String(c).toLowerCase()).join(' ');
        if (
          rowStr.includes('part name') ||
          rowStr.includes('spec') ||
          rowStr.includes('model') ||
          rowStr.includes('vender') ||
          rowStr.includes('no')
        ) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) headerIndex = 0;

      const headers = rawRows[headerIndex].map((h: any, idx: number) => {
        const trimmed = String(h).trim();
        return trimmed !== '' ? trimmed : `Cột ${idx + 1}`;
      });

      setColumns(headers);

      // Phân tích dữ liệu dòng
      const parsedData: any[] = [];
      let currentModel = '';

      for (let i = headerIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowText = row.join('').toLowerCase();
        if (!rowText || rowText.includes('total') || rowText.includes('demand:')) continue;

        const rowObj: any = {};
        let hasData = false;

        headers.forEach((h: string, colIdx: number) => {
          const val = row[colIdx] !== undefined ? row[colIdx] : '';
          rowObj[h] = val;
          if (val !== '') hasData = true;
        });

        // Điền lại Model nếu bị Merge cells
        const modelKey = headers.find((h) => h.toLowerCase().includes('model'));
        if (modelKey && rowObj[modelKey]) currentModel = rowObj[modelKey];
        else if (modelKey) rowObj[modelKey] = currentModel;

        if (hasData) {
          parsedData.push(rowObj);
        }
      }

      setHarnessList(parsedData);
      calculateAutoWidths(headers, parsedData);
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

  // Sự kiện kéo ranh giới cột để thay đổi kích thước thủ công
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
    const newWidth = Math.max(50, startWidth + diff);
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

  // Drag & Drop
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

  const totalWires = harnessList.filter((item) => {
    const partName = String(item['PART NAME'] || item['Part Name'] || '').toUpperCase();
    return partName.includes('WIRE') || partName.includes('CABLE');
  }).length;

  const totalConnectors = harnessList.filter((item) => {
    const partName = String(item['PART NAME'] || item['Part Name'] || '').toUpperCase();
    return partName.includes('HOUSING') || partName.includes('CONNECTOR');
  }).length;

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3 border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Harness AI - Thiết kế & Báo giá Bó dây điện</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tải lên danh sách bóc tách vật tư (Wiring Harness BOM) để AI phân tích bấm dây, vật tư và chi phí.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
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
          Kéo thả bản vẽ dây cáp/BOM Wiring Harness (.xlsx, .csv) vào đây hoặc bấm để chọn file
        </div>
        <div className="text-slate-400 text-[11px] mt-0.5">
          Hỗ trợ nhận diện tự động connector Molex, JST, TE Connectivity, Hisense...
        </div>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
      </label>

      {/* Cards Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-sky-50/40 border border-sky-100 rounded-lg">
          <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">TỔNG SỐ DÂY DẪN (WIRES)</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">
            {totalWires} <span className="text-xs font-normal text-slate-500">sợi</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">SỐ LƯỢNG HOUSING / CONNECTOR</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">
            {totalConnectors} <span className="text-xs font-normal text-slate-500">loại</span>
          </div>
        </div>

        <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-lg">
          <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">TỔNG VẬT TƯ BÓC TÁCH</div>
          <div className="text-lg font-bold text-purple-800 mt-0.5">
            {harnessList.length} <span className="text-xs font-normal text-slate-500">dòng</span>
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Tự Động Co Giãn & Căn Chỉnh Kích Thước Cột */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 text-xs">
            Chi tiết vật tư Bó dây điện ({harnessList.length} vật tư)
          </h2>
        </div>

        <div className="max-h-[580px] overflow-auto">
          <table className="text-left text-[11px] text-slate-700 border-collapse min-w-full">
            <thead className="bg-amber-100 text-slate-900 font-bold border-b border-slate-300 sticky top-0 z-10 shadow-sm">
              <tr>
                {columns.map((col, idx) => {
                  const width = columnWidths[col] || 120;
                  return (
                    <th
                      key={idx}
                      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                      className="px-2 py-2 border-r border-slate-300/80 last:border-r-0 align-middle text-center bg-amber-100 relative group"
                    >
                      <div className="truncate font-bold px-1" title={col}>
                        {col}
                      </div>

                      {/* Thanh kéo kích thước cột (Resizer) */}
                      <div
                        onMouseDown={(e) => handleMouseDownResize(col, e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-amber-500/50 group-hover:bg-amber-400/40 transition"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {harnessList.length > 0 ? (
                harnessList.map((row, rIdx) => {
                  const partName = String(row['PART NAME'] || row['Part Name'] || '').toUpperCase();
                  const isWire = partName.includes('WIRE') || partName.includes('CABLE');

                  return (
                    <tr
                      key={rIdx}
                      className={`transition ${isWire ? 'bg-emerald-50/60 hover:bg-emerald-100/50' : 'hover:bg-sky-50/40'}`}
                    >
                      {columns.map((col, cIdx) => {
                        const width = columnWidths[col] || 120;
                        return (
                          <td
                            key={cIdx}
                            style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                            className="px-2 py-1.5 border-r border-slate-100 last:border-r-0 align-middle truncate"
                            title={row[col] !== undefined ? String(row[col]) : ''}
                          >
                            {row[col] !== undefined ? String(row[col]) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length || 1} className="p-8 text-center text-slate-400">
                    Chưa có dữ liệu Wiring Harness. Hãy kéo thả file Excel từ hình ảnh của bạn vào đây.
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