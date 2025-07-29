const express = require('express');
const { readdirSync } = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const session = require('express-session');

const app = express();

// เชื่อมต่อฐานข้อมูล
connectDB();

app.use(morgan('dev'));
app.use(cors({
  origin: true,
  credentials: true // ให้ browser ส่ง cookie ไปกับ request
}));
app.use(express.json({ limit: '10mb' }));

// ใช้ session-based authentication
app.use(session({
  secret: 'yourStrongSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // ถ้า production ต้องใช้ true และ https
    sameSite: 'lax', // หรือ 'strict' ถ้าไม่ cross-domain
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// เสิร์ฟไฟล์ frontend build
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// โหลด routes ทั้งหมดจากโฟลเดอร์ Routes
readdirSync('./Routes').map((r) => app.use('/api', require('./Routes/' + r)));

// ตัวอย่าง protected route ใช้ sessionAuth middleware
app.get('/api/current-user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  res.json({ user: req.session.user });
});

// Start server ใช้แค่ app.listen
const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));