# Backend (đơn giản)

- **`server.js`** — Express + toàn bộ route API (auth, workspaces, boards).
- **`config/database.js`** — Kết nối MongoDB, `withDefaultDb`, gợi ý Compass.
- **`middleware/auth.js`** — JWT Bearer.
- **`lib/boardDto.js`** — Format bảng cho JSON giống Trello UI.
- **`models/`** — Schema Mongoose.
- **`seed.js`** — Dữ liệu mẫu khi DB trống (`npm run db:seed`).

Chạy: `npm run server` (cổng `API_PORT` hoặc 3000).

API dùng bởi React: `/api/auth/*`, `/api/workspaces`, `/api/boards` (GET/POST, star, view, delete).

Chi tiết schema: `docs/schema.dbml`.
