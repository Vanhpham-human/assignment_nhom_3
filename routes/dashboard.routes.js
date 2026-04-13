const express = require('express');
const { renderOverview, renderReports } = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/dashboard/overview');
});
router.get('/dashboard/overview', renderOverview);
router.get('/dashboard/reports', renderReports);

module.exports = router;
