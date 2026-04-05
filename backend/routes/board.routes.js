const express = require("express");
const boardController = require("../controllers/board.controller");

const router = express.Router();

router.get("/", boardController.list);
router.post("/", boardController.create);
router.patch("/:id/star", boardController.toggleStar);
router.post("/:id/view", boardController.recordView);
router.delete("/:id", boardController.archive);

module.exports = router;
