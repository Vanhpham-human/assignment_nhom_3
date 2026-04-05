# Backend (đơn giản)

- **`server.js`** — Chỉ kết nối: MongoDB, `http.Server`, Socket.io, `listen`.
- **`app.js`** — Express + toàn bộ route API.
- **`socket.js`** — Đăng ký Socket.io (`board:join` / `board:leave`, JWT tùy chọn).
- **`config/database.js`** — Kết nối MongoDB; URI dùng luôn trong **MongoDB Compass** (`MONGODB_URI` trong `.env`).
- **`middleware/auth.js`** — JWT Bearer.
- **`lib/boardDto.js`** — Format JSON bảng cho UI.
- **`models/`** — Schema Mongoose (collections tạo khi app ghi DB hoặc khi bạn thêm doc trong Compass — nên đúng kiểu field).

**Không có seed:** dữ liệu do bạn nhập qua Compass hoặc qua API (đăng ký user, tạo board, …).

Chạy: `npm run server` (cổng `API_PORT` hoặc 3000).

### Socket.io

- Cùng URL với API, ví dụ `http://localhost:3000`.
- `socket.emit("board:join", boardId)` để nhận sự kiện `board:created`, `board:star`, `board:view`, `board:archived` trên room `board:<id>`.
- Tùy chọn: `io(url, { auth: { token: "<JWT>" } })` để server gắn `userId` (sự kiện `socket:connected`).

API React: `/api/auth/*`, `/api/workspaces`, `/api/boards`.

Schema: `docs/schema.dbml`.
