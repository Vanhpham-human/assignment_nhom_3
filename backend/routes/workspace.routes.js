const express = require("express");
const workspaceController = require("../controllers/workspace.controller");

const router = express.Router();

router.get("/", workspaceController.list);

module.exports = router;
