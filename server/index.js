require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..');
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'app.db');

app.disable('x-powered-by');
/* Cho phép gọi API từ Live Server / cổng khác cùng máy (credentials + cookie phiên) */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'vth.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-doi-khi-trien-khai',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.SESSION_COOKIE_SECURE === 'true',
    },
  })
);

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

app.post('/api/register', (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
  }
  const emailNorm = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ error: 'Email không hợp lệ.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự.' });
  }

  try {
    if (db.emailExists(emailNorm)) {
      return res.status(409).json({ error: 'Email này đã được đăng ký.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const name = String(full_name || '').trim() || null;
    const id = db.createUser(emailNorm, hash, name);

    req.session.userId = id;
    return res.json({
      ok: true,
      user: { id, email: emailNorm, full_name: name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau.' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
  }
  const emailNorm = normalizeEmail(email);

  try {
    const row = db.getUserByEmail(emailNorm);
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    req.session.userId = row.id;
    return res.json({ ok: true, user: { id: row.id, email: row.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.clearCookie('vth.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  try {
    const row = db.getUserById(req.session.userId);
    if (!row) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }
    return res.json({ user: row });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
});

app.use(express.static(publicDir, { index: 'index.html' }));

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Vi Tính Anh Huy — http://localhost:${PORT}`);
      console.log(`CSDL: ${dbPath}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
