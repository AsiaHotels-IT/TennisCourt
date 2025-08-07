import React, { useEffect, useState, useCallback } from "react";
import { getReservations, listCancelReservation } from "../../function/reservation";
import "./AuditSaleReport.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { printSaleReportA4 } from './printSaleReportA4';

// สำหรับ format วันที่ไทยแบบ 7/31/2568
function formatDateThaiShort(dateStr) {
  if (!dateStr) return "";
  let date;
  // รองรับ timestamp เช่น 2025-08-05T05:56:43.500+00:00
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
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear() + 543}`;
}

const AuditSaleReport = () => {
  const [reservation, setReservation] = useState([]);
  const [cancelReservation, setCancelReservation] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [selectedType, setSelectedType] = useState("booking");
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState("");
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
    } catch {
      return null;
    }
  };

  // เรียงข้อมูลโดย receiptDate > receiptNumber จากน้อยไปมาก
  const sortByReceiptDateAndNumberAsc = arr => {
    return [...arr].sort((a, b) => {
      const dateA = parseDate(a.receiptDate);
      const dateB = parseDate(b.receiptDate);
      // ถ้าไม่มีวันที่ให้ถือว่าเก่ากว่า
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB; // วันก่อนอยู่บน
      }
      // ถ้า receiptDate เท่ากัน ให้เรียงเลขที่ใบเสร็จจากน้อยไปมาก (เลขที่เป็น string หรือ number ก็ได้)
      const numA = a.receiptNumber ? Number(a.receiptNumber) : 0;
      const numB = b.receiptNumber ? Number(b.receiptNumber) : 0;
      return numA - numB;
    });
  };

  const filterData = useCallback((data) => {
    return data.filter((item) => {
      const date = parseDate(item.receiptDate);
      if (!date) return false;
      if (selectedDate) {
        return (
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()
        );
      }
      return true;
    });
  }, [selectedDate]);

  const filteredReservation = sortByReceiptDateAndNumberAsc(filterData(reservation));
  const filteredCancelReservation = sortByReceiptDateAndNumberAsc(filterData(cancelReservation));

  // --- สำหรับรายงาน A4 ---
  const cashItems = filteredReservation.filter(item => item.paymentMethod === "เงินสด");
  const transferItems = filteredReservation.filter(item => item.paymentMethod === "โอนผ่านธนาคาร");
  const cardItems = filteredReservation.filter(item => item.paymentMethod === "เครดิตการ์ด");
  const totalCash = cashItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalTransfer = transferItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalCard = cardItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const totalBookingCount = filteredReservation.length;
  const totalCancelCount = filteredCancelReservation.length;
  const totalBookingAmount = filteredReservation.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalCancelAmount = filteredCancelReservation.reduce((sum, item) => sum + (item.price || 0), 0);
  const netSales = totalBookingAmount;

  // เตรียมแถวแสดงในตาราง (เรียงตามลำดับที่หลังจาก sort)
  const reportRows = filteredReservation.map((item, i) => ({
    idx: i + 1,
    reservDate: item.reservDate ? formatDateThaiShort(item.reservDate) : "",
    receiptDate: item.receiptDate ? formatDateThaiShort(item.receiptDate) : "",
    receiptNumber: item.receiptNumber || "",
    cusName: item.cusName,
    cusTel: item.cusTel,
    reservID: item.reservID || "",
    bookDate: item.bookDate ? formatDateThaiShort(item.bookDate) : "",
    time: `${item.startTime || ""}-${item.endTime || ""}`,
    hour: item.hour || "",
    price: item.price ? item.price.toLocaleString() : "",
    cash: item.paymentMethod === "เงินสด" ? (item.price ? item.price.toLocaleString() : "") : "",
    transfer: item.paymentMethod === "โอนผ่านธนาคาร" ? (item.price ? item.price.toLocaleString() : "") : "",
    card: item.paymentMethod === "เครดิตการ์ด" ? (item.price ? item.price.toLocaleString() : "") : ""
  }));

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

  const renderA4Report = () => (
    <div className="a4-report" style={{ width: "100vw", minHeight: "100vh", background: "#fff", color: "#000", margin: 0, padding: '32px 2vw 32px 2vw', boxSizing: 'border-box' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: 700 }}>รายงานการขายเทนนิส ประจำวันที่</h2>
        <span style={{ fontSize: 18 }}>
          {filteredReservation[0] && filteredReservation[0].receiptDate ? (() => {
            const dateStr = filteredReservation[0].receiptDate;
            let date;
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
            const y = (date.getFullYear()+543).toString();
            return `${d}/${m}/${y}`;
          })() : "-"}
        </span>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 12 }}>
          <span>7.00-18.00 &nbsp;&nbsp;&nbsp;&nbsp; 450/ชม.</span>
          <span style={{background: "#dcedc8"}}>18.00-22.00 &nbsp;&nbsp; 600/ชม.</span>
        </div>
      </div>
      
      <table style={{ width: "100%", maxWidth: '100vw', borderCollapse: "collapse", marginBottom: 12, fontSize: 16 }}>
        <thead>
          <tr style={{ background: "#f3f3f3", borderBottom: "2px solid #555" }}>
            <th style={{ border: "1px solid #555" }}>ลำดับ</th>
            <th style={{ border: "1px solid #555" }}>วันที่ใบเสร็จ</th>
            <th style={{ border: "1px solid #555" }}>เลขที่ใบเสร็จ</th>
            <th style={{ border: "1px solid #555" }}>ชื่อลูกค้า</th>
            <th style={{ border: "1px solid #555" }}>เบอร์โทร</th>
            <th style={{ border: "1px solid #555" }}>เลขใบจอง</th>
            <th style={{ border: "1px solid #555" }}>วันที่จอง</th>
            <th style={{ border: "1px solid #555" }}>เวลาจอง</th>
            <th style={{ border: "1px solid #555" }}>ชั่วโมงจอง</th>
            <th style={{ border: "1px solid #555" }}>จำนวนเงิน</th>
            <th style={{ border: "1px solid #555" }}>เงินสด</th>
            <th style={{ border: "1px solid #555" }}>เงินโอน</th>
            <th style={{ border: "1px solid #555" }}>เครดิตการ์ด</th>
          </tr>
        </thead>
        <tbody>
          {reportRows.map((row, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.idx}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptDate || "-"}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptNumber}</td>
              <td style={{ border: "1px solid #bbb" }}>{row.cusName}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.cusTel}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.reservID}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.reservDate || "-"}</td>
              <td
                style={{
                  border: "1px solid #bbb",
                  textAlign: "center",
                  background:
                    (() => {
                      if (row.time && row.time.includes("-")) {
                        const [start] = row.time.split("-");
                        if (start && start.includes(":")) {
                          const [h, m] = start.split(":").map(Number);
                          if (h > 18 || (h === 18 && m > 0)) return "#dcedc8";
                        } else if (start) {
                          const h = Number(start);
                          if (h > 18) return "#dcedc8";
                        }
                      }
                      return undefined;
                    })()
                }}
              >
                {row.time && row.time !== '-' ? row.time : '-'}
              </td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>
                {row.hour
                  ? `${row.hour % 1 === 0 ? row.hour : Number(row.hour).toFixed(2)} ชั่วโมง`
                  : (() => {
                      if (row.time && row.time.includes("-")) {
                        const [start, end] = row.time.split("-");
                        if (start && end) {
                          const [startH, startM] = start.split(":").map(Number);
                          const [endH, endM] = end.split(":").map(Number);
                          let hours = endH + endM/60 - (startH + startM/60);
                          return `${hours % 1 === 0 ? hours : hours.toFixed(2)}`;
                        }
                      }
                      return "-";
                    })()
                }
              </td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.price}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.cash}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.transfer}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "right", paddingRight: 8 }}>{row.card}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f7f5ee" }}>
            <td colSpan={9} style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>รวมทั้งสิ้น</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{totalBookingAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{totalCash ? totalCash.toLocaleString(undefined, {minimumFractionDigits:2}) : ""}</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{totalTransfer ? totalTransfer.toLocaleString(undefined, {minimumFractionDigits:2}) : ""}</td>
            <td style={{ textAlign: "right", fontWeight: "bold", paddingRight: 8, border: "1px solid #bbb" }}>{totalCard ? totalCard.toLocaleString(undefined, {minimumFractionDigits:2}) : ""}</td>
          </tr>
        </tfoot>
      </table>
      
      {/* สรุปการนำส่งเงินสด */}
      <div style={{flex: 1}}>
      <div style={{ display: "flex", flexDirection: "row",justifyContent: "space-between",  width: "50%",}}>
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>สรุปการนำส่งเงินสด</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 , borderTop: "1px solid #000", borderBottom: "2px double #000" }}>
          <span style={{ fontWeight: "bold", background: "#f7f0cd", padding: "2px 14px", borderRadius: 2 }}>{totalCash.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
        </div>
      </div>
      <table style={{ width: "50%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #bbb" }}>แบงค์/เหรียญ</th>
            <th style={{ border: "1px solid #bbb" }}>จำนวน</th>
            <th style={{ border: "1px solid #bbb" }}>รวมเป็นเงิน</th>
          </tr>
        </thead>
        <tbody>
          {cashSummaryRows.map((row, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.denom}</td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>
                {row.qty}
              </td>
              <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.total}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ textAlign: "center", fontWeight: "bold", border: "1px solid #bbb" }}>
              รวมเงินสดที่นำส่ง
            </td>
            <td style={{ border: "1px solid #bbb", background: "#f7f0cd", textAlign: "center" }}>
              
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <div style={{flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end"}}>
          <div style={{ marginTop: 30, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "50%"  }}>
              <span>ลงชื่อผู้นำส่งเงิน</span>
              <span>_________________________________________</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "50%",marginTop: 30,  }}>
              <span>ลงชื่อผู้รับเงิน</span>
              <span>_________________________________________</span>
            </div>
          </div>
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
            printSaleReportA4({
              saleDate: filteredReservation[0] ? filteredReservation[0].receiptDate : "-",
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

export default AuditSaleReport;