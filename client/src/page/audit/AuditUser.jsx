import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../function/auth';
import { getAllUser } from '../../function/user';

const AuditUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  // โหลดรายชื่อผู้ใช้
  const fetchUsers = async () => {
    try {
      const res = await getAllUser();
      setUsers(res.data);
    } catch (err) {
      setError('โหลดรายชื่อผู้ใช้งานล้มเหลว');
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register({
        ...formData,
        adder: user.name || user.username,
      });
      setSuccess('เพิ่มผู้ใช้งานสำเร็จ');
      setFormData({ username: '', name: '', password: '', role: '' });
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data || 'เกิดข้อผิดพลาด');
    }
  };

  // ฟิลเตอร์ผู้ใช้ตาม search
  const filteredUsers = users.filter(u =>
    (u.username + u.name + u.role + (u.adder || ''))
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'Noto Sans Thai, sans-serif', background: "#f7f3e9", minHeight: "100vh" }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        backgroundColor: '#65000a',
        padding: 20,
        borderRadius: 8,
      }}>
        <h2 style={{ margin: 0, color: '#fff' }}>เพิ่มผู้ใช้งานระบบ (Auditor เท่านั้น)</h2>
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
            userSelect: 'none',
            height: '40px',
            fontFamily: 'Noto Sans Thai, sans-serif',
            fontWeight: 600,
          }}
        >
          กลับไปที่หน้าจอง
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '15px',
        alignItems: 'center',
        padding: '0 20px',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              minWidth: 120
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>ชื่อ-นามสกุล:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              minWidth: 150
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              minWidth: 120
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>Role:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              minWidth: 110,
              background: '#fff'
            }}
          >
            <option value="">เลือกสิทธิ์</option>
            <option value="auditor">Auditor</option>
            <option value="cashier">Cashier</option>
          </select>
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
            userSelect: 'none',
            height: '40px',
            fontFamily: 'Noto Sans Thai, sans-serif',
            fontWeight: 600,
          }}
        >
          เพิ่มผู้ใช้งาน
        </button>
      </form>

      {(error || success) && (
        <div style={{ paddingLeft: 20, marginTop: 10 }}>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {success && <div style={{ color: 'green' }}>{success}</div>}
        </div>
      )}

      <div style={{
        width: 'auto',
        margin: "40px auto",
        background: "#fff",
        borderRadius: 8,
        padding: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#65000a' }}>รายชื่อผู้ใช้งานระบบ</h3>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="ค้นหาผู้ใช้งาน..."
            style={{
              padding: '8px 14px',
              border: '1px solid #a97a50',
              borderRadius: 7,
              outline: 'none',
              minWidth: 200,
              fontSize: 16,
              fontFamily: 'Noto Sans Thai, sans-serif'
            }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #eee', padding: '8px' }}>#</th>
                <th style={{ border: '1px solid #eee', padding: '8px' }}>Username</th>
                <th style={{ border: '1px solid #eee', padding: '8px' }}>ชื่อ-นามสกุล</th>
                <th style={{ border: '1px solid #eee', padding: '8px' }}>Role</th>
                <th style={{ border: '1px solid #eee', padding: '8px' }}>เพิ่มโดย</th>
                <th style={{ border: '1px solid #eee', padding: '8px' }}>วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 12 }}>ไม่พบข้อมูล</td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u._id || idx} style={{ background: idx % 2 === 0 ? "#f7f3e9" : "#fff" }}>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{u.username}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{u.name}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{u.role}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{u.adder}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleString('th-TH', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditUser;