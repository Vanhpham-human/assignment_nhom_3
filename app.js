const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const dashboardRoutes = require('./routes/dashboard.routes');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Đã xảy ra lỗi trong quá trình xử lý dữ liệu.');
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('DB connection failed:', error.message);
    process.exit(1);
  });
