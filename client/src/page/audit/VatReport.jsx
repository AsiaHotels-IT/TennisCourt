import React, { useEffect, useState, useCallback } from "react";
import { getReservations, listCancelReservation } from "../../function/reservation";
import "./AuditSaleReport.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { printVatReportA4 } from './printVatReportA4';

// สำหรับ format วันที่ไทยแบบ 7/31/2568
function formatDateThaiShort(dateStr) {
  if (!dateStr) return "";
  // รองรับทั้งแบบ DD/MM/YYYY และ YYYY-MM-DD
  let date;
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split("/");
    date = new Date(year, month - 1, day);
  } else if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split("-");
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date)) return dateStr;
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear() + 543}`;
}

const VatReport = () => {
  const [reservation, setReservation] = useState([]);
  const [cancelReservation, setCancelReservation] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [selectedType, setSelectedType] = useState("booking");
  // กำหนดค่าเริ่มต้นเป็นวันนี้
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
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

  const parseDate = (dateStr) => {
    try {
      if (!dateStr) return null;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split("/");
        return new Date(year, month - 1, day);
      } else if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split("-");
        return new Date(year, month - 1, day);
      } else {
        return new Date(dateStr);
      }
    } catch {
      return null;
    }
  };

  const sortByReservDateDesc = arr => {
    return [...arr].sort((a, b) => {
      const dateA = parseDate(a.reservDate);
      const dateB = parseDate(b.reservDate);
      // ถ้าไม่มีวันที่ให้ถือว่าเก่ากว่า
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA; // ล่าสุดอยู่บน
    });
  };

  const filterData = useCallback((data) => {
    return data.filter((item) => {
      const date = parseDate(item.reservDate);
      if (!date) return false;
      if (selectedDate) {
        // เปรียบเทียบแค่วัน เดือน ปี
        return (
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()
        );
      }
      return true;
    });
  }, [selectedDate]);

  const filteredReservation = sortByReservDateDesc(filterData(reservation));
  const filteredCancelReservation = sortByReservDateDesc(filterData(cancelReservation));

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
      reservDate: formatDateThaiShort(item.reservDate),
      receiptNumber: item.receiptNumber || "",
      cusName: item.cusName,
      reservID: item.reservID || "",
      branch: item.branch || '',
      beforeVat: beforeVat ? beforeVat.toFixed(2) : '',
      vat: vat ? vat.toFixed(2) : '',
      total: total ? total.toFixed(2) : '',
    };
  });

  // รวมยอด
  const sumBeforeVat = reportRows.reduce((sum, r) => sum + Number(r.beforeVat || 0), 0);
  const sumVat = reportRows.reduce((sum, r) => sum + Number(r.vat || 0), 0);
  const sumTotal = reportRows.reduce((sum, r) => sum + Number(r.total || 0), 0);

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
              return thMonths[new Date().getMonth()];
            })()} ปี {new Date().getFullYear() + 543}</div>
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
            <th style={{ border: "1px solid #555" }}>เลขประจำตัวผู้เสีย</th>
            <th style={{ border: "1px solid #555" }}>สาขา</th>
            <th style={{ border: "1px solid #555" }}>มูลค่าก่อนภาษี</th>
            <th style={{ border: "1px solid #555" }}>ภาษีมูลค่าเพิ่ม</th>
            <th style={{ border: "1px solid #555" }}>รวมทั้งสิ้น</th>
          </tr>
        </thead>
        <tbody>
          {reportRows.map((row, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.idx}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.reservDate}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptNumber}</td>
              <td style={{ border: "1px solid #bbb" }}>{row.cusName}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{'-'}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.branch}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.beforeVat}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.vat}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.total}</td>
            </tr>
          ))}
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
        <label>เลือกวันที่: </label>
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="เลือกวันที่ต้องการดูยอดขาย"
          isClearable
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
              saleDate: filteredReservation[0] ? formatDateThaiShort(filteredReservation[0].reservDate) : "-",
              reportRows,
              totalBookingAmount,
              totalCash,
              totalTransfer,
              totalCard,
              cashSummaryRows, // ส่งเป็น state อันนี้!
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