# TechChain Admin Dashboard

He thong phan tich doanh thu cua chuoi ban le cong nghe su dung Express + EJS + MongoDB (Mongoose).

## 1) Cai dat

```bash
npm install
cp .env.example .env
# Cap nhat MONGODB_URI trong .env
```

## 2) Chay seed du lieu lon

```bash
npm run seed
```

Du lieu tao ra:
- Users: 500
- Employees: 30
- Products: 100 (10 category)
- Orders: 5000 (tu 01/2025 den hien tai)
- OrderDetails: xap xi 15000 (trung binh 3 item/order)

## 3) Chay ung dung

```bash
npm run dev
```

Mo trinh duyet: http://localhost:3000

## 4) Tinh nang da dap ung

- Mongoose schema day du + rang buoc + index cho truy van lon.
- Dashboard tong quan:
  - Line chart doanh thu theo thoi gian (co filter).
  - Bar chart doanh thu theo danh muc.
  - The KPI: doanh thu, gia von, loi nhuan rong.
- Dashboard bao cao:
  - Top 10 khach hang.
  - Hieu suat nhan vien + thuong 1%.
  - Canh bao ton kho `stock < 10`.
- Co filter theo preset: thang nay, thang truoc, 6 thang, tuy chinh.

## 5) Tra loi cau hoi tu duy

### 5.1 Truyen du lieu Aggregation vao Chart.js trong EJS

Trong EJS, truyen thang mang JSON bang:

```ejs
<script>
  const revenueByTime = <%- JSON.stringify(chartData.revenueByTime) %>;
</script>
```

Sau do map thanh labels/data cho Chart.js.

### 5.2 Toi uu khi 100000 don

Nen index:
- `orders.orderDate`
- `orders.status`
- `orders.customer`, `orders.staff`
- `orderdetails.order`, `orderdetails.product`
- `products.category`

Virtuals khong lam nhanh aggregation trong DB; virtual phu hop cho logic hien thi/derived fields sau khi query. Dashboard lon nen uu tien aggregation pipeline + index + cache (Redis) + pre-aggregation theo ngay/thang.

### 5.3 Bao mat phan quyen

- Xac thuc (JWT/session).
- Middleware RBAC:
  - Employee: chi cho `staff = req.user.employeeId`.
  - Manager: duoc xem tong hop toan he thong.
- Kiem tra role ngay trong query/match stage de tranh lo du lieu.

### 5.4 Truy van loi nhuan rong

Da trien khai trong `services/dashboard.service.js`:
- `totalRevenue = sum(quantity * unitPrice)`
- `totalCost = sum(quantity * product.costPrice)`
- `netProfit = totalRevenue - totalCost`

## 6) Cau truc thu muc

- `models/`: User, Employee, Product, Order, OrderDetail
- `services/dashboard.service.js`: cac truy van aggregation
- `controllers/dashboard.controller.js`: xu ly filter + render
- `views/`: EJS cho overview/reports
- `scripts/seed.js`: script seed du lieu lon toi uu insertMany
