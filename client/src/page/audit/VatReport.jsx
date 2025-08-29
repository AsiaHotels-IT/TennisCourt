import React, { useEffect, useState, useCallback } from "react";
import { getReservations, listCancelReservation } from "../../function/reservation";
import "./AuditSaleReport.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { printVatReportA4 } from './printVatReportA4';

// สำหรับ format วันที่ไทยแบบ วัน/เดือน/ปี+543
function formatDateThaiShort(dateStr) {
  if (!dateStr) return "";
  let date;
  // ISO datetime: 2025-08-05T05:54:29.471+00:00
  if (dateStr.includes('T')) {
    date = new Date(dateStr);
  } else if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split("/");
    date = new Date(year, month - 1, day);
  } else if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split("-");
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date)) return dateStr;
  const d = date.getDate().toString();
  const m = (date.getMonth() + 1).toString();
  const y = (date.getFullYear() + 543).toString();
  return `${d}/${m}/${y}`;
}

// --- ฟังก์ชันเปรียบเทียบเลขใบกำกับภาษีให้เรียงถูกต้อง --
// ถ้า receiptNumber มีตัวอักษร (เช่น AH0001) จะเรียงตามลำดับตัวเลขด้านหลัง
// แต่ถ้าเป็นเลขล้วนก็เรียงปกติ
function receiptNumberSort(a, b) {
  const getNum = (str) => {
    if (!str) return 0;
    const match = str.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  };
  const numA = getNum(a.receiptNumber);
  const numB = getNum(b.receiptNumber);
  // ถ้าเลขเท่ากัน ให้เรียงตาม receiptNumber string เพื่อป้องกันกรณี AH0001 กับ BH0001
  if (numA === numB) return (a.receiptNumber || "").localeCompare(b.receiptNumber || "");
  return numA - numB;
}

