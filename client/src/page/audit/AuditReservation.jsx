import React, { useState, useEffect } from 'react';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { createReservations } from '../../function/reservation';
import logo from '../../img/logo.png'; 
import moment from 'moment';

// ฟังก์ชั่นคำนวณราคา (ช่วงเวลา + นาที)
const calculatePrice = (start, end) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let total = 0;
  let currentH = startH;
  let currentM = startM;

  while (currentH < endH || (currentH === endH && currentM < endM)) {
    let nextHour = currentH + 1;
    let nextMinute = 0;

    let minutes = 60;
    if (nextHour > endH || (nextHour === endH && endM === 0)) {
      minutes = (endH * 60 + endM) - (currentH * 60 + currentM);
      if (minutes <= 0) break;
    }

    if (currentH >= 7 && currentH < 18) {
      total += (450 / 60) * minutes;
    } else if (currentH >= 18 && currentH < 22) {
      total += (600 / 60) * minutes;
    }
    currentH = nextHour;
    currentM = nextMinute;
  }
  return Math.round(total * 100) / 100; // ทศนิยม 2 ตำแหน่ง
};

// ฟังก์ชั่นคำนวณ VAT
const calculateVat = (amount, vatRate = 0.07) => {
  const beforeVat = +(amount / (1 + vatRate)).toFixed(2);
  const vat = +(amount - beforeVat).toFixed(2);
  return { beforeVat, vat, amount: +amount.toFixed(2) };
};

const Reservation = ({ selectedDate }) => {
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [price, setPrice] = useState(0);
  const [beforeVat, setBeforeVat] = useState(0);
  const [vat, setVat] = useState(0);
  const [error, setError] = useState('');
  const [memberID, setMemberID] = useState('');
  const [cusName, setCusName] = useState('');
  const [cusTel, setCusTel] = useState('');
  const [refPerson, setRefPerson] = useState('');

  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (endTotal <= startTotal) {
        setPrice(0);
        setBeforeVat(0);
        setVat(0);
        setError('กรุณาเลือกเวลาที่ถูกต้อง (เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น)');
      } else {
        const amount = calculatePrice(startTime, endTime);
        const { beforeVat, vat } = calculateVat(amount);
        setPrice(amount);
        setBeforeVat(beforeVat);
        setVat(vat);
        setError('');
      }
    }
  }, [startTime, endTime]);

  const handleAddBooking = async (e) => {
    e.preventDefault();

    // สร้าง moment ของวันและเวลาเริ่มจอง
    const bookingStart = moment(`${selectedDate} ${startTime}`, 'DD/MM/YYYY HH:mm');
    const now = moment();

    if (bookingStart.isSameOrBefore(now)) {
      alert('ไม่สามารถจองในเวลาที่ผ่านมาแล้ว กรุณาเลือกวันและเวลาใหม่');
      return;
    }

    try {
      const payload = {
        memberID,
        cusName,
        cusTel,
        refPerson,
        reservDate: selectedDate,
        startTime,
        endTime,
        price,
        beforeVat: beforeVat,
        vat: vat,
        username: user.name,
      };

      const response = await createReservations(payload);

      alert('จองสนามสำเร็จ');
      window.location.reload();

    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('มีการจองในเวลานั้นแล้ว กรุณาเลือกเวลาอื่น');
      }
    }
  };

  const printReservationForm = (reservation) => {
    const reservDate = reservation.reservDate;
    const startTime = reservation.startTime;
    const endTime = reservation.endTime;

    printReservationFormContent({
      reservID: reservation.reservID,
      memID: reservation.memberID || '-',
      paymentMethod: reservation.paymentMethod || '-',
      reffPerson: reservation.refPerson || '-',
      cusName: reservation.cusName,
      cusTel: reservation.cusTel || '-',
      selectedDate: reservDate,
      startTime,
      endTime,
      price: price || '-',
      beforeVat: beforeVat || '-',
      vat: vat || '-',
      createAt: moment(reservation.createAt).format('DD/MM/YYYY HH:mm') || '-'
    });
  };

  const printReservationFormContent = ({ cusName, cusTel, selectedDate, startTime, endTime, price, beforeVat, vat, reservID, memID, paymentMethod, reffPerson, createAt }) => {
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
              margin: 20px 0 10px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 14pt;
              margin-bottom: 10px;
            }
            .reservation-details {
              border: 1px solid #000;
              border-radius: 10px;
              padding: 20px;
              background-color: #fff;
              margin-top: 10px;
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
              justify-content: space-between;
              padding: 0 20px;
            }
            .signature-block {
              text-align: center;
              width: 40%;
              font-size: 14pt;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logo}" alt="Logo">    
              <h2>โรงแรมเอเชีย</h2>
              <p>296 ถนนพญาไท แขวงถนนเพชรบุรี เขตราชเทวี กรุงเทพมหานคร 10400</p>  
              <div class="contact-info">
                <p><strong>โทรศัพท์:</strong> 02-217-0808 &nbsp; <strong>อีเมล:</strong> booking@asiahotel.co.th</p>
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
              <div class="detail-row"><span class="label">มูลค่าก่อนภาษี:</span><span class="value">${beforeVat} บาท</span></div>
              <div class="detail-row"><span class="label">ภาษีมูลค่าเพิ่ม:</span><span class="value">${vat} บาท</span></div>
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
                <p>ลงชื่อ....................................</p>
                <p>(พนักงาน)</p>
              </div>
              <div class="signature-block">
                <p>ลงชื่อ....................................</p>
                <p>(ลูกค้า)</p>
              </div>
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

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
    fontSize: '15px',
    userSelect: 'none',
  };

  const inputStyle = {
    marginTop: '6px',
    padding: '10px 12px',
    width: '100%',
    borderRadius: '6px',
    border: '1.8px solid #ddd',
    fontSize: '15px',
    boxSizing: 'border-box',
    outlineColor: '#4caf50',
    transition: 'border-color 0.3s ease',
  };

  const timePickerStyle = {
    width: '100%',
    marginTop: '6px',
    borderRadius: '6px',
    border: '1.8px solid #ddd',
    padding: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
  };

  //ดึงข้อมูล user จาก localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div style={{  
      padding: '5px', 
      borderRadius: '12px', 
      fontFamily: "Noto Sans Thai, sans-serif", 
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 600,
      position: 'relative'
    }}>
      <div style={{ marginBottom: '25px', borderBottom: '2px solid #65000a', paddingBottom: '8px' }}>
        <h2 style={{ color: '#65000a', margin: 0 }}>รายละเอียดการจอง</h2>
        {selectedDate ? (
          <p style={{ color: '#555', fontSize: '14px', marginTop: '5px' }}>
            วันที่จอง: <strong>{selectedDate}</strong>
          </p>
        ) : (
          <p style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
            ไม่ได้รับวันที่จากหน้าก่อนหน้า
          </p>
        )}
      </div>
      
      <form>
        <label style={labelStyle}>
          หมายเลขสมาชิก (ถ้ามี) :
          <input type="text" value={memberID} onChange={(e) => setMemberID(e.target.value)} style={inputStyle} />
        </label>
      
        <label style={labelStyle}>
          ชื่อลูกค้า :
          <input type="text" value={cusName} onChange={(e) => setCusName(e.target.value)} style={inputStyle} />
        </label>
      
        <label style={labelStyle}>
          เบอร์ติดต่อ :
          <input type="tel" value={cusTel} onChange={(e) => setCusTel(e.target.value)} style={inputStyle} />
        </label>
      
        <label style={labelStyle}>
          บุคคลอ้างอิง (ถ้ามี) :
          <input type="text" value={refPerson} onChange={(e) => setRefPerson(e.target.value)} style={inputStyle} />
        </label>
      
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '30px 0' }}>
          <label style={{ ...labelStyle, flex: 1, marginRight: '10px' }}>
            เวลาเริ่ม:
            <TimePicker
              onChange={setStartTime}
              value={startTime}
              format="HH:mm"
              disableClock={true}
              hourPlaceholder="hh"
              minutePlaceholder="mm"
              minTime="00:00"
              maxTime="23:30"
              clearIcon={null}
              required
              style={timePickerStyle}
            />
          </label>
      
          <label style={{ ...labelStyle, flex: 1, marginLeft: '10px' }}>
            เวลาสิ้นสุด:
            <TimePicker
              onChange={setEndTime}
              value={endTime}
              format="HH:mm"
              disableClock={true}
              hourPlaceholder="hh"
              minutePlaceholder="mm"
              minTime="00:00"
              maxTime="23:30"
              clearIcon={null}
              required
              style={timePickerStyle}
            />
          </label>
        </div>
      
        {error && (
          <p style={{ color: 'red', marginBottom: '15px', fontSize: '13px', justifyContent: 'center' }}>
            {error}
          </p>
        )}

        <div style={{ marginBottom: '18px', fontSize: '15px' }}>
          <div>มูลค่าก่อนภาษี: <strong>{beforeVat}</strong> บาท</div>
          <div>ภาษีมูลค่าเพิ่ม (VAT 7%): <strong>{vat}</strong> บาท</div>
          <div>ราคารวมทั้งสิ้น: <strong>{price}</strong> บาท</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleAddBooking}
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
            เพิ่มข้อมูล
          </button>
        </div>
      </form>
    </div>
  );
};

export default Reservation;