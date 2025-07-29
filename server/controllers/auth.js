const User = require('../model/user');

// สมัครสมาชิก
exports.register = async (req, res) => {
  try {
    const { username, password, role, adder,name } = req.body; // ✅ ดึง adder มาด้วย
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).send('User already exists!!');
    }
    user = new User({
      username,
      name,
      password, // (ควร hash password)
      role,
      adder
    });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error(err); // ดู error log ที่แท้จริง
    res.status(500).send('Server Error');
  }
};

// ล็อกอิน
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('User not found...');
    }
    if (password !== user.password) {
      return res.status(400).send('Password is not correct');
    }
    // เก็บ user info ใน session
    req.session.user = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    };
    res.send({ success: true, user: req.session.user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// logout
exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.send({ success: true });
  });
};

exports.checkPassword = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }); // หรือใช้ field user.name ถ้าระบบคุณใช้ชื่อคน
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    if (user.password !== password) {
      return res.status(400).json({ success: false, message: "Password incorrect" });
    }
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};