const { isUuid } = require("./uuidParams");

const registerRules = [
  { field: "email", required: true, type: "string", minLength: 3 },
  {
    field: "password",
    required: true,
    type: "string",
    minLength: 6,
    message: "Mật khẩu tối thiểu 6 ký tự",
  },
  { field: "full_name", required: true, type: "string", minLength: 1, maxLength: 150 },
];

const loginRules = [
  { field: "email", required: true, type: "string", minLength: 1 },
  { field: "password", required: true, type: "string", minLength: 1 },
];

const createCardRules = [
  {
    field: "list_id",
    required: true,
    type: "string",
    custom: (v) => (isUuid(v) ? undefined : "list_id phải là UUID hợp lệ"),
  },
  { field: "title", required: true, type: "string", minLength: 1, maxLength: 255 },
  { field: "description", required: false, type: "string" },
  { field: "position", required: false, type: "number" },
  {
    field: "priority",
    required: false,
    enum: ["low", "medium", "high", "urgent"],
  },
];

/** Dùng kèm middleware requirePatchBoardFields */
const updateBoardRules = [
  {
    field: "name",
    required: false,
    type: "string",
    minLength: 1,
    maxLength: 150,
  },
  { field: "description", required: false, type: "string" },
];

module.exports = {
  registerRules,
  loginRules,
  createCardRules,
  updateBoardRules,
};
