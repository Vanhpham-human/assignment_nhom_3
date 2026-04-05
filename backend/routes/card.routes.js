const express = require("express");
const { validateBody } = require("../middlewares/validate");
const { createCardRules } = require("../middlewares/validationRules");
const { validateUuidParams } = require("../middlewares/uuidParams");
const cardController = require("../controllers/card.controller");

const router = express.Router({ mergeParams: true });

router.get("/", cardController.list);
router.post("/", validateBody(createCardRules), cardController.create);
router.patch(
  "/:cardId",
  validateUuidParams("boardId", "cardId"),
  cardController.update
);
router.delete(
  "/:cardId",
  validateUuidParams("boardId", "cardId"),
  cardController.remove
);

module.exports = router;
