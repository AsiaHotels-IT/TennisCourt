import React, { useEffect, useState, useCallback } from "react";
import { getReservations, listCancelReservation } from "../function/reservation";
import "./SaleReport.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { printSaleReportA4 } from '../page/audit/printSaleReportA4';
import * as XLSX from "xlsx"; 

function formatDateThaiShort(dateStr) {
  if (!dateStr) return "";
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
  // แสดงวันที่ปกติ (local) แต่ปีเป็น พ.ศ.
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear() + 543}`;
}

// สำหรับ format วันที่ไทยแบบ 7/31/2568
function formatDateThaiWithTime(dateStr) {
  if (!dateStr) return "";
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
  // get UTC time, not local time
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  const y = date.getUTCFullYear() + 543;
  const hh = date.getUTCHours().toString().padStart(2, "0");
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  // ถ้ามีเวลา: แสดงด้วย
  return `${d}/${m}/${y}`;
}

const SaleReport = () => {
  const [reservation, setReservation] = useState([]);
    const [cancelReservation, setCancelReservation] = useState([]);
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const navigate = useNavigate();
  
    useEffect(() => {
      fetchData();
    }, []);
  
    const fetchData = async () => {
      const res1 = await getReservations();
      const res2 = await listCancelReservation();
      setReservation(res1.data ?? []);
      setCancelReservation(res2.data ?? []);
    };
  
    // parseDate รองรับ receiptDate เป็น ISO string
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
  
    // Sort by receiptDate, then receiptNumber (จากน้อยไปมาก)
    const sortByReceiptDateAndNumberAsc = arr => {
      return [...arr].sort((a, b) => {
        const dateA = parseDate(a.receiptDate);
        const dateB = parseDate(b.receiptDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        const numA = a.receiptNumber ? Number(a.receiptNumber) : 0;
        const numB = b.receiptNumber ? Number(b.receiptNumber) : 0;
        return numA - numB;
      });
    };
  
    // กรองข้อมูลตาม receiptDate ที่เลือก
    const filterData = useCallback((data) => {
      return data.filter((item) => {
        const receiptDate = parseDate(item.receiptDate);
      
        if (!receiptDate) return false;
      
        if (selectedDate) {
          return (
            receiptDate.getUTCDate() === selectedDate.getUTCDate() &&
            receiptDate.getUTCMonth() === selectedDate.getUTCMonth() &&
            receiptDate.getUTCFullYear() === selectedDate.getUTCFullYear()
          );
        }
        return true;
      });
    }, [selectedDate]);
  
    const filteredReservation = sortByReceiptDateAndNumberAsc(filterData(reservation));
    const filteredCancelReservation = sortByReceiptDateAndNumberAsc(filterData(cancelReservation));
  
    // --- เตรียมข้อมูลรายงาน ---
    const calculateHours = (startTime, endTime) => {
      if (!startTime || !endTime) return 0;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const start = new Date(0, 0, 0, startHour, startMinute);
      const end = new Date(0, 0, 0, endHour, endMinute);
      const diff = (end - start) / (1000 * 60 * 60); // คำนวณชั่วโมง
      const hours = Math.floor(diff); // ชั่วโมงเต็ม
      const minutes = Math.round((diff - hours) * 60); // นาทีที่เหลือ
      return minutes > 0 ? `${hours}.${minutes}` : `${hours}`; // แสดงผลในรูปแบบ ชั่วโมง.นาที
    };

    const reportRows = filteredReservation.map((item, i) => ({
      idx: i + 1,
      receiptDate: item.receiptDate ? formatDateThaiWithTime(item.receiptDate) : "",
      receiptNumber: item.receiptNumber || "",
      cusName: item.cusName,
      cusTel: item.cusTel,
      reservDate: item.reservDate ? formatDateThaiShort(item.reservDate) : "",
      reservID: item.reservID || "",
      bookDate: item.bookDate ? formatDateThaiShort(item.bookDate) : "",
      time: `${item.startTime || ""}-${item.endTime || ""}`,
      hour: calculateHours(item.startTime, item.endTime),
      price: item.price ? item.price.toLocaleString() : "",
      cash: item.paymentMethod === "เงินสด" ? (item.price ? item.price.toLocaleString() : "") : "",
      transfer: item.paymentMethod === "QR" ? (item.price ? item.price.toLocaleString() : "") : "",
      card: item.paymentMethod === "โอนผ่านธนาคาร" ? (item.price ? item.price.toLocaleString() : "") : ""
    }));
  
    const cashItems = filteredReservation.filter(item => item.paymentMethod === "เงินสด");
    const transferItems = filteredReservation.filter(item => item.paymentMethod === "QR");
    const cardItems = filteredReservation.filter(item => item.paymentMethod === "โอนผ่านธนาคาร");
    const totalCash = cashItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalTransfer = transferItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalCard = cardItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalBookingAmount = filteredReservation.reduce((sum, item) => sum + (item.price || 0), 0);
  
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
  
    // --- ส่วนแสดงรายงาน ---
    const renderA4Report = () => (
      <div className="a4-report" style={{ width: "100vw", minHeight: "100vh", background: "#fff", color: "#000", margin: 0, padding: '32px 2vw 32px 2vw', boxSizing: 'border-box' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontWeight: 700 }}>รายงานการขายเทนนิส ประจำวันที่</h2>
          <span style={{ fontSize: 18 }}>
            <span style={{ fontSize: 18 }}>
              {filteredReservation[0] && filteredReservation[0].receiptDate ? (() => {
                const dateStr = filteredReservation[0].receiptDate;
                let date = new Date(dateStr);
                if (isNaN(date)) return dateStr;
                const d = date.getUTCDate().toString();
                const m = (date.getUTCMonth() + 1).toString();
                const y = (date.getUTCFullYear() + 543).toString();
                return `${d}/${m}/${y}`;
              })() : "-"}
            </span>
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
              <th style={{ border: "1px solid #555" }}>QR</th>
              <th style={{ border: "1px solid #555" }}>โอนผ่านธนาคาร</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row, i) => (
              <tr key={i} style={{ backgroundColor: row.isCanceled ? "#ffe6e6" : "transparent" }}>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.idx}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptDate || "-"}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.receiptNumber}</td>
                <td style={{ border: "1px solid #bbb" }}>{row.cusName}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.cusTel}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.reservID}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.reservDate || "-"}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>{row.time && row.time !== '-' ? row.time : '-'}</td>
                <td style={{ border: "1px solid #bbb", textAlign: "center" }}>
                  {row.hour
                    ? `${row.hour % 1 === 0 ? row.hour : Number(row.hour).toFixed(2)} ชั่วโมง`
                    : "-"}
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
        {/* สรุปเงินสด */}
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

    const exportExcel = () => {
      // กำหนด header ที่ต้องการ (ภาษาไทย)
      const header = [
        "ลำดับ",
        "วันที่ใบเสร็จ",
        "เลขที่ใบเสร็จ",
        "ชื่อลูกค้า",
        "เบอร์โทร",
        "เลขใบจอง",
        "วันที่จอง",
        "เวลาจอง",
        "ชั่วโมงจอง",
        "จำนวนเงิน",
        "เงินสด",
        "QR",
        "โอนผ่านธนาคาร"
      ];
    
      // แปลง reportRows เป็น array ของ array
      const rows = reportRows.map(row => [
        row.idx,
        row.receiptDate,
        row.receiptNumber,
        row.cusName,
        row.cusTel,
        row.reservID,
        row.reservDate,
        row.time,
        row.hour,
        row.price,
        row.cash,
        row.transfer,
        row.card
      ]);
    
      // คำนวณยอดรวม (sum เฉพาะคอลัมน์ตัวเลข)
      const sum = (field) => reportRows.reduce((total, row) => total + (parseFloat(row[field]) || 0), 0);
    
      // แปลงเป็น string แบบมี comma คั่นหลักพัน
      const formatNumber = (num) => num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
      const totalRow = [
        "", // ลำดับ (คอลัมน์แรก)
        "",    // วันที่ใบเสร็จ
        "",    // เลขที่ใบเสร็จ
        "",    // ชื่อลูกค้า
        "",    // เบอร์โทร
        "",    // เลขใบจอง
        "",    // วันที่จอง
        "",    // เวลาจอง
        "รวมทั้งสิ้น",
        formatNumber(sum("price")),
        formatNumber(sum("cash")),
        formatNumber(sum("transfer")),
        formatNumber(sum("card"))
      ];
    
      // รวม header + rows + totalRow
      const wsData = [header, ...rows, totalRow];
    
      // สร้าง worksheet และ workbook
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SaleReport");
    
      // ดาวน์โหลดไฟล์
      XLSX.writeFile(wb, `SaleReport${selectedDate}.xlsx`);
    };
    
    

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
              onClick={() => exportExcel()}
            >ดาวน์โหลดไฟล์</button>
          </div>
    
          <div className="print-a4-area" style={{ margin: "18px 0" }}>
            {renderA4Report()}
          </div>
        </div>
  );
};

export default SaleReport;