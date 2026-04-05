/**
 * Validation body cho REST — trả về middleware.
 * rules: [{ field, required?, type?, minLength?, maxLength?, enum?, custom?: (v) => string|undefined }]
 */
function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body && typeof req.body === "object" ? req.body : {};

    for (const rule of rules) {
      const key = rule.field;
      let v = body[key];

      if (rule.required) {
        if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
          errors.push({ field: key, message: rule.message || `${key} là bắt buộc` });
          continue;
        }
      }

      if (v === undefined || v === null) continue;

      if (rule.type === "string") {
        if (typeof v !== "string") {
          errors.push({ field: key, message: `${key} phải là chuỗi` });
          continue;
        }
        v = v.trim();
        body[key] = v;
      }

      if (rule.type === "number" && v !== undefined) {
        const n = Number(v);
        if (Number.isNaN(n)) {
          errors.push({ field: key, message: `${key} phải là số` });
          continue;
        }
        body[key] = n;
        v = n;
      }

      if (rule.type === "boolean" && v !== undefined) {
        if (typeof v === "boolean") {
          /* ok */
        } else if (v === "true" || v === "false") {
          body[key] = v === "true";
          v = body[key];
        } else {
          errors.push({ field: key, message: `${key} phải boolean` });
          continue;
        }
      }

      if (typeof v === "string") {
        if (rule.minLength != null && v.length < rule.minLength) {
          errors.push({
            field: key,
            message: rule.message || `${key} tối thiểu ${rule.minLength} ký tự`,
          });
        }
        if (rule.maxLength != null && v.length > rule.maxLength) {
          errors.push({
            field: key,
            message: `${key} tối đa ${rule.maxLength} ký tự`,
          });
        }
      }

      if (rule.enum && !rule.enum.includes(v)) {
        errors.push({ field: key, message: `${key} không hợp lệ` });
      }

      if (rule.custom) {
        const msg = rule.custom(v, body);
        if (msg) errors.push({ field: key, message: msg });
      }
    }

    if (errors.length) {
      return res.status(400).json({
        error: errors[0].message,
        errors,
      });
    }
    next();
  };
}

module.exports = { validateBody };
