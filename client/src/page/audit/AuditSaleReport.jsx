import React, { useEffect, useState, useCallback } from "react";
import { getReservations, listCancelReservation } from "../../function/reservation";
import "./AuditSaleReport.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const AuditSaleReport = () => {
  const [reservation, setReservation] = useState([]);
  const [cancelReservation, setCancelReservation] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [selectedType, setSelectedType] = useState("booking");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // <<-- เพิ่ม state สำหรับค้นหา
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

      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;

      return true;
    });
  }, [startDate, endDate]);

  const filteredReservation = sortByReservDateDesc(filterData(reservation));
  const filteredCancelReservation = sortByReservDateDesc(filterData(cancelReservation));

  const totalBookingCount = filteredReservation.length;
  const totalCancelCount = filteredCancelReservation.length;

  const totalBookingAmount = filteredReservation.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalCancelAmount = filteredCancelReservation.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const netSales = totalBookingAmount;

  const handleCardClick = (type) => {
    setSelectedType(type);
    if (type === "booking") {
      setSelectedData(filteredReservation);
    } else if (type === "cancel") {
      setSelectedData(filteredCancelReservation);
    }
  };

  // อัพเดท selectedData เมื่อวันที่หรือประเภทเปลี่ยน
  useEffect(() => {
    if (selectedType === "booking") {
      setSelectedData(filteredReservation);
    } else if (selectedType === "cancel") {
      setSelectedData(filteredCancelReservation);
    }
  }, [startDate, endDate, selectedType, filteredReservation, filteredCancelReservation]);

  // ฟังก์ชันกรองข้อมูลด้วย search
  const filteredSearchData = selectedData.filter(item =>
    item.cusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cusTel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // คำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSearchData.slice(indexOfFirstItem, indexOfLastItem);

  // จำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(filteredSearchData.length / itemsPerPage);

  // ฟังก์ชันเปลี่ยนหน้า
  const goToPage = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    else if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
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
          fontFamily: '"Noto Sans Thai", sans-serif',
        }}>กลับไปหน้าหลัก</button>
      </div>

      <div className="date-filter">
        <div>
          <label>ตั้งแต่: </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="เลือกวันที่เริ่มต้น"
          />
        </div>
        <div>
          <label>ถึง: </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="เลือกวันที่สิ้นสุด"
          />
        </div>
        <button onClick={() => window.print()} 
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
            fontFamily: '"Noto Sans Thai", sans-serif',
          }}>
          พิมพ์รายงาน
        </button>
      </div>

      <div className="summary-boxes">
        <div className="box" onClick={() => handleCardClick("booking")}>
          <h3>จำนวนการจองทั้งหมด</h3>
          <p>{totalBookingCount} รายการ</p>
        </div>
        <div className="box" onClick={() => handleCardClick("cancel")}>
          <h3>จำนวนที่ยกเลิก</h3>
          <p>{totalCancelCount} รายการ</p>
        </div>
        <div className="box" onClick={() => handleCardClick("cash")}>
          <h3>ชำระเงินสด</h3>
          <p> รายการ</p>
        </div>
        <div className="box">
          <h3>ยอดจองทั้งหมด</h3>
          <p>{totalBookingAmount.toLocaleString()} บาท</p>
        </div>
        <div className="box">
          <h3>ยอดที่ถูกยกเลิก</h3>
          <p>{totalCancelAmount.toLocaleString()} บาท</p>
        </div>
        <div className="box box-highlight">
          <h3>ยอดขายสุทธิ</h3>
          <p>{netSales.toLocaleString()} บาท</p>
        </div>
      </div>

      {selectedType && (
        <div className="print-area table-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px" }}>
            <h3>รายการ{selectedType === "booking" ? "จอง" : "ยกเลิก"}
              {startDate || endDate ? (
                <>
                  {" "}ช่วงวันที่:{" "}
                  {startDate ? startDate.toLocaleDateString('th-TH') : "ไม่กำหนด"}  
                  {" "}ถึง{" "}
                  {endDate ? endDate.toLocaleDateString('th-TH') : "ไม่กำหนด"}
                </>
              ) : null}
            </h3>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อหรือเบอร์โทร" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px", width: "300px", fontSize: "16px" }}
            />
          </div>

          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>เบอร์โทร</th>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>จำนวนเงิน</th>
                <th>วิธีชำระเงิน</th>
                <th>หมายเลขใบเสร็จ</th>
                <th>วันที่ชำระ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.cusName}</td>
                  <td>{item.cusTel}</td>
                  <td>{item.reservDate}</td>
                  <td>{item.startTime} - {item.endTime}</td>
                  <td>{item.amount.toLocaleString()} บาท</td>
                  <td>{item.paymentMethod}</td>
                  <td>{item.receiptNumber || '-'}</td>
                  <td>{item.payDate || '-'}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              ก่อนหน้า
            </button>
            <span>หน้า {currentPage} / {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditSaleReport;
