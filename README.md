# Vi Tính Anh Huy

Website giới thiệu Vi Tính Anh Huy - Máy tính, linh kiện, thu cũ đổi mới.

## Công nghệ

- HTML5, CSS3
- Font: Roboto (Google Fonts)
- Backend (tuỳ chọn): Node.js + Express + SQLite (`server/`)
- Docker: `Dockerfile` + `docker-compose.yml`

## Cấu trúc

- `index.html` - Trang chủ (header, banner, sản phẩm nổi bật, modal đăng nhập/đăng ký)
- `css.css` - Toàn bộ style
- `server/` - API đăng ký, đăng nhập, phiên làm việc (cookie), lưu CSDL SQL (file SQLite)

## Chạy local

### Chỉ xem giao diện

Mở file `index.html` bằng trình duyệt hoặc dùng Live Server. Chức năng đăng nhập cần chạy server bên dưới (cùng origin mới gửi được cookie session).

### Đăng nhập / đăng ký (CSDL)

1. Cài [Node.js](https://nodejs.org/) (khuyến nghị 18+).
2. Trong thư mục `server/`: chạy `npm install`.
3. (Khuyến nghị) Sao chép `server/.env.example` thành `server/.env` và đặt `SESSION_SECRET` ngẫu nhiên, dài.
4. Chạy `npm start` trong `server/`.
5. Mở trình duyệt tại **http://localhost:3000** (không mở file HTML trực tiếp).

Dữ liệu người dùng lưu tại `server/data/app.db` (SQLite, qua thư viện `sql.js` — không cần cài SQL Server). Có thể đổi đường dẫn bằng biến môi trường `DB_PATH` trong `server/.env`.

### API

| Phương thức | Đường dẫn | Mô tả |
|-------------|-----------|--------|
| POST | `/api/register` | JSON: `email`, `password`, `full_name` (tuỳ chọn) |
| POST | `/api/login` | JSON: `email`, `password` |
| POST | `/api/logout` | Kết thúc phiên |
| GET | `/api/me` | Thông tin user đăng nhập hoặc `null` |

### Không kết nối được máy chủ khi đăng ký

- Phải chạy backend: trong `server/` gõ `npm install` rồi `npm start`.
- Mở site tại **http://localhost:3000** (cùng máy chủ với API), **hoặc** dùng Live Server / cổng khác nhưng vẫn phải có `npm start` (API cổng **3000**). Trang đã tự trỏ API về `http://127.0.0.1:3000` khi phát hiện cổng khác.
- Không mở `index.html` bằng double-click (`file://`) nếu muốn phiên đăng nhập ổn định — nên dùng `localhost:3000`.

## Chạy bằng Docker

Cần [Docker](https://docs.docker.com/get-docker/) và Docker Compose (Compose V2: lệnh `docker compose`).

```bash
docker compose up --build
```

Mở **http://localhost:3000**. SQLite được lưu trong volume Docker `vitinh-sqlite` (dữ liệu không mất khi tắt container).

Tuỳ chọn: tạo file `.env` cùng cấp `docker-compose.yml`:

```env
SESSION_SECRET=chuoi-bi-mat-dai-va-ngau-nhien
SESSION_COOKIE_SECURE=false
```

Khi triển khai sau reverse proxy HTTPS, đặt `SESSION_COOKIE_SECURE=true`.

