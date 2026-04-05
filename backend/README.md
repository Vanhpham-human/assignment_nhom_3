# Backend — Express + Mongoose + Socket.io

Cấu trúc MVC-style: **config**, **models**, **services** (CRUD / nghiệp vụ), **controllers**, **routes**, **middlewares**, **socket**.

## Thư mục

| Thư mục / file | Vai trò |
| -------------- | ------- |
| `config/database.js` | Kết nối MongoDB, `withDefaultDb`, gợi ý URI cho **MongoDB Compass** |
| `config/constants.js` | `API_PORT`, đường dẫn gốc |
| `models/` | Schema Mongoose → collection DB |
| `services/` | CRUD & logic: `userService`, `workspaceService`, `boardService`, `cardService`, `boardUserPrefsService` |
| `controllers/` | Xử lý HTTP, gọi service |
| `routes/` | Đăng ký path `/api/*` |
| `middlewares/` | `auth`, `validateBody`, `uuidParams`, validation rules, `boardBody`, `patchBoard` |
| `socket/index.js` | Socket.io: `board:join` / `board:leave`, JWT tùy chọn trong `handshake.auth.token` |
| `utils/` | `boardDto`, `socketEmit` |
| `app.js` | Express app |
| `server.js` | HTTP + Socket.io, seed, lắng nghe cổng |
| `seed.js` | Dữ liệu mẫu (`npm run db:seed`) |

## MongoDB Compass

1. Chạy MongoDB (local hoặc Atlas).
2. Mở Compass → **New connection** → dán `MONGODB_URI` từ `.env` (cùng chuỗi app dùng; mặc định DB `trello_boards` nếu URI không có tên DB).
3. Khi chạy `npm run server`, console in URI (ẩn mật khẩu nếu có) và dòng hướng dẫn Compass.

## Chạy

```bash
npm run server    # backend/server.js — API + Socket.io
npm run db:seed   # chỉ seed (cần MongoDB)
npm run dev       # API + React
```

## Socket.io (runtime)

- Cùng cổng với API (mặc định 3000).
- Client (ví dụ): `io('http://localhost:3000', { auth: { token: '<JWT>' } })`.
- Sau khi kết nối: `socket.emit('board:join', boardId)` để nhận sự kiện realtime: `board:created`, `board:updated`, `card:created`, … trên room `board:<id>`.

## API chính

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/workspaces`
- `GET|POST /api/boards`, `PATCH /api/boards/:id`, `PATCH /api/boards/:id/star`, `POST /api/boards/:id/view`, `DELETE /api/boards/:id`
- `GET|POST /api/boards/:boardId/cards`, `PATCH|DELETE /api/boards/:boardId/cards/:cardId`

Schema đầy đủ: `docs/schema.dbml`.
