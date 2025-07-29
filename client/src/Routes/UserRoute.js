import React from 'react';
import { Navigate } from 'react-router-dom';

const UserRoute = ({ children }) => {
  // ดึงข้อมูล user จาก localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  // ถ้าไม่มี user หรือ role ไม่ใช่ cashier ให้ redirect กลับไปหน้า login
  if (!user || user.role !== 'cashier') {
    return <Navigate to="/" replace />;
  }
  // ถ้า role ถูกต้อง ให้ render children ได้
  return <>{children}</>;
};

export default UserRoute;