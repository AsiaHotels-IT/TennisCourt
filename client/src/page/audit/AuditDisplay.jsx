import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import generatePayload from 'promptpay-qr';

const AuditDisplay = () => {
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [bookingInfo, setBookingInfo] = useState({});

  const loadData = () => {
    const info = {
      cusName: localStorage.getItem('cusName') || '-',
      reservID: localStorage.getItem('reservID') || '-',
      cusTel: localStorage.getItem('cusTel') || '-',
      reservDate: localStorage.getItem('reservDate') || '-',
      startTime: localStorage.getItem('startTime') || '-',
      endTime: localStorage.getItem('endTime') || '-',
      status: localStorage.getItem('status') || '-',
      paymentMethod: localStorage.getItem('paymentMethod') || '-',
      refPerson: localStorage.getItem('refPerson') || '-'
    };
    setBookingInfo(info);
    const amount = Number(localStorage.getItem('paymentAmount')) || 0;
    setPaymentAmount(amount);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const promptpayID = process.env.REACT_APP_PROMYPAY_API;
  const payload = generatePayload(promptpayID, { amount: paymentAmount });

  return (
    <div>
      <h1 style={{
        color: '#2b6777',
        marginBottom: '20px',
        fontSize: '30px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
      }}>Please Make a Payment</h1>
      <div  style={{
          background: 'linear-gradient(to bottom, #e8f0fe, #ffffff)',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'row',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Noto Sans Thai, sans-serif',
        }}>
        <div>
          <div style={{
            background: '#ffffff',
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            marginBottom: '30px',
            textAlign: 'center',
            width: '400px'
          }}>
            <QRCodeCanvas value={payload} size={320} />
            <p style={{ fontSize: '28px', color: '#ff5e57', marginTop: '20px', fontWeight: 'bold' }}>
              Amount: {paymentAmount.toFixed(2)} THB
            </p>
          </div>
        </div>
        <div>
          <div style={{
                background: '#ffffff',
                padding: '30px',
                borderRadius: '20px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                width: '500px',
                fontSize: '22px',
                color: '#333'
              }}>
                <h2 style={{ marginBottom: '20px', color: '#2b6777', fontSize: '28px' }}>Booking Information</h2>
                <div style={{ lineHeight: '2' }}>
                  <div><b>ReservID:</b> {bookingInfo.reservID}</div>
                  <div><b>Name:</b> {bookingInfo.cusName}</div>
                  <div><b>Phone:</b> {bookingInfo.cusTel}</div>
                  <div><b>Booking Date:</b> {bookingInfo.reservDate}</div>
                  <div><b>Time:</b> {bookingInfo.startTime} - {bookingInfo.endTime}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDisplay;
