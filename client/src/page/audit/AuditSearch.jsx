import React, { useState, useEffect } from 'react';
import { listMember } from '../../function/auth';

const AuditSearch = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [reservPage, setReservPage] = useState(1);
  const reservPerPage = 5; // จำนวนแถวต่อหน้า

  const loadMembers = async () => {
    try {
      const res = await listMember();
      setMembers(res.data);
    } catch (error) {
      console.error("Failed to load members", error);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = members.filter(member =>
    member.cusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.cusTel.includes(searchTerm) ||
    String(member.memberID).includes(searchTerm)
  );

  // คำนวณ pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row',}}>
      <div style={{ padding: '20px', fontFamily: 'Arial', width: '50%',  fontFamily: 'Noto Sans Thai, sans-serif'  }}>
        <h2>ค้นหาสมาชิก</h2>
        <input
          type="text"
          placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรือรหัสสมาชิก"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset ไปหน้าแรกเมื่อค้นหาใหม่
          }}
          style={{
            padding: '8px',
            width: '300px',
            marginBottom: '20px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={thStyle}>รหัสสมาชิก</th>
              <th style={thStyle}>ชื่อ</th>
              <th style={thStyle}>เบอร์โทร</th>
              <th style={thStyle}>คะแนน</th>
              <th style={thStyle}>วันที่เริ่มเป็นสมาชิก</th>
              <th style={thStyle}>การจอง</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((member) => (
                <tr key={member.memberID}>
                  <td style={tdStyle}>{member.memberID}</td>
                  <td style={tdStyle}>{member.cusName}</td>
                  <td style={tdStyle}>{member.cusTel}</td>
                  <td style={tdStyle}>{member.memberPoint}</td>
                  <td style={tdStyle}>{new Date(member.memberStart).toLocaleDateString('th-TH')}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => {
                        setSelectedReservation(member.reservationBefore);
                        setReservPage(1);  // reset หน้าของการจอง
                      }}
                      style={{
                        padding: '6px 18px',
                        fontSize: '14px',
                        color: '#65000a',
                        backgroundColor: '#d7ba80',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                        userSelect: 'none',
                        height: '40px',
                        fontFamily: 'Noto Sans Thai, sans-serif',
                      }}
                    >
                      ดูข้อมูลการจอง
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={tdStyle} colSpan="6">ไม่พบข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ส่วน pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '20px' }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                style={{
                  padding: '8px 12px',
                  margin: '0 5px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: currentPage === (i + 1) ? '#007bff' : '#fff',
                  color: currentPage === (i + 1) ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '20px', fontFamily: 'Arial', width: '50%', borderLeft: '1px solid #ccc',  fontFamily: 'Noto Sans Thai, sans-serif'  }}>
        <h3>รายละเอียดการจอง</h3>
        {selectedReservation.length > 0 ? (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={thStyle}>เลขที่ใบจอง</th>
                <th style={thStyle}>วันที่</th>
                <th style={thStyle}>เวลา</th>
                <th style={thStyle}>ยอดเงิน</th>
                <th style={thStyle}>การชำระเงิน</th>
                <th style={thStyle}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {selectedReservation.map((res, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{res.reservID}</td>
                  <td style={tdStyle}>{res.reservDate}</td>
                  <td style={tdStyle}>{res.startTime} - {res.endTime}</td>
                  <td style={tdStyle}>{res.amount} บาท</td>
                  <td style={tdStyle}>{res.paymentMethod}</td>
                  <td style={tdStyle}>{res.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>ไม่มีประวัติการจอง</p>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left'
};

const tdStyle = {
  border: '1px solid #ddd',
  padding: '8px'
};

export default AuditSearch;
