# Backend

Luồng request: **`routes/`** → **`controllers/`** (HTTP) → **`services/`** (nghiệp vụ + DB) → **`models/`**.

| Thư mục / file | Vai trò |
|----------------|---------|
| **`server.js`** | Kết nối MongoDB, HTTP + Socket.io, `listen` |
| **`app.js`** | Express: CORS, JSON, mount `/api`, lỗi 500 |
| **`routes/`** | Định tuyến URL (`/auth`, `/workspaces`, `/boards`, `/health`) |
| **`controllers/`** | Nhận `req`/`res`, gọi service, trả status + JSON |
| **`services/`** | `userService`, `workspaceService`, `boardService`, `boardUserPrefsService` |
| **`middleware/`** | JWT `auth` |
| **`lib/`** | `boardDto`, `userPublic` (format JSON) |
| **`utils/`** | `socketEmit` — emit realtime qua `req.app.get('io')` |
| **`socket.js`** | Đăng ký Socket.io |
| **`config/database.js`** | Mongoose + Compass |
| **`models/`** | Schema collection |

Dữ liệu: Compass hoặc API (không seed). Chạy: `npm run server`.

Schema: `docs/schema.dbml`.
