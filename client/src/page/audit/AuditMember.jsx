import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { addMember } from '../../function/auth';
import AuditSearch from './AuditSearch';

const AuditMember = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cusName: '',
    cusTel: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value, username: user.name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMember(formData);
      window.location.reload();
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data === 'เบอร์นี้มีอยู่ในระบบแล้ว') {
        alert('เบอร์นี้มีอยู่ในระบบแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    }
  };

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div style={{ fontFamily: 'Noto Sans Thai, sans-serif'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#65000a', padding: 20 }}>
        <h2 style={{ margin: 0, color: '#fff' }}>สมัครสมาชิก</h2>
        <button 
          onClick={() => navigate('/auditBooking')}  
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
            fontFamily: 'Noto Sans Thai, sans-serif'
          }}
        >
          กลับไปที่หน้าจอง
        </button>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'row', gap: '15px', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>ชื่อ:</label>
          <input 
            type="text" 
            name="cusName" 
            value={formData.cusName} 
            onChange={handleChange} 
            required 
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
        </div>
          
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>เบอร์โทรศัพท์:</label>
          <input 
            type="tel" 
            name="cusTel" 
            value={formData.cusTel} 
            onChange={handleChange} 
            required 
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
        </div>
          
        <button 
          type="submit" 
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
            fontFamily: 'Noto Sans Thai, sans-serif',
          }}
        >
          สมัครสมาชิก
        </button>
      </form>
      <div>
        <AuditSearch/>
      </div>
    </div>
  )
}

export default AuditMember