# Backend (API + MongoDB)

Node.js + Express + Mongoose, map schema DBML → collection MongoDB (UUID string `_id`).

## MongoDB Compass

1. Chạy MongoDB local (hoặc Atlas).
2. Trong Compass: **New connection** → URI giống `.env`:
   - `mongodb://localhost:27017/trello_boards`  
   - Hoặc chỉ `mongodb://localhost:27017/` rồi chọn database `trello_boards`.
3. API tự thêm database `trello_boards` nếu URI không có tên DB (xem `withDefaultDb` trong `index.js`).

## Chạy API

Từ thư mục gốc project:

```bash
npm run server
```

Mặc định: `API_PORT=3000` trong `.env`.

## Luồng gần với Trello (đã bổ sung)

| Collection | Mục đích |
|------------|-----------|
| `users`, `user_sessions`, `otp_requests` | Tài khoản, phiên refresh (schema), OTP |
| `workspaces`, `workspace_members` | Không gian làm việc + thành viên |
| `boards`, `board_members` | Bảng + quyền trên bảng |
| `board_lists`, `cards`, … | Cột, thẻ, nhãn, comment, checklist, file, activity (theo schema) |
| **`user_board_stars`** | Gắn sao **theo user** (giống Trello), không dùng chung một cờ trên `boards` |
| **`user_board_recents`** | **Đã xem gần đây** — `POST /api/boards/:id/view` cập nhật `last_viewed_at` |

`boards.is_starred` vẫn tồn tại theo schema gốc; API ưu tiên hiển thị sao từ `user_board_stars`, vẫn tôn `is_starred` nếu chưa có dòng star (dữ liệu cũ).

## Tài liệu schema đầy đủ

Xem `docs/schema.dbml` (dbdiagram.io).
