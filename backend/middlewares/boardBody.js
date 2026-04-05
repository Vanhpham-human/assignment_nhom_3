/** name hoặc title (từ client) — gán name đã trim cho controller. */
function requireBoardName(req, res, next) {
  const n = String(req.body.name || req.body.title || "").trim();
  if (!n) {
    return res.status(400).json({ error: "Tên bảng là bắt buộc" });
  }
  req.body.name = n;
  next();
}

module.exports = { requireBoardName };
