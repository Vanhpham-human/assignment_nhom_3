function requirePatchBoardFields(req, res, next) {
  const hasName = Object.prototype.hasOwnProperty.call(req.body, "name");
  const hasDesc = Object.prototype.hasOwnProperty.call(req.body, "description");
  if (!hasName && !hasDesc) {
    return res.status(400).json({ error: "Cần ít nhất một trường name hoặc description" });
  }
  next();
}

module.exports = { requirePatchBoardFields };