const VatReport = () => {
  const [reservation, setReservation] = useState([]);
  const [cancelReservation, setCancelReservation] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [selectedType, setSelectedType] = useState("booking");
  // กำหนดค่าเริ่มต้นเป็นเดือนนี้
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today);
  const [searchTerm, setSearchTerm] = useState(""); // สำหรับค้นหา
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res1 = await getReservations();
    const res2 = await listCancelReservation();
    setReservation(res1.data);
    setCancelReservation(res2.data);
  };

   const parseReceiptDate = (dateStr) => {
    if (!dateStr) return null;
    // ISO datetime: 2025-08-05T05:54:29.471+00:00
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    } else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split("/");
      return new Date(year, month - 1, day);
    } else if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split("-");
      return new Date(year, month - 1, day);
    } else {
      return new Date(dateStr);
    }
  };

  // Filter เฉพาะเดือนที่เลือกและมีบิลใบกำกับภาษี และไม่ใช่สถานะยกเลิก
  const filterData = useCallback((data) => {
    return data.filter((item) => {
      const date = parseReceiptDate(item.receiptDate);
      const hasReceiptNumber = item.receiptNumber && item.receiptNumber.trim() !== "";
      const notCancelled = item.status !== "ยกเลิก";
      if (!date || !hasReceiptNumber || !notCancelled) return false;
      if (selectedMonth) {
        return (
          date.getMonth() === selectedMonth.getMonth() &&
          date.getFullYear() === selectedMonth.getFullYear()
        );
      }
      return true;
    });
  }, [selectedMonth]);

  // เรียงเลขใบกำกับภาษีจากน้อยไปมาก (แบบใหม่)
  const sortByReceiptNumberAsc = arr => {
    return [...arr].sort(receiptNumberSort);
  };

  const filteredReservation = sortByReceiptNumberAsc(filterData(reservation));
  const filteredCancelReservation = sortByReceiptNumberAsc(filterData(cancelReservation));

  // --- สำหรับรายงาน A4 ---
  // 1. สรุปยอดเงินแต่ละวิธี
  const cashItems = filteredReservation.filter(item => item.paymentMethod === "เงินสด");
  const transferItems = filteredReservation.filter(item => item.paymentMethod === "โอนผ่านธนาคาร");
  const cardItems = filteredReservation.filter(item => item.paymentMethod === "เครดิตการ์ด");
  const totalCash = cashItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalTransfer = transferItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalCard = cardItems.reduce((sum, item) => sum + (item.price || 0), 0);

  // 2. จำนวน booking, cancel, รวมยอด
  const totalBookingCount = filteredReservation.length;
  const totalCancelCount = filteredCancelReservation.length;
  const totalBookingAmount = filteredReservation.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalCancelAmount = filteredCancelReservation.reduce((sum, item) => sum + (item.price || 0), 0);
  const netSales = totalBookingAmount;

  // 3. เตรียมแถวแสดงในตาราง (VAT)
  const VAT_RATE = 0.07;
  const reportRows = filteredReservation.map((item, i) => {
    const total = item.price || 0;
    const beforeVat = total / (1 + VAT_RATE);
    const vat = total - beforeVat;
    return {
      idx: i + 1,
      receiptDate: formatDateThaiShort(item.receiptDate),
      receiptNumber: item.receiptNumber || "",
      cusName: item.cusName,
      reservID: item.reservID || "",
      branch: item.branch || '',
      beforeVat: beforeVat ? beforeVat.toLocaleString(undefined, {minimumFractionDigits:2}) : '',
      vat: vat ? vat.toLocaleString(undefined, {minimumFractionDigits:2}) : '',
      total: total ? total.toLocaleString(undefined, {minimumFractionDigits:2}) : '',
    };
  }).filter(row => row.receiptNumber.trim() !== ""); // กรองเฉพาะแถวที่มีเลขใบกำกับภาษี

  // รวมยอด
  // ป้องกัน NaN: แปลง string ที่มี , เป็นตัวเลข
  const safeNumber = val => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "string") {
      const num = Number(val.replace(/,/g, ""));
      return isNaN(num) ? 0 : num;
    }
    return isNaN(Number(val)) ? 0 : Number(val);
  };
  const sumBeforeVatRaw = reportRows.reduce((sum, r) => sum + safeNumber(r.beforeVat), 0);
  const sumVatRaw = reportRows.reduce((sum, r) => sum + safeNumber(r.vat), 0);
  const sumTotalRaw = reportRows.reduce((sum, r) => sum + safeNumber(r.total), 0);
  const sumBeforeVat = Number(sumBeforeVatRaw).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  const sumVat = Number(sumVatRaw).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  const sumTotal = Number(sumTotalRaw).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

  // 4. เตรียมสรุปเงินสดย่อย (แบงค์/เหรียญ)
  const [cashSummaryRows, setCashSummaryRows] = useState([
    { denom: 1000, qty: '', total: '' },
    { denom: 500, qty: '', total: '' },
    { denom: 100, qty: '', total: '' },
    { denom: 50, qty: '', total: '' },
    { denom: 20, qty: '', total: '' },
    { denom: 10, qty: '', total: '' },
  ]);

  const handleCashQtyChange = (i, value) => {
    const qty = value.replace(/[^0-9]/g, '');
    setCashSummaryRows(rows => {
      const newRows = [...rows];
      const denom = Number(newRows[i].denom);
      newRows[i].qty = qty;
      newRows[i].total = qty ? (denom * Number(qty)).toLocaleString() : '';
      return newRows;
    });
  };
  const cashTotalSum = cashSummaryRows.reduce(
    (sum, row) => sum + (Number(row.denom) * Number(row.qty || 0)), 0
  );
  // --- END สำหรับรายงาน A4 ---

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const pagedRows = reportRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(reportRows.length / pageSize);

  // ฟังก์ชันแสดงผลแบบ A4
  const renderA4Report = () => (
    <div className="a4-report" style={{ width: "100vw", minHeight: "100vh", background: "#fff", color: "#000", margin: 0, padding: '32px 2vw 32px 2vw', boxSizing: 'border-box' }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>บริษัท เอเชียโฮเต็ล จำกัด (มหาชน)</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>รายงานภาษีขาย</div>
        <div style={{fontWeight:700,fontSize:18}}>เดือนภาษี {(() => {
              const thMonths = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
              ];
              return thMonths[selectedMonth.getMonth()];
            })()} ปี {selectedMonth.getFullYear() + 543}</div>
        <div style={{ marginTop: 8, fontSize: 15 }}>ชื่อผู้ประกอบการ บริษัท เอเชียโฮเต็ล จำกัด (มหาชน)</div>
        <div style={{ fontSize: 15 }}>ที่อยู่สถานประกอบการ 296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพฯ 10400</div>
        <div style={{ fontSize: 15 }}>เลขประจำตัวผู้เสียภาษี 0107535000346</div>
      </div>
      <table style={{ width: "100%", maxWidth: '100vw', borderCollapse: "collapse", marginBottom: 12, fontSize: 16 }}>
        <thead>
          <tr style={{ background: "#f3f3f3", borderBottom: "2px solid #555" }}>
            <th style={{ border: "1px solid #555" }}>ลำดับ</th>
            <th style={{ border: "1px solid #555" }}>วันที่</th>
            <th style={{ border: "1px solid #555" }}>เลขที่ใบกำกับภาษี</th>
            <th style={{ border: "1px solid #555" }}>ชื่อลูกค้า</th>
            <th style={{ border: "1px solid #555" }}>เลขประจำตัวผู้เสียภาษี</th>
            <th style={{ border: "1px solid #555" }}>สาขา</th>
            <th style={{ border: "1px solid #555" }}>มูลค่าก่อนภาษี</th>
            <th style={{ border: "1px solid #555" }}>ภาษีมูลค่าเพิ่ม</th>
            <th style={{ border: "1px solid #555" }}>รวมทั้งสิ้น</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, i) => {
            // ตรวจสอบสถานะและกำหนดสีพื้นหลัง
            const highlight = row.status && row.status === "ยกเลิก" ? { backgroundColor: "#f8d7da" } : {};
            return (
              <tr key={i} style={highlight}>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.idx}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptDate}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptNumber}</td>
                <td style={{ border: "1px solid #bbb" }}>{row.cusName}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{'-'}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.branch}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{
                  isNaN(Number(row.beforeVat.replace(/,/g, '')))
                    ? '0.00'
                    : Number(row.beforeVat.replace(/,/g, '')).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})
                }</td>
                <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{
                  isNaN(Number(row.vat.replace(/,/g, '')))
                    ? '0.00'
                    : Number(row.vat.replace(/,/g, '')).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})
                }</td>
                <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.total}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f7f5ee" }}>
            <td colSpan={6} style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>รวมทั้งสิ้น</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{sumBeforeVat.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{sumVat.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{sumTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>
      {/* Pagination controls */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 18px', borderRadius: '20px', border: 'none', background: '#d7ba80', color: '#65000a', fontSize: 16, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>ก่อนหน้า</button>
        <span>หน้า {page} / {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 18px', borderRadius: '20px', border: 'none', background: '#d7ba80', color: '#65000a', fontSize: 16, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>ถัดไป</button>
      </div>
    </div>
  );

  return (
    <div className="sale-report">
      <div className="page-header" >
        <h1>รายงานยอดขาย</h1>
        <button onClick={() => navigate(-1)} 
        style={{
          padding: '6px 18px',
          fontSize: '18px',
          color: '#65000a',
          backgroundColor: '#d7ba80',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
          userSelect: 'none',
          height: '40px',
          fontFamily: 'Calibri, sans-serif',
        }}>กลับไปหน้าหลัก</button>
      </div>

      <div className="date-filter" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <label>เลือกเดือน: </label>
        <DatePicker
          selected={selectedMonth}
          onChange={date => { setSelectedMonth(date); setPage(1); }}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          placeholderText="เลือกเดือนที่ต้องการดูยอดขาย"
        />
        <button
          style={{
            padding: '6px 18px',
            fontSize: '16px',
            color: '#65000a',
            backgroundColor: '#d7ba80',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            userSelect: 'none',
            height: '40px',
            fontFamily: 'Calibri, sans-serif',
          }}
          onClick={() => {
            printVatReportA4({
              saleDate: reportRows[0] ? reportRows[0].receiptDate : "-",
              reportRows,
              totalBookingAmount,
              totalCash,
              totalTransfer,
              totalCard,
              cashSummaryRows,
              cashTotalSum,
            });
          }}
        >พิมพ์รายงาน</button>
      </div>

      {/* --- ส่วนแสดงรายงานสำหรับ A4 --- */}
      <div className="print-a4-area" style={{ margin: "18px 0" }}>
        {renderA4Report()}
      </div>
      {/* --- END --- */}
    </div>
  );
};

export default VatReport;