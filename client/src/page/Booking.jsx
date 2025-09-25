import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/th';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { getReservations, getReservationById, updateReservations, deleteReservations, payReservation } from '../function/reservation';
import Reservation from './Reservation';
import logo from '../img/logo.png'; 
import { Modal, Box, Button, RadioGroup, FormControlLabel, Radio, TextField } from '@mui/material';
import generatePayload from 'promptpay-qr';
import {QRCodeCanvas}  from 'qrcode.react';  
import { useNavigate } from 'react-router-dom'; 
import './Booking.css'; 
import { reprintReceipt , checkPassword, logout} from '../function/auth';

const localizer = momentLocalizer(moment);
moment.updateLocale('th', { week: { dow: 1 } });
const DragAndDropCalendar = withDragAndDrop(Calendar);

const mapReservationsToEvents = (reservations) => {
  return reservations
    .filter(resv => resv.status !== 'ยกเลิก') // กรองสถานะ "ยกเลิก" ออก
    .map(resv => {
      const [day, month, year] = resv.reservDate.split('/');
      const startDateTime = new Date(year, month - 1, day, ...resv.startTime.split(':'));
      const endDateTime = new Date(year, month - 1, day, ...resv.endTime.split(':'));

      return {
        id: resv.reservID,
        title: `${resv.cusName} (${resv.paymentMethod})`,
        start: startDateTime,
        end: endDateTime,
        paymentMethod: resv.paymentMethod
      };
    });
};

const formats = {
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }, culture, local) =>
    `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
  dayHeaderFormat: (date, culture, localizer) =>
      moment(date).format('ddddที่ D MMMM YYYY'),
  dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
    ` ${moment(start).format('D MMMM YYYY')} - ${moment(end).format('D MMMM YYYY')}`,
};

const Booking = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);  // เก็บวันที่คลิกเลือก
  const [selectedEvent, setSelectedEvent] = useState(null); // เพิ่มสำหรับ event ที่คลิก
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [newStart, setNewStart] = useState(null);
  const [newEnd, setNewEnd] = useState(null);
  const [paymentType, setPaymentType] = useState('QR'); // 'เงินสด' หรือ 'QR'
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isReprintOpen, setIsReprintOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [reprintCode, setReprintCode] = useState("");
  const [paymentPromptPayID, setPaymentPromptPayID] = useState(process.env.REACT_APP_PROMYPAY_API); // เบอร์ PromptPay
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState(null); 
  const [searchText, setSearchText] = useState("");
  const [matchingEvents, setMatchingEvents] = useState([]);
  const [showSearchList, setShowSearchList] = useState(false);
  const calendarRef = useRef(null);
  const [reprintPassword, setReprintPassword] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEventData, setEditEventData] = useState(null);
  const [editNewStart, setEditNewStart] = useState(null);
  const [editNewEnd, setEditNewEnd] = useState(null);

  // สร้าง payload promptpay qr ตามเบอร์และจำนวนเงิน
  const qrPayload = generatePayload(paymentPromptPayID, { price: paymentAmount });

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await getReservations();
        const mappedEvents = mapReservationsToEvents(res.data);
        setEvents(mappedEvents);
      } catch (error) {
        console.error('Error loading reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  useEffect(() => {
    if (!searchText) {
      setMatchingEvents([]);
      setShowSearchList(false);
      return;
    }
    // กรองชื่อที่มีใน events
    const matched = events.filter(ev =>
      ev.title.toLowerCase().includes(searchText.toLowerCase())
    );
    setMatchingEvents(matched);
    setShowSearchList(matched.length > 0);
  }, [searchText, events]);

  const handleSelectSearchEvent = (ev) => {
    setDate(ev.start);    // เลื่อนไปวันนั้น
    setView('day');       // เปลี่ยนเป็นมุมมองรายวัน
    setShowSearchList(false);
    setSearchText("");    // clear ช่องค้นหา (หรือคงไว้ก็ได้)
  };

   // เปลี่ยนเงินสด คำนวณเงินทอนทันที
  useEffect(() => {
    if (paymentType === 'เงินสด') {
      const c = Number(cashReceived) - Number(paymentAmount);
      setChange(isNaN(c) ? 0 : c);
    }
  }, [cashReceived, paymentAmount, paymentType]);

  useEffect(() => {
    if (view === 'week') {
      moment.updateLocale('th', { week: { dow: moment().day() } });
    } else if (view === 'month') {
      moment.updateLocale('th', { week: { dow: 1 } });
    }
    setCalendarLocalizer(momentLocalizer(moment));
  }, [view]);

  const [calendarLocalizer, setCalendarLocalizer] = useState(() => {
    moment.updateLocale('th', { week: { dow: 1 } }); // default จันทร์
    return momentLocalizer(moment);
  });

  const EventWrapper = ({ event, children }) => (
    <div
      onContextMenu={async e => {
      e.preventDefault();
      setContextMenu({
        mouseX: e.clientX - 2,
        mouseY: e.clientY - 4,
        eventObj: event
      });
      try {
        const res = await getReservationById(event.id);
        setSelectedEvent(res.data);
      } catch (error) {
        setSelectedEvent(event);
      }
    }}
      style={{ cursor: "pointer" }}
    >
      {children}
    </div>
  );

  // --- ปิด context menu เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (loading) {
    return <div>กำลังโหลดข้อมูล...</div>;
  }

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    return moment(dateObj).format('DD/MM/YYYY');
  };

  const isPastDate = (dateObj) => {
  if (!dateObj) return true;

    const today = moment().startOf('day');
    const selected = moment(dateObj).startOf('day');

    return selected.isBefore(today);
  };

  const printReservationForm = (reservation) => {
    const reservDate = reservation.reservDate;
    const startTime = reservation.startTime;
    const endTime = reservation.endTime;

    printReservationFormContent({
      reservID: reservation.reservID,
      memID: reservation.memberID || '-',  // ใช้ memberID ถ้ามี
      paymentMethod: reservation.paymentMethod || '-',  // ใช้ paymentMethod ถ้ามี
      reffPerson: reservation.refPerson || '-',  // ใช้ refPerson ถ้ามี
      cusName: reservation.cusName,
      cusTel: reservation.cusTel || '-',
      selectedDate: reservDate,
      startTime,
      endTime,
      price: reservation.price || '-',  // ใช้ราคาจริงถ้ามี
      createAt: moment(reservation.createAt).format('DD/MM/YYYY HH:mm') || '-'
    });
  };

  const printReservationFormContent = ({ cusName, cusTel, selectedDate, startTime, endTime, price, reservID, memID, paymentMethod, reffPerson, createAt }) => {
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
      <html>
        <head>
          <title>ใบจองสนามเทนนิส</title>
          <style>
            @media print {
              @page {
                size: A5 portrait;
                margin: 0;
              }
            }
  
            body {
              font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
              font-size: 16pt;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
            }
  
            .container {
              width: 100%;
              max-width: 480px;
              margin: auto;
              padding: 10px;
              box-sizing: border-box;
            }
  
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
  
            .header img {
              height: 80px;
              width: auto;
              margin-bottom: 10px;
            }
  
            .header h2 {
              margin: 0;
              font-size: 18pt;
            }
  
            .header p {
              margin: 0;
              font-size: 14pt;
            }
  
            .contact-info {
              margin-top: 5px;
              font-size: 14pt;
            }
  
            .title {
              text-align: center;
              font-size: 18pt;
              font-weight: bold;
              margin: 10px 0 0 0;
            }
  
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 14pt;
            }
  
            .reservation-details {
              border: 1px solid #000;
              border-radius: 10px;
              padding: 10px 20px;
              background-color: #fff;
            }
  
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
  
            .label {
              font-weight: bold;
              color: #000;
            }
  
            .value {
              color: #000;
            }
  
            .signature-container {
              display: flex;
              justify-content: flex-end;
              align-items: flex-end;
            }
  
            .signature-block {
              text-align: center;
              font-size: 14pt;
              margin-left: auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logo}" alt="Logo">    
              <h2>บริษัท เอเชียโฮเต็ล จำกัด (มหาชน)</h2>
              <p>296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400</p>  
              <div class="contact-info">
                <p><strong>โทรศัพท์:</strong> 02-217-0808 ต่อ 5340 &nbsp; <strong>เลขประจำตัวผู้เสียภาษีอากร :</strong> 0107535000346</p>
              </div>       
            </div>
  
            <div class="title">ใบจองสนามเทนนิส</div>
  
            <div class="info-row">
              <p><strong>หมายเลขการจอง:</strong> 00${reservID}</p>
              <p><strong>วันที่:</strong> ${createAt}</p>
            </div>
  
            <div class="reservation-details">
              <div class="detail-row"><span class="label">หมายเลขสมาชิก:</span><span class="value">${memID}</span></div>
              <div class="detail-row"><span class="label">ชื่อผู้จอง:</span><span class="value">${cusName}</span></div>
              <div class="detail-row"><span class="label">เบอร์โทร:</span><span class="value">${cusTel || '-'}</span></div>
              <div class="detail-row"><span class="label">วันที่จอง:</span><span class="value">${selectedDate}</span></div>
              <div class="detail-row"><span class="label">เวลา:</span><span class="value">${startTime} - ${endTime}</span></div>
              <div class="detail-row"><span class="label">รวมชั่วโมงการจอง:</span><span class="value">
                ${(() => {
                  if (startTime && endTime) {
                    const [startH, startM] = startTime.split(":").map(Number);
                    const [endH, endM] = endTime.split(":").map(Number);
                    let hours = endH + endM/60 - (startH + startM/60);
                    return formatHourDisplay(hours);
                  }
                  return "- ชั่วโมง";
                })()}</span>
              </div>
              <div class="detail-row"><span class="label">ราคาทั้งหมด:</span>
                <span class="value">
                  ${price !== undefined && price !== null && !isNaN(price)
                    ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : '-'} บาท
                </span>
              </div>
              <div class="detail-row"><span class="label">สถานะชำระเงิน:</span><span class="value">${paymentMethod}</span></div>
              <div class="detail-row"><span class="label">บุคคลอ้างอิง:</span><span class="value">${reffPerson}</span></div>
            </div>
  
            <div class="signature-container">
              <div class="signature-block">
                <p>ลงชื่อ _______________________</p>
                <p>(พนักงาน)</p>            
            </div>
          </div>
          <script>
            // แสดงหน้าเว็บใหม่โดยไม่สั่ง print และไม่ปิด window
          </script>
        </body>
      </html>
      `);
      printWindow.document.close();
    };
  const handleEventDrop = ({ event, start, end, allDay }) => {
    //const today = new Date();
    //today.setHours(0, 0, 0, 0);
//
    //const newDate = new Date(start);
    //newDate.setHours(0, 0, 0, 0);
//
    //const oldDate = new Date(event.start);
    //oldDate.setHours(0, 0, 0, 0);
//
    //const yesterday = new Date(today);
    //yesterday.setDate(today.getDate() - 1);
//
    //const now = moment();
    //const oldEnd = moment(event.end);
    //if (oldEnd.isBefore(now)) {
    //  alert("ไม่สามารถเปลี่ยนวันและเวลาจองได้ เนื่องจากเวลานี้ผ่านไปแล้ว");
    //  return;
    //}
//
    //const endHour = end.getHours();
    //if (endHour > 22 || (endHour === 22 && end.getMinutes() > 0)) {
    //  alert('ไม่สามารถจองหรือเลื่อนหลัง 22:00 ได้');
    //  return;
    //}
    //// ห้ามเลื่อนไปวัน-เวลาที่ผ่านมาแล้ว
    //const newStartMoment = moment(start);
    //const newEndMoment = moment(end);
    //  
    //if (newStartMoment.isBefore(now) || newEndMoment.isBefore(now)) {
    //  alert("ไม่สามารถเลื่อนจองไปวันหรือเวลาที่ผ่านมาแล้ว");
    //  return;
    //}
    //
    //// ❌ ห้ามย้ายไปวันก่อนวันนี้
    //if (newDate < today) {
    //  alert("ไม่สามารถย้ายไปวันก่อนวันนี้ได้");
    //  return;
    //}
//
    //// ❌ ห้ามย้ายจากวานนี้มายังวันนี้ หรือวันหลังจากนี้
    //const isFromYesterday = oldDate.getTime() === yesterday.getTime();
    //const isMoveToTodayOrFuture = newDate.getTime() >= today.getTime();
//
    //if (isFromYesterday && isMoveToTodayOrFuture) {
    //  alert("ไม่สามารถย้ายจากวานนี้มายังวันนี้หรือวันถัดไปได้");
    //  return;
    //}
//
    //// ✅ ผ่านเงื่อนไขแล้ว
    //setDraggedEvent(event);
    //setNewStart(start);
    //setNewEnd(end);
    //setIsModalOpen(true);
  };

  const handleDeleteReservation = async (reservID, name) => {
    if (!reservID) {
      console.error("❌ ไม่พบ reservID สำหรับลบใบจอง");
      return;
    }
    try {
      await deleteReservations(reservID, name); // <- ฟังก์ชันที่เรียก axios.delete
      const res = await getReservations();
      const mappedEvents = mapReservationsToEvents(res.data);
      setEvents(mappedEvents);
      window.location.reload(); 
    } catch (error) {
      console.error("ลบใบจองล้มเหลว", error);
    }
  };

  function formatHourDisplay(hours) {
    if (!isFinite(hours) || hours <= 0) return "- ชั่วโมง";
    const full = Math.floor(hours);
    const fraction = hours - full;
    if (Math.abs(fraction - 0.5) < 0.01) {
      return `${full}.30 ชั่วโมง`;
    }
    if (fraction === 0) {
      return `${full} ชั่วโมง`;
    }
    return `${hours.toFixed(2)} ชั่วโมง`;
  }

  const printReceipt = (reservation, paymentMethod, price, received, changeVal, receiptDate) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
    <html>
      <head>
        <title>สำเนาใบเสร็จรับเงิน</title>
        <style>
          @media print {
            @page {
              size: A5 portrait;
              margin: 0;
              padding: 15px;
            }
          }
          body {
            font-family: Tahoma, Arial, sans-serif;
            font-size: 13px;
            color: #000;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: auto;
            padding: 10px;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            margin-bottom: 10px;
          }
          .companyAddress{
            margin-top: 10px;
          }
          .company {
            font-size: 12px;
            font-weight: bold;
          }
          .address {
            font-size: 10px;
          }
          .title {
            background: linear-gradient(180deg, #b2c6e2 80%, #a2b6d6 100%);
            color: #000;
            border-radius: 15px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            padding: 18px 0 10px 0;
            border: 1px solid #7a8bb7;
            width: 42%;
            box-sizing: border-box;
          }
          .cusData {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-bottom: 10px;
            height: 120px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #4169e1;
            border-bottom: none;
            padding: 6px 8px;
            font-size: 12px;
            text-align: left;
          }
          th {
            background: #dde6f7;
            font-weight: bold;
          }
          .amount-table{
            border: 1px solid #4169e1;
          }
          .no-border {
            border: none !important;
          }
          .right {
            text-align: right;
          }
          .center {
            text-align: center;
          }
          .signature {
            margin-top: 10px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
          }
          .signature-block {
            text-align: center;
            width: 40%;
            font-size: 11px;
          }
          .cusData-left {
            border: 2px solid #4169e1;
            width: 60%;
          }
          .cusData-left tr td {
            border: none;
            font-size: 13px;
          }
          .cusData-right {
            border: 2px solid #4169e1;
            width: 35%;
          }
          .cusData-right tr td {
            border: none;
            font-size: 14px;
          }
          .checkbox-print {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid #686868ff;
            border-radius: 4px;
            background: #686868ff;
            position: relative;
            vertical-align: middle;
            margin-right: 6px;
          }
          .checkbox-print.checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 0px;
            width: 7px;
            height: 14px;
            border: solid #000000;
            border-width: 0 3px 3px 0;
            transform: rotate(45deg);
          }
          .checkbox-print.disabled {
            opacity: 0.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="companyAddress">
              <span class="company">บริษัท เอเชียโฮเต็ล จำกัด (มหาชน) สำนักงานใหญ่</span><br>
              <span class="address">296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400<br>
              เลขประจำตัวผู้เสียภาษี 0107535000346 <br/> โทร 02-2170808 ต่อ 5340</span>
            </div>  
            <div class="title">
              <span>ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ</span><br>
              <span>ต้นฉบับ</span>
            </div>  
          </div>
          <div class="cusData">
            <div class="cusData-left">
              <table>
                <tr>
                  <td><strong>ชื่อลูกค้า :</strong> ${reservation.cusName}</td>
                  <td><strong>หมายเลขการจอง :</strong> ${reservation.reservID}</td>
                </tr>
                <tr>
                  <td><strong>วันที่จอง :</strong> ${(() => {
                    if (!reservation.reservDate) return '-';
                    const match = String(reservation.reservDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (match) {
                      const day = match[1].padStart(2, '0');
                      const month = match[2].padStart(2, '0');
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(reservation.reservDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(reservation.reservDate);
                  })()}</td>
                  <td><strong>เวลา :</strong> ${reservation.startTime} - ${reservation.endTime}</td>
                </tr>
                <tr>
                  <td><strong>โทรศัพท์ :</strong> ${reservation.cusTel || '-'}</td>
                  <td class="left" style="vertical-align: top;"><strong>จำนวน : </strong> ${(() => {
                    if (reservation && reservation.startTime && reservation.endTime) {
                      const [startH, startM] = reservation.startTime.split(":").map(Number);
                      const [endH, endM] = reservation.endTime.split(":").map(Number);
                      let hours = endH + endM/60 - (startH + startM/60);
                      return formatHourDisplay(hours);
                    }
                    return "- ชั่วโมง";
                  })()}</td>
                </tr>
              </table>
            </div>
            <div class="cusData-right">
              <table>
                <tr>
                  <td><strong>เลขที่ / No. :</strong> ${reservation.receiptNumber || '-'}</td>
                </tr>
                <tr>
                  <td><strong>วันที่ / Date :</strong> ${(() => {
                    if (!receiptDate) return '-';
                    const match = String(receiptDate).match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (match) {
                      const day = match[1];
                      const month = match[2];
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(receiptDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    if (receiptDate instanceof Date) {
                      const day = receiptDate.getDate().toString().padStart(2, '0');
                      const month = (receiptDate.getMonth() + 1).toString().padStart(2, '0');
                      const year = (receiptDate.getFullYear() + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(receiptDate);
                  })()}</td>
                </tr>
              </table>
            </div>
          </div>
          <table>
            <tr>
              <th class="center" style="width:12%;">ลำดับที่<br>Item</th>
              <th class="center" style="width:68%;">รายการ<br>Descriptions</th>
              <!-- <th class="center" style="width:12%;">จำนวน<br>Quantity</th>
              <th class="center" style="width:20%;">ราคาต่อหน่วย<br>Unit price</th> -->
              <th class="center" style="width:20%;">จำนวนเงิน<br>Amount</th>
            </tr>
            <tr style="height: 100px; align-items: top;">
              <td class="center" style="vertical-align: top;">1</td>
              <td class="left" style="vertical-align: top;">Tennis ${(() => {
                if (reservation && reservation.startTime && reservation.endTime) {
                  const [startH, startM] = reservation.startTime.split(":").map(Number);
                  const [endH, endM] = reservation.endTime.split(":").map(Number);
                  let hours = endH + endM/60 - (startH + startM/60);
                  return formatHourDisplay(hours);
                }
                return "- ชั่วโมง";
              })()}</td>
             <!-- <td class="center" style="vertical-align: top;">1</td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td> -->
              
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <table class="amount-table">
            <tr>
              <td class="no-border" style="width:12%;"><strong>ตัวอักษร</strong></td>
              <td class="no-border" style="width:32%; "><strong>${(() => {
                // ฟังก์ชันแปลงตัวเลขเป็นข้อความไทยบาทถ้วน
                function thaiBahtText(num) {
                  if (!num || isNaN(num)) return '';
                  const thNum = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
                  const thDigit = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
                  let s = '';
                  let n = Math.floor(Number(num));
                  let str = n.toString();
                  let len = str.length;
                  for (let i = 0; i < len; i++) {
                    let digit = len - i - 1;
                    let numChar = parseInt(str[i]);
                    if (numChar !== 0) {
                      if (digit === 1 && numChar === 1) s += 'สิบ';
                      else if (digit === 1 && numChar === 2) s += 'ยี่สิบ';
                      else if (digit === 1) s += thNum[numChar] + 'สิบ';
                      else if (digit === 0 && numChar === 1 && len > 1) s += 'เอ็ด';
                      else s += thNum[numChar] + thDigit[digit];
                    }
                  }
                  return `(${s}บาทถ้วน)`;
                }
                return thaiBahtText(price);
              })()}</strong></td>
              <td class="no-border" style="width:36%; text-align: center; background-color: #dfdfdf;"><strong>ราคาสุทธิ (รวมภาษีมูลค่าเพิ่ม)</strong></td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <div class="signature">
            <div>
              <table>
                <tr>
                  <td class="no-border left" style="padding-top: 20px;">
                    <strong>ชำระโดย</strong>&nbsp; 
                    <span class="checkbox-print${paymentMethod === 'เงินสด' ? ' checked disabled' : ' disabled'}"></span>เงินสด
                    <span class="checkbox-print${paymentMethod === 'QR' ? ' checked disabled' : ' disabled'}"></span>QR
                    <span class="checkbox-print${paymentMethod === 'โอนผ่านธนาคาร' ? ' checked disabled' : ' disabled'}"></span>โอนผ่านธนาคาร
                  </td>
                </tr>
              </table>
            </div>
            <div class="signature-block">
              <p>ลงชื่อ  ___________________________</p>
              <p>(ผู้รับเงิน)</p>
            </div>
          </div>
          <div class="note" style="font-size: 10px;">
            <u>เงื่อนไขการจอง</u>&nbsp;
            : ขอสงวนสิทธิ์ไม่คืนเงินค่าบริการทุกกรณี ยกเว้นเฉพาะกรณีที่ไม่สามารถใช้สนามได้เนื่องจากฝนตกเท่านั้น
          </div>
        </div>
        
        <div class="container" style="margin-top: 500px;">
          <div class="header">
            <div class="companyAddress">
              <span class="company">บริษัท เอเชียโฮเต็ล จำกัด (มหาชน) สำนักงานใหญ่</span><br>
              <span class="address">296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400<br>
              เลขประจำตัวผู้เสียภาษี 0107535000346 <br/> โทร 02-2170808 ต่อ 5340</span>
            </div>  
            <div class="title">
              <span>ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ</span><br>
              <span>สำเนา</span>
            </div>  
          </div>
          <div class="cusData">
            <div class="cusData-left">
              <table>
                <tr>
                  <td><strong>ชื่อลูกค้า :</strong> ${reservation.cusName}</td>
                  <td><strong>หมายเลขการจอง :</strong> ${reservation.reservID}</td>
                </tr>
                <tr>
                  <td><strong>วันที่จอง :</strong> ${(() => {
                    if (!reservation.reservDate) return '-';
                    const match = String(reservation.reservDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (match) {
                      const day = match[1].padStart(2, '0');
                      const month = match[2].padStart(2, '0');
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(reservation.reservDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(reservation.reservDate);
                  })()}</td>
                  <td><strong>เวลา :</strong> ${reservation.startTime} - ${reservation.endTime}</td>
                </tr>
                <tr>
                  <td><strong>โทรศัพท์ :</strong> ${reservation.cusTel || '-'}</td>
                  <td class="left" style="vertical-align: top;"><strong>จำนวน : </strong> ${(() => {
                    if (reservation && reservation.startTime && reservation.endTime) {
                      const [startH, startM] = reservation.startTime.split(":").map(Number);
                      const [endH, endM] = reservation.endTime.split(":").map(Number);
                      let hours = endH + endM/60 - (startH + startM/60);
                      return formatHourDisplay(hours);
                    }
                    return "- ชั่วโมง";
                  })()}</td>
                </tr>
              </table>
            </div>
            <div class="cusData-right">
              <table>
                <tr>
                  <td><strong>เลขที่ / No. :</strong> ${reservation.receiptNumber || '-'}</td>
                </tr>
                <tr>
                  <td><strong>วันที่ / Date :</strong> ${(() => {
                    if (!receiptDate) return '-';
                    const match = String(receiptDate).match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (match) {
                      const day = match[1];
                      const month = match[2];
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(receiptDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    if (receiptDate instanceof Date) {
                      const day = receiptDate.getDate().toString().padStart(2, '0');
                      const month = (receiptDate.getMonth() + 1).toString().padStart(2, '0');
                      const year = (receiptDate.getFullYear() + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(receiptDate);
                  })()}</td>
                </tr>
              </table>
            </div>
          </div>
          <table>
            <tr>
              <th class="center" style="width:12%;">ลำดับที่<br>Item</th>
              <th class="center" style="width:68%;">รายการ<br>Descriptions</th>
              <!-- <th class="center" style="width:12%;">จำนวน<br>Quantity</th>
              <th class="center" style="width:20%;">ราคาต่อหน่วย<br>Unit price</th> -->
              <th class="center" style="width:20%;">จำนวนเงิน<br>Amount</th>
            </tr>
            <tr style="height: 100px; align-items: top;">
              <td class="center" style="vertical-align: top;">1</td>
              <td class="left" style="vertical-align: top;">Tennis ${(() => {
                if (reservation && reservation.startTime && reservation.endTime) {
                  const [startH, startM] = reservation.startTime.split(":").map(Number);
                  const [endH, endM] = reservation.endTime.split(":").map(Number);
                  let hours = endH + endM/60 - (startH + startM/60);
                  return formatHourDisplay(hours);
                }
                return "- ชั่วโมง";
              })()}</td>
             <!-- <td class="center" style="vertical-align: top;">1</td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td> -->
              
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <table class="amount-table">
            <tr>
              <td class="no-border" style="width:12%;"><strong>ตัวอักษร</strong></td>
              <td class="no-border" style="width:32%; "><strong>${(() => {
                // ฟังก์ชันแปลงตัวเลขเป็นข้อความไทยบาทถ้วน
                function thaiBahtText(num) {
                  if (!num || isNaN(num)) return '';
                  const thNum = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
                  const thDigit = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
                  let s = '';
                  let n = Math.floor(Number(num));
                  let str = n.toString();
                  let len = str.length;
                  for (let i = 0; i < len; i++) {
                    let digit = len - i - 1;
                    let numChar = parseInt(str[i]);
                    if (numChar !== 0) {
                      if (digit === 1 && numChar === 1) s += 'สิบ';
                      else if (digit === 1 && numChar === 2) s += 'ยี่สิบ';
                      else if (digit === 1) s += thNum[numChar] + 'สิบ';
                      else if (digit === 0 && numChar === 1 && len > 1) s += 'เอ็ด';
                      else s += thNum[numChar] + thDigit[digit];
                    }
                  }
                  return `(${s}บาทถ้วน)`;
                }
                return thaiBahtText(price);
              })()}</strong></td>
              <td class="no-border" style="width:36%; text-align: center; background-color: #dfdfdf;"><strong>ราคาสุทธิ (รวมภาษีมูลค่าเพิ่ม)</strong></td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <div class="signature">
            <div>
              <table>
                <tr>
                  <td class="no-border left" style="padding-top: 20px;">
                    <strong>ชำระโดย</strong>&nbsp; 
                    <span class="checkbox-print${paymentMethod === 'เงินสด' ? ' checked disabled' : ' disabled'}"></span>เงินสด
                    <span class="checkbox-print${paymentMethod === 'QR' ? ' checked disabled' : ' disabled'}"></span>QR
                    <span class="checkbox-print${paymentMethod === 'โอนผ่านธนาคาร' ? ' checked disabled' : ' disabled'}"></span>โอนผ่านธนาคาร
                  </td>
                </tr>
              </table>
            </div>
            <div class="signature-block">
              <p>ลงชื่อ  ___________________________</p>
              <p>(ผู้รับเงิน)</p>
            </div>
          </div>
          <div class="note" style="font-size: 10px;">
            <u>เงื่อนไขการจอง</u>&nbsp;
            : ขอสงวนสิทธิ์ไม่คืนเงินค่าบริการทุกกรณี ยกเว้นเฉพาะกรณีที่ไม่สามารถใช้สนามได้เนื่องจากฝนตกเท่านั้น
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
    </html>
    `);
    printWindow.document.close();
  };

  const printCopyOfReceipt = (reservation, paymentMethod, price, received, changeVal, receiptDate) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
    <html>
      <head>
        <title>สำเนาใบเสร็จรับเงิน</title>
        <style>
          @media print {
            @page {
              size: A5 portrait;
              margin: 0;
              padding: 15px;
            }
          }
          body {
            font-family: Tahoma, Arial, sans-serif;
            font-size: 13px;
            color: #000;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: auto;
            padding: 10px;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            margin-bottom: 10px;
          }
          .companyAddress{
            margin-top: 10px;
          }
          .company {
            font-size: 12px;
            font-weight: bold;
          }
          .address {
            font-size: 10px;
          }
          .title {
            background: linear-gradient(180deg, #b2c6e2 80%, #a2b6d6 100%);
            color: #000;
            border-radius: 15px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            padding: 18px 0 10px 0;
            border: 1px solid #7a8bb7;
            width: 42%;
            box-sizing: border-box;
          }
          .cusData {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-bottom: 10px;
            height: 120px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #4169e1;
            border-bottom: none;
            padding: 6px 8px;
            font-size: 12px;
            text-align: left;
          }
          th {
            background: #dde6f7;
            font-weight: bold;
          }
          .amount-table{
            border: 1px solid #4169e1;
          }
          .no-border {
            border: none !important;
          }
          .right {
            text-align: right;
          }
          .center {
            text-align: center;
          }
          .signature {
            margin-top: 10px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
          }
          .signature-block {
            text-align: center;
            width: 40%;
            font-size: 11px;
          }
          .cusData-left {
            border: 2px solid #4169e1;
            width: 60%;
          }
          .cusData-left tr td {
            border: none;
            font-size: 13px;
          }
          .cusData-right {
            border: 2px solid #4169e1;
            width: 35%;
          }
          .cusData-right tr td {
            border: none;
            font-size: 14px;
          }
          .checkbox-print {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid #686868ff;
            border-radius: 4px;
            background: #686868ff;
            position: relative;
            vertical-align: middle;
            margin-right: 6px;
          }
          .checkbox-print.checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 0px;
            width: 7px;
            height: 14px;
            border: solid #000000;
            border-width: 0 3px 3px 0;
            transform: rotate(45deg);
          }
          .checkbox-print.disabled {
            opacity: 0.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="companyAddress">
              <span class="company">บริษัท เอเชียโฮเต็ล จำกัด (มหาชน) สำนักงานใหญ่</span><br>
              <span class="address">296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400<br>
              เลขประจำตัวผู้เสียภาษี 0107535000346 <br/> โทร 02-2170808 ต่อ 5340</span>
            </div>  
            <div class="title">
              <span>ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ</span><br>
              <span>ต้นฉบับ</span>
            </div>  
          </div>
          <div class="cusData">
            <div class="cusData-left">
              <table>
                <tr>
                  <td><strong>ชื่อลูกค้า :</strong> ${reservation.cusName}</td>
                  <td><strong>หมายเลขการจอง :</strong> ${reservation.reservID}</td>
                </tr>
                <tr>
                  <td><strong>วันที่จอง :</strong> ${(() => {
                    if (!reservation.reservDate) return '-';
                    const match = String(reservation.reservDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (match) {
                      const day = match[1].padStart(2, '0');
                      const month = match[2].padStart(2, '0');
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(reservation.reservDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(reservation.reservDate);
                  })()}</td>
                  <td><strong>เวลา :</strong> ${reservation.startTime} - ${reservation.endTime}</td>
                </tr>
                <tr>
                  <td><strong>โทรศัพท์ :</strong> ${reservation.cusTel || '-'}</td>
                  <td class="left" style="vertical-align: top;"><strong>จำนวน : </strong> ${(() => {
                    if (reservation && reservation.startTime && reservation.endTime) {
                      const [startH, startM] = reservation.startTime.split(":").map(Number);
                      const [endH, endM] = reservation.endTime.split(":").map(Number);
                      let hours = endH + endM/60 - (startH + startM/60);
                      return formatHourDisplay(hours);
                    }
                    return "- ชั่วโมง";
                  })()}</td>
                </tr>
              </table>
            </div>
            <div class="cusData-right">
              <table>
                <tr>
                  <td><strong>เลขที่ / No. :</strong> ${reservation.receiptNumber || '-'}</td>
                </tr>
                <tr>
                  <td><strong>วันที่ / Date :</strong> ${(() => {
                    if (!receiptDate) return '-';
                    const match = String(receiptDate).match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (match) {
                      const day = match[1];
                      const month = match[2];
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(receiptDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    if (receiptDate instanceof Date) {
                      const day = receiptDate.getDate().toString().padStart(2, '0');
                      const month = (receiptDate.getMonth() + 1).toString().padStart(2, '0');
                      const year = (receiptDate.getFullYear() + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(receiptDate);
                  })()}</td>
                </tr>
              </table>
            </div>
          </div>
          <table>
            <tr>
              <th class="center" style="width:12%;">ลำดับที่<br>Item</th>
              <th class="center" style="width:68%;">รายการ<br>Descriptions</th>
              <!-- <th class="center" style="width:12%;">จำนวน<br>Quantity</th>
              <th class="center" style="width:20%;">ราคาต่อหน่วย<br>Unit price</th> -->
              <th class="center" style="width:20%;">จำนวนเงิน<br>Amount</th>
            </tr>
            <tr style="height: 100px; align-items: top;">
              <td class="center" style="vertical-align: top;">1</td>
              <td class="left" style="vertical-align: top;">Tennis ${(() => {
                if (reservation && reservation.startTime && reservation.endTime) {
                  const [startH, startM] = reservation.startTime.split(":").map(Number);
                  const [endH, endM] = reservation.endTime.split(":").map(Number);
                  let hours = endH + endM/60 - (startH + startM/60);
                  return formatHourDisplay(hours);
                }
                return "- ชั่วโมง";
              })()}</td>
             <!-- <td class="center" style="vertical-align: top;">1</td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td> -->
              
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <table class="amount-table">
            <tr>
              <td class="no-border" style="width:12%;"><strong>ตัวอักษร</strong></td>
              <td class="no-border" style="width:32%; "><strong>${(() => {
                // ฟังก์ชันแปลงตัวเลขเป็นข้อความไทยบาทถ้วน
                function thaiBahtText(num) {
                  if (!num || isNaN(num)) return '';
                  const thNum = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
                  const thDigit = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
                  let s = '';
                  let n = Math.floor(Number(num));
                  let str = n.toString();
                  let len = str.length;
                  for (let i = 0; i < len; i++) {
                    let digit = len - i - 1;
                    let numChar = parseInt(str[i]);
                    if (numChar !== 0) {
                      if (digit === 1 && numChar === 1) s += 'สิบ';
                      else if (digit === 1 && numChar === 2) s += 'ยี่สิบ';
                      else if (digit === 1) s += thNum[numChar] + 'สิบ';
                      else if (digit === 0 && numChar === 1 && len > 1) s += 'เอ็ด';
                      else s += thNum[numChar] + thDigit[digit];
                    }
                  }
                  return `(${s}บาทถ้วน)`;
                }
                return thaiBahtText(price);
              })()}</strong></td>
              <td class="no-border" style="width:36%; text-align: center; background-color: #dfdfdf;"><strong>ราคาสุทธิ (รวมภาษีมูลค่าเพิ่ม)</strong></td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <div class="signature">
            <div>
              <table>
                <tr>
                  <td class="no-border left" style="padding-top: 20px;">
                    <strong>ชำระโดย</strong>&nbsp; 
                    <span class="checkbox-print${paymentMethod === 'เงินสด' ? ' checked disabled' : ' disabled'}"></span>เงินสด
                    <span class="checkbox-print${paymentMethod === 'QR' ? ' checked disabled' : ' disabled'}"></span>QR
                    <span class="checkbox-print${paymentMethod === 'โอนผ่านธนาคาร' ? ' checked disabled' : ' disabled'}"></span>โอนผ่านธนาคาร
                  </td>
                </tr>
              </table>
            </div>
            <div class="signature-block">
              <p>ลงชื่อ  ___________________________</p>
              <p>(ผู้รับเงิน)</p>
            </div>
          </div>
          <div class="note" style="font-size: 10px;">
            <u>เงื่อนไขการจอง</u>&nbsp;
            : ขอสงวนสิทธิ์ไม่คืนเงินค่าบริการทุกกรณี ยกเว้นเฉพาะกรณีที่ไม่สามารถใช้สนามได้เนื่องจากฝนตกเท่านั้น
          </div>
        </div>

        <div class="container" style="margin-top: 500px;">
          <div class="header">
            <div class="companyAddress">
              <span class="company">บริษัท เอเชียโฮเต็ล จำกัด (มหาชน) สำนักงานใหญ่</span><br>
              <span class="address">296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400<br>
              เลขประจำตัวผู้เสียภาษี 0107535000346 <br/> โทร 02-2170808 ต่อ 5340</span>
            </div>  
            <div class="title">
              <span>ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ</span><br>
              <span>สำเนา</span>
            </div>  
          </div>
          <div class="cusData">
            <div class="cusData-left">
              <table>
                <tr>
                  <td><strong>ชื่อลูกค้า :</strong> ${reservation.cusName}</td>
                  <td><strong>หมายเลขการจอง :</strong> ${reservation.reservID}</td>
                </tr>
                <tr>
                  <td><strong>วันที่จอง :</strong> ${(() => {
                    if (!reservation.reservDate) return '-';
                    const match = String(reservation.reservDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (match) {
                      const day = match[1].padStart(2, '0');
                      const month = match[2].padStart(2, '0');
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(reservation.reservDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(reservation.reservDate);
                  })()}</td>
                  <td><strong>เวลา :</strong> ${reservation.startTime} - ${reservation.endTime}</td>
                </tr>
                <tr>
                  <td><strong>โทรศัพท์ :</strong> ${reservation.cusTel || '-'}</td>
                  <td class="left" style="vertical-align: top;"><strong>จำนวน : </strong> ${(() => {
                    if (reservation && reservation.startTime && reservation.endTime) {
                      const [startH, startM] = reservation.startTime.split(":").map(Number);
                      const [endH, endM] = reservation.endTime.split(":").map(Number);
                      let hours = endH + endM/60 - (startH + startM/60);
                      return formatHourDisplay(hours);
                    }
                    return "- ชั่วโมง";
                  })()}</td>
                </tr>
              </table>
            </div>
            <div class="cusData-right">
              <table>
                <tr>
                  <td><strong>เลขที่ / No. :</strong> ${reservation.receiptNumber || '-'}</td>
                </tr>
                <tr>
                  <td><strong>วันที่ / Date :</strong> ${(() => {
                    if (!receiptDate) return '-';
                    const match = String(receiptDate).match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (match) {
                      const day = match[1];
                      const month = match[2];
                      const year = (parseInt(match[3], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    const iso = String(receiptDate).match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (iso) {
                      const day = iso[3];
                      const month = iso[2];
                      const year = (parseInt(iso[1], 10) + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    if (receiptDate instanceof Date) {
                      const day = receiptDate.getDate().toString().padStart(2, '0');
                      const month = (receiptDate.getMonth() + 1).toString().padStart(2, '0');
                      const year = (receiptDate.getFullYear() + 543).toString();
                      return `${day}/${month}/${year}`;
                    }
                    return String(receiptDate);
                  })()}</td>
                </tr>
              </table>
            </div>
          </div>
          <table>
            <tr>
              <th class="center" style="width:12%;">ลำดับที่<br>Item</th>
              <th class="center" style="width:68%;">รายการ<br>Descriptions</th>
              <!-- <th class="center" style="width:12%;">จำนวน<br>Quantity</th>
              <th class="center" style="width:20%;">ราคาต่อหน่วย<br>Unit price</th> -->
              <th class="center" style="width:20%;">จำนวนเงิน<br>Amount</th>
            </tr>
            <tr style="height: 100px; align-items: top;">
              <td class="center" style="vertical-align: top;">1</td>
              <td class="left" style="vertical-align: top;">Tennis ${(() => {
                if (reservation && reservation.startTime && reservation.endTime) {
                  const [startH, startM] = reservation.startTime.split(":").map(Number);
                  const [endH, endM] = reservation.endTime.split(":").map(Number);
                  let hours = endH + endM/60 - (startH + startM/60);
                  return formatHourDisplay(hours);
                }
                return "- ชั่วโมง";
              })()}</td>
             <!-- <td class="center" style="vertical-align: top;">1</td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td> -->
              
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <table class="amount-table">
            <tr>
              <td class="no-border" style="width:12%;"><strong>ตัวอักษร</strong></td>
              <td class="no-border" style="width:32%; "><strong>${(() => {
                // ฟังก์ชันแปลงตัวเลขเป็นข้อความไทยบาทถ้วน
                function thaiBahtText(num) {
                  if (!num || isNaN(num)) return '';
                  const thNum = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
                  const thDigit = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
                  let s = '';
                  let n = Math.floor(Number(num));
                  let str = n.toString();
                  let len = str.length;
                  for (let i = 0; i < len; i++) {
                    let digit = len - i - 1;
                    let numChar = parseInt(str[i]);
                    if (numChar !== 0) {
                      if (digit === 1 && numChar === 1) s += 'สิบ';
                      else if (digit === 1 && numChar === 2) s += 'ยี่สิบ';
                      else if (digit === 1) s += thNum[numChar] + 'สิบ';
                      else if (digit === 0 && numChar === 1 && len > 1) s += 'เอ็ด';
                      else s += thNum[numChar] + thDigit[digit];
                    }
                  }
                  return `(${s}บาทถ้วน)`;
                }
                return thaiBahtText(price);
              })()}</strong></td>
              <td class="no-border" style="width:36%; text-align: center; background-color: #dfdfdf;"><strong>ราคาสุทธิ (รวมภาษีมูลค่าเพิ่ม)</strong></td>
              <td class="right" style="vertical-align: top;">${(price !== undefined && price !== null && !isNaN(price) ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}</td>
            </tr>
          </table>
          <div class="signature">
            <div>
              <table>
                <tr>
                  <td class="no-border left" style="padding-top: 20px;">
                    <strong>ชำระโดย</strong>&nbsp; 
                    <span class="checkbox-print${paymentMethod === 'เงินสด' ? ' checked disabled' : ' disabled'}"></span>เงินสด
                    <span class="checkbox-print${paymentMethod === 'QR' ? ' checked disabled' : ' disabled'}"></span>QR
                    <span class="checkbox-print${paymentMethod === 'โอนผ่านธนาคาร' ? ' checked disabled' : ' disabled'}"></span>โอนผ่านธนาคาร
                  </td>
                </tr>
              </table>
            </div>
            <div class="signature-block">
              <p>ลงชื่อ  ___________________________</p>
              <p>(ผู้รับเงิน)</p>
            </div>
          </div>
          <div class="note" style="font-size: 10px;">
            <u>เงื่อนไขการจอง</u>&nbsp;
            : ขอสงวนสิทธิ์ไม่คืนเงินค่าบริการทุกกรณี ยกเว้นเฉพาะกรณีที่ไม่สามารถใช้สนามได้เนื่องจากฝนตกเท่านั้น
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
    </html>
    `);
    printWindow.document.close();
  };
  // ฟังก์ชันชำระเงิน
  const openPaymentModal = (price, bookingData) => {
    setPaymentAmount(price);
    setPaymentType('QR');
    setCashReceived('');
    setChange(0);
    setPaymentModalOpen(true);

    localStorage.setItem('paymentAmount', price);
    localStorage.setItem('cusName', bookingData.cusName);
    localStorage.setItem('reservID', bookingData.reservID);
    localStorage.setItem('cusTel', bookingData.cusTel);
    localStorage.setItem('reservDate', bookingData.reservDate);
    localStorage.setItem('startTime', bookingData.startTime);
    localStorage.setItem('endTime', bookingData.endTime);
  };
  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    localStorage.removeItem('paymentAmount');
    localStorage.removeItem('cusName');
    localStorage.removeItem('reservID');
    localStorage.removeItem('cusTel');
    localStorage.removeItem('reservDate');
    localStorage.removeItem('startTime');
    localStorage.removeItem('endTime');
  };
 
  // ในฟังก์ชัน handleConfirmPayment
  const handleConfirmPayment = async () => {
    if (!selectedEvent) return;

    if (selectedEvent.receiptNumber) {
      alert('รายการนี้ได้ชำระเงินและออกใบเสร็จแล้ว ไม่สามารถชำระซ้ำได้');
      return;
    }

    let method = paymentType;
    let received = null;
    let changeVal = null;
    if (paymentType === 'เงินสด') {
      received = Number(cashReceived);
      changeVal = received - paymentAmount;
      if (isNaN(received) || received < paymentAmount) {
        alert('จำนวนเงินที่รับต้องมากกว่าหรือเท่ากับยอดที่ต้องชำระ');
        return;
      }
    }

    try {
      // ส่งข้อมูลไป backend เพื่อชำระเงินและสร้างเลขใบเสร็จใน transaction เดียว
      const res = await payReservation(selectedEvent.reservID, {
        paymentMethod: method,
        received,
        changeVal,
        username: user.name,
        price: paymentAmount
      });

      // ข้อมูล reservation ที่ชำระล่าสุด
      const updated = res.data.reserv;

      setReceiptData({
        ...selectedEvent,
        paymentMethod: method,
        price: paymentAmount,
        received,
        changeVal,
        receiptNumber: updated.receiptNumber,
        receiptDate: updated.receiptDate,
        payDate: updated.payDate,
      });

      setIsReceiptModalOpen(true);
      setPaymentModalOpen(false);

      // อัปเดตข้อมูล events หลังบันทึก
      const res2 = await getReservations();
      setEvents(mapReservationsToEvents(res2.data));
    } catch (err) {
      alert('บันทึกข้อมูลการชำระเงินล้มเหลว');
    }
  };

  const buttonStyle = {
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
  };

  const handleReprintReceipt = async () => {
      if (selectedEvent.paymentMethod === 'ยังไม่ชำระเงิน') {
        alert("ยังไม่สามารถรีปริ๊นได้ เนื่องจากยังไม่ชำระเงิน");
        setReprintPassword("");
        window.location.reload();
        return;
      }
  
      try {
        const res = await checkPassword({
          username: user.username, // หรือ user.name ตาม DB
          password: reprintPassword
        });
        if (!res.data.success) {
          alert("รหัสผ่านไม่ถูกต้อง");
          return;
        }
        // ถ้ารหัสผ่านถูกต้อง
        printCopyOfReceipt(
          selectedEvent,
          selectedEvent.paymentMethod,
          selectedEvent.price || 0,
          selectedEvent.received || 0,
          selectedEvent.changeVal || 0,
          selectedEvent.receiptDate
        );
        setIsReprintOpen(false);
        setReprintPassword("");
        await reprintReceipt({
          reservID: selectedEvent.reservID,
          receiptNumber: selectedEvent.receiptNumber,
          printedAt: new Date(),
          username: user.name,
        });
      } catch (err) {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    };

  const handleProtectedNavigate = () => {
    const correctCode = "audit@022170808";
  
    if (reprintCode === correctCode) {
      window.open('/reprintReceipt', '_blank');  // เปิดแท็บใหม่
      setIsAuditOpen(false);  // ปิด modal ให้ถูกตัวด้วยนะครับ
      setReprintCode("");
    } else {
      alert("รหัสยืนยันไม่ถูกต้อง");
    }
  };

  // ฟังก์ชันเช็คว่าเป็นวันก่อนหน้าหรือวานนี้ไหม
  const isPastOrYesterday = (dateString) => {
    if (!dateString) return true;
    // dateString ในที่นี้ควรเป็น "DD/MM/YYYY"
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const reservDate = moment(dateString, 'DD/MM/YYYY').startOf('day');
    return reservDate.isBefore(today); // ถ้าเป็นวานหรือวันก่อนหน้า return true
  };


  // ดึงข้อมูล user จาก localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  const handleLogout = async () => {
    try {
      await logout(); 
      localStorage.removeItem('user'); 
      window.location.href = "/"; 
    } catch (err) {
      alert('ออกจากระบบไม่สำเร็จ');
    }
  };

  // ฟังก์ชั่นคำนวณราคา
  const calculatePrice = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let total = 0;
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes < endMinutes) {
      if (currentMinutes >= 1080) { // หลัง 18:00
        let nextMinutes = Math.min(currentMinutes + 60, endMinutes);
        total += 600 * ((nextMinutes - currentMinutes) / 60);
        currentMinutes = nextMinutes;
      } else {
        if (endMinutes > 1080 && currentMinutes + 60 > 1080) { // เศษก่อน 18:00
          let before1800 = 1080 - currentMinutes;
          total += (450 / 60) * before1800;
          currentMinutes += before1800;
        } else {
          let nextMinutes = Math.min(currentMinutes + 60, endMinutes);
          total += 450 * ((nextMinutes - currentMinutes) / 60);
          currentMinutes = nextMinutes;
        }
      }
    }
    return Math.round(total * 100) / 100;
  };

  return (
    <div className='booking-container'>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px 20px',
          backgroundColor: '#65000a',
          color: '#fff',
          marginBottom: '20px',
          flexWrap: 'wrap', // ให้รองรับหน้าจอเล็ก
          gap: '10px'
        }}
      >
        {/* Title */}
        <h1
          style={{
            margin: 0,
            fontWeight: '700',
            fontSize: '1.8rem',
            userSelect: 'none',
            letterSpacing: '1px',
            flex: '1 0 auto',
            minWidth: '180px'
          }}
        >
          Tennis Booking 
        </h1>
        {user ? `ยินดีต้อนรับ, ${user.name}` : 'กรุณาเข้าสู่ระบบ'}
        {/* Right Controls */}
        <div
          style={{
            display: 'flex',
            flex: '2',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            minWidth: '300px',
          }}
        >
        {/* Buttons */}
        <button
          onClick={() => navigate("/member")}
          style={buttonStyle}
        >
          เพิ่มสมาชิก
          </button>
          <button
            onClick={() => navigate("/saleReport")}
            style={buttonStyle}
          >
            รายงานยอดขาย
          </button>
          <div style={{
            marginTop: 'auto', // ดัน logout ไปชิดล่างสุด
            display: 'flex',
          }}>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 18px',
                fontSize: '18px',
                color: '#fff',
                backgroundColor: '#c62828',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                userSelect: 'none',
                height: '40px',
                fontFamily: '"Noto Sans Thai", sans-serif',
              }}
            >
              Logout
            </button>
          </div>
          {/* Search */}
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้จอง..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                flexGrow: 1,
                minWidth: '200px',
                maxWidth: '250px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: 16,
                fontFamily: 'Noto Sans Thai, sans-serif',
                boxSizing: 'border-box',
              }}
              onFocus={() => setShowSearchList(matchingEvents.length > 0)}
            />
            
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'row' }}>
        {showSearchList && (
          <div style={{
            position: "absolute",
            top: 50, 
            right: 0,
            zIndex: 99,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            maxHeight: 300,
            minWidth: 280,
            overflowY: "auto",
            boxShadow: "0 4px 32px rgba(0,0,0,0.13)",
          }}>
            {matchingEvents.length === 0 && <div style={{ padding: 12, color: "#888" }}>ไม่พบรายการ</div>}
            {matchingEvents.map(ev => (
              <div
                key={ev.id + String(ev.start)}
                style={{ padding: 12, cursor: "pointer", borderBottom: "1px solid #eee" }}
                onClick={() => handleSelectSearchEvent(ev)}
              >
                <b>{ev.cusName || ev.title}</b>
                <div style={{ fontSize: 13, color: "#555" }}>
                  {moment(ev.start).format("DD/MM/YYYY HH:mm")} - {moment(ev.end).format("HH:mm")}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{flex:4}}>
          <DragAndDropCalendar
            className='calendar'
            ref={calendarRef}
            localizer={calendarLocalizer}
            formats={formats}
            min={new Date(1970, 1, 1, 0, 0)}    // เริ่มต้นที่ 00:00
            max={new Date(1970, 1, 1, 23, 59)}   // สิ้นสุดที่ 23:59
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={['day', 'week', 'month']}
            style={{ 
              height: '85vh', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
              backgroundColor: '#fff',
              fontFamily: "Noto Sans Thai, sans-serif",
              width: '100%',
              fontSize: '15px',
              whiteSpace: 'pre-line'
            }}
            components={{eventWrapper: EventWrapper,}}
            selectable
            eventPropGetter={(event) => {
              let backgroundColor = '';
              let borderColor = '';
              const now = new Date(); // เวลาปัจจุบัน
              const start = new Date(event.start);
              const end = new Date(event.end);
              // ตรวจสอบว่าเวลาปัจจุบันอยู่ระหว่าง start และ end
              const isCurrent = now >= start && now <= end;

              if (isCurrent) {
                backgroundColor = '#FFD700'; // สีทอง สำหรับ event ที่กำลังเกิดขึ้น
                borderColor = '#FFA000';
              } else if (event.paymentMethod === 'ยังไม่ชำระเงิน') {
                backgroundColor = '#FF5722';
                borderColor = '#d84315';
              } else {
                backgroundColor = '#4CAF50';
                borderColor = '#388e3c';
              }
            
              return {
                style: {
                  backgroundColor,
                  color: 'white',
                  border: `2px solid ${borderColor}`,
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                  fontSize: '14px',
                  transition: 'transform 0.2s',
                }
              }
            }}
            onSelectSlot={(slotInfo) => setSelectedDate(slotInfo.start)}
            onSelectEvent={async (event) => {
              setSelectedDate(event.start);
              try {
                const res = await getReservationById(event.id);
                setSelectedEvent(res.data);
              } catch (error) {
                console.error("โหลดข้อมูลใบจองล้มเหลว", error);
              }
            }}
            onEventDrop={handleEventDrop}
          />
          
          {contextMenu && selectedEvent && (
            <div style={{ marginTop: 10, display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => printReservationForm(selectedEvent)}
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
                }}
                
              >
                ดูใบจอง
              </button>
              {!isPastOrYesterday(selectedEvent.reservDate) &&(
                 <button
                  onClick={() => {
                    setEditEventData(selectedEvent);

                    // สร้าง Date ของวันจอง + เวลา startTime/endTime เดิม
                    const [startHour, startMinute] = selectedEvent.startTime.split(':').map(Number);
                    const [endHour, endMinute] = selectedEvent.endTime.split(':').map(Number);
                    // ใช้วันที่จองเดิม
                    const [day, month, year] = selectedEvent.reservDate.split('/').map(Number);

                    const startDate = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
                    const endDate = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

                    setEditNewStart(startDate);
                    setEditNewEnd(endDate);
                    setIsEditModalOpen(true);
                  }}
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
                  }}
                >
                  แก้ไขการจอง
                </button>
              )}
              {!isPastOrYesterday(selectedEvent.reservDate) && selectedEvent.paymentMethod === 'ยังไม่ชำระเงิน' && (
                <>
                  <button
                    onClick={() => setIsCancelOpen(true)}
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
                    }}
                  >
                    ยกเลิกใบจอง
                  </button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openPaymentModal(Number(selectedEvent.price), selectedEvent)}
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
                    }}
                  >
                    ชำระเงิน
                  </Button>
                </>
              )}
              <Button
                  onClick={() => setIsReprintOpen(true)}  // เปิด Modal
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
                }}
                >
                  พิมพ์สำเนาใบเสร็จเพิ่ม
                </Button>
            </div>
          )}
          <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: 400
            }}>
              <h2>แก้ไขการจอง</h2>
              <div>หมายเลขการจอง: {editEventData?.reservID}</div>
              <div>ชื่อ: {editEventData?.cusName}</div>
              <div>
                เวลาเดิม: {editEventData?.startTime} - {editEventData?.endTime}
              </div>
              <div style={{ margin: "10px 0" }}>
                <label>วันใหม่: </label>
                <input
                  type="date"
                  value={editNewStart ? moment(editNewStart).format('YYYY-MM-DD') : ""}
                  onChange={e => {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const newStart = new Date(editNewStart);
                    const newEnd = new Date(editNewEnd);
                  
                    newStart.setFullYear(year, month - 1, day);
                    newEnd.setFullYear(year, month - 1, day);
                  
                    setEditNewStart(newStart);
                    setEditNewEnd(newEnd);
                  }}
                />
                <span style={{ marginLeft: 10, color: "#555" }}>
                  {editNewStart ? moment(editNewStart).format('DD/MM/YYYY') : ""}
                </span>
              </div>
              <div style={{ margin: "10px 0" }}>
                <label>เวลาเริ่ม: </label>
                <input
                  type="time"
                  step="60"
                  value={editNewStart ? moment(editNewStart).format('HH:mm') : ""}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const newStart = new Date(editNewStart);
                    newStart.setHours(h, m, 0, 0);
                    setEditNewStart(newStart);
                  }}
                />
              </div>
              <div style={{ margin: "10px 0" }}>
                <label>เวลาเสร็จ: </label>
                <input
                  type="time"
                  step="60"
                  value={editNewEnd ? moment(editNewEnd).format('HH:mm') : ""}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const newEnd = new Date(editNewEnd);
                    newEnd.setHours(h, m, 0, 0);
                    setEditNewEnd(newEnd);
                  }}
                />
              </div>
              <div>
                <strong>จำนวนชั่วโมง:</strong> {
                  editNewStart && editNewEnd
                  ? ((editNewEnd - editNewStart) / (1000 * 60 * 60)).toFixed(2)
                  : "-"
                } ชั่วโมง
              </div>
              <div>
                <strong>ราคา:</strong> {editEventData?.price} บาท
              </div>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    if (!editNewStart || !editNewEnd) {
                      alert('กรุณาเลือกวันและเวลาเริ่ม-สิ้นสุดใหม่');
                      return;
                    }
                    // เพิ่มเงื่อนไขนี้ (เปรียบเทียบกับเวลาปัจจุบัน)
                    const now = new Date();
                    if (editNewStart < now) {
                      alert('ไม่สามารถย้ายไปวันหรือเวลาก่อนเวลาปัจจุบันได้');
                      return;
                    }
                    // เช็คชั่วโมงเท่าเดิม
                    const oldDuration = (
                      (parseInt(editEventData.endTime.split(':')[0]) * 60 + parseInt(editEventData.endTime.split(':')[1]))
                      - (parseInt(editEventData.startTime.split(':')[0]) * 60 + parseInt(editEventData.startTime.split(':')[1]))
                    ) / 60;
                    const newDuration = ((editNewEnd - editNewStart) / (1000 * 60 * 60));
                    if (Math.abs(newDuration - oldDuration) > 0.01) {
                      alert('จำนวนชั่วโมงต้องเท่าเดิม');
                      return;
                    }
                    // เช็คราคาใหม่ต้องเท่าราคาเดิม
                    const startStr = moment(editNewStart).format('HH:mm');
                    const endStr = moment(editNewEnd).format('HH:mm');
                    const newPrice = calculatePrice(startStr, endStr);
                    if (Number(newPrice) !== Number(editEventData.price)) {
                      alert(`ราคารวมต้องเท่ากับเดิม (${editEventData.price} บาท)`);
                      return;
                    }
                    try {
                      const updatedData = {
                        reservID: editEventData.reservID,
                        startTime: startStr,
                        endTime: endStr,
                        reservDate: moment(editNewStart).format('DD/MM/YYYY'),
                        changer: user?.name || user?.username,
                        oldStart: `${editEventData.reservDate} ${editEventData.startTime}`,
                        oldEnd: `${editEventData.reservDate} ${editEventData.endTime}`,
                        newStart: moment(editNewStart).format('DD/MM/YYYY HH:mm'),
                        newEnd: moment(editNewEnd).format('DD/MM/YYYY HH:mm'),
                        changeTime: moment().format('DD/MM/YYYY HH:mm:ss'),
                      };
                      await updateReservations(editEventData.reservID, updatedData);
                      const res = await getReservations();
                      setEvents(mapReservationsToEvents(res.data));
                      setIsEditModalOpen(false);
                      window.location.reload();
                    } catch (error) {
                      alert('อัปเดตล้มเหลว');
                    }
                  }}
                >
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={isAuditOpen} onClose={() => setIsAuditOpen(false)}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: 400
            }}>
              <h2>Audit</h2>
              <p>กรุณากรอกรหัสยืนยัน:</p>
              <input
                type="password"
                value={reprintCode}
                onChange={(e) => setReprintCode(e.target.value)} // แก้ตรงนี้ ให้ set state ตัวถูกต้อง
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                autoFocus
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => {
                  setIsAuditOpen(false);
                  setReprintCode('');
                }}>
                  ยกเลิก
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProtectedNavigate}
                >
                  ยืนยัน
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={isReprintOpen} onClose={() => setIsReprintOpen(false)}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: 400
            }}>
              <h2>รีปริ๊นใบเสร็จ</h2>
              <p>กรุณากรอกรหัสผ่านของคุณเพื่อยืนยัน:</p>
              <input
                type="password"
                value={reprintPassword}
                onChange={e => setReprintPassword(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setIsReprintOpen(false)}>ยกเลิก</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleReprintReceipt}
                >
                  ยืนยัน
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: 400
            }}>
              <h2>ยืนยันการเปลี่ยนแปลง</h2>
              <p><strong>เลขใบจอง:</strong> {draggedEvent?.id}</p>
              <p><strong>เวลาเดิม:</strong> {moment(draggedEvent?.start).format('DD/MM/YYYY HH:mm')} - {moment(draggedEvent?.end).format('HH:mm')}</p>
              <p><strong>เวลาใหม่:</strong> {moment(newStart).format('DD/MM/YYYY HH:mm')} - {moment(newEnd).format('HH:mm')}</p>
              <p style={{color: 'red'}}><strong>กรุณาเรียกเก็บใบจองเดิมจากลูกค้า</strong></p>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    try {
                      const updatedData = {
                        reservID: draggedEvent.id,
                        startTime: moment(newStart).format('HH:mm'),
                        endTime: moment(newEnd).format('HH:mm'),
                        reservDate: moment(newStart).format('DD/MM/YYYY'),
                        changer: user?.name || user?.username,
                        oldStart: moment(draggedEvent.start).format('DD/MM/YYYY HH:mm'),
                        oldEnd: moment(draggedEvent.end).format('DD/MM/YYYY HH:mm'),
                        newStart: moment(newStart).format('DD/MM/YYYY HH:mm'),
                        newEnd: moment(newEnd).format('DD/MM/YYYY HH:mm'),
                        changeTime: moment().format('DD/MM/YYYY HH:mm:ss'), // ⭐️ เพิ่มเวลาที่เปลี่ยน
                      };
                      await updateReservations(draggedEvent.id, updatedData);
                      const res = await getReservations();
                      const mappedEvents = mapReservationsToEvents(res.data);
                      setEvents(mappedEvents);
                      setIsModalOpen(false);
                      window.location.reload();
                    } catch (error) {
                      console.error("อัปเดตล้มเหลว", error);
                    }
                  }}
                >
                  ยืนยัน
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={isCancelOpen} onClose={() => setIsCancelOpen(false)}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,
              width: 400
            }}>
              <h2>ยืนยันการยกเลิกใบจอง</h2>
              <p><strong>เลขใบจอง:</strong> {selectedEvent?.reservID}</p>
              <p><strong>วันเวลา:</strong> {moment(selectedEvent?.start).format('DD/MM/YYYY HH:mm')} - {moment(selectedEvent?.end).format('HH:mm')}</p>
              <p style={{ color: 'red' }}><strong>คุณแน่ใจหรือไม่ว่าต้องการลบใบจองนี้?</strong></p>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setIsCancelOpen(false)}>ยกเลิก</Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    if (selectedEvent?.reservID) {
                      handleDeleteReservation(selectedEvent.reservID , user.name);
                      setIsCancelOpen(false);
                    } else {
                      console.error("ไม่พบ reservID ใน selectedEvent");
                    }
                  }}
                >
                  ยืนยันยกเลิก
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal
            open={paymentModalOpen}
            onClose={closePaymentModal}
            aria-labelledby="payment-modal-title"
            aria-describedby="payment-modal-description"
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 450,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
                textAlign: 'center'
              }}
            >
              <h2>เลือกวิธีชำระเงิน</h2>
              <RadioGroup
                row
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
                sx={{ justifyContent: 'center', mb: 2 }}
              >
                <FormControlLabel value="QR" control={<Radio />} label="QR" />
                <FormControlLabel value="เงินสด" control={<Radio />} label="เงินสด" />
                <FormControlLabel value="โอนผ่านธนาคาร" control={<Radio />} label="โอนผ่านธนาคาร" />
              </RadioGroup>
              <p>ยอดชำระ {paymentAmount} บาท</p>
              {paymentType === 'QR' && (
                <>
                  <QRCodeCanvas value={qrPayload} size={220} />
                  <div style={{ margin: '10px 0 0 0', fontSize: 13 }}>พร้อมเพย์: {paymentPromptPayID}</div>
                </>
              )}
              {paymentType === 'เงินสด' && (
                <div style={{ marginTop: 16 }}>
                  <TextField
                    label="จำนวนเงินที่รับ"
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    InputProps={{ inputProps: { min: paymentAmount } }}
                    sx={{ width: 180 }}
                  />
                  <div style={{ marginTop: 10, fontSize: 15 }}>
                    เงินทอน: <b>{change}</b> บาท
                  </div>
                </div>
              )}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={closePaymentModal}>ยกเลิก</Button>
                <Button
                  variant="contained" color="success"
                  onClick={handleConfirmPayment}
                >ยืนยัน</Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)}>
            <Box sx={{ p: 3 , backgroundColor: 'white', borderRadius: 2, boxShadow: 24, width: 400, margin: 'auto', marginTop: '10%' }}>
              <h2>ใบเสร็จรับเงิน</h2>
              {receiptData && (
                <div>
                  <div>เลขที่ใบจอง: {receiptData.reservID}</div>
                  <div>ชื่อผู้จอง: {receiptData.cusName}</div>
                  <div>ยอดที่ชำระ: {receiptData.price} บาท</div>
                  <div>วิธีชำระเงิน: {receiptData.paymentMethod}</div>
                  {receiptData.paymentMethod === 'เงินสด' && (
                    <>
                      <div>จำนวนเงินที่รับ: {receiptData.received} บาท</div>
                      <div>เงินทอน: {receiptData.changeVal} บาท</div>
                    </>
                  )}
                  <Button sx={{ mt: 2 }} variant="contained" onClick={() => {
                    printReceipt(receiptData, receiptData.paymentMethod, receiptData.price, receiptData.received, receiptData.changeVal, receiptData.receiptDate);
                    setIsReceiptModalOpen(false);
                  }}>พิมพ์ใบเสร็จ (A5)</Button>
                </div>
              )}
            </Box>
          </Modal>
        </div>
        <div style={{ 
            flex: 1, 
            padding: '25px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
            borderRadius: '12px', 
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
            backgroundColor: '#fff' 
          }}>
          {isPastDate(selectedDate) ? (
            <p style={{ color: 'red' }}>ไม่สามารถจองวันย้อนหลังได้</p>
          ) : (
            <Reservation selectedDate={formatDate(selectedDate)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
