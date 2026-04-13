const { getOverviewData, getReportData } = require('../services/dashboard.service');

function getDefaultDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10)
  };
}

function resolveDateRange(query) {
  const defaults = getDefaultDateRange();
  const { preset = '6months', startDate, endDate } = query;

  if (preset === 'thisMonth') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      preset,
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10)
    };
  }

  if (preset === 'lastMonth') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      preset,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    };
  }

  if (preset === 'custom') {
    return {
      preset,
      startDate: startDate || defaults.startDate,
      endDate: endDate || defaults.endDate
    };
  }

  return { preset: '6months', ...defaults };
}

async function renderOverview(req, res, next) {
  try {
    const { preset, startDate, endDate } = resolveDateRange(req.query);
    const groupBy = req.query.groupBy === 'day' ? 'day' : 'month';

    const data = await getOverviewData({ startDate, endDate, groupBy });
    res.render('overview', {
      pageTitle: 'TechChain Dashboard - Tổng quan doanh số',
      filters: { preset, startDate, endDate, groupBy },
      chartData: data,
      formatCurrency: (value) => Number(value || 0).toLocaleString('vi-VN')
    });
  } catch (error) {
    next(error);
  }
}

async function renderReports(req, res, next) {
  try {
    const data = await getReportData();

    res.render('reports', {
      pageTitle: 'TechChain Dashboard - Báo cáo chi tiết',
      ...data,
      formatCurrency: (value) => Number(value || 0).toLocaleString('vi-VN')
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  renderOverview,
  renderReports
};
