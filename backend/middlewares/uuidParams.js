/** _id dạng UUID string (randomUUID / Mongoose default). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Kiểm tra req.params[paramName] là UUID (Mongo _id dạng string trong project). */
function validateUuidParam(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isUuid(id)) {
      return res.status(400).json({ error: `Tham số ${paramName} không hợp lệ` });
    }
    next();
  };
}

function validateUuidParams(...paramNames) {
  return (req, res, next) => {
    for (const name of paramNames) {
      const id = req.params[name];
      if (!id || !isUuid(id)) {
        return res.status(400).json({ error: `Tham số ${name} không hợp lệ` });
      }
    }
    next();
  };
}

module.exports = { isUuid, validateUuidParam, validateUuidParams, UUID_RE };
