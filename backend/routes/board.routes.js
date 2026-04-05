const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const { requireBoardName } = require("../middlewares/boardBody");
const { validateBody } = require("../middlewares/validate");
const { updateBoardRules } = require("../middlewares/validationRules");
const { validateUuidParam } = require("../middlewares/uuidParams");
const { requirePatchBoardFields } = require("../middlewares/patchBoard");
const boardController = require("../controllers/board.controller");
const cardRoutes = require("./card.routes");

const router = express.Router();

router.get("/", authMiddleware, boardController.list);
router.post("/", authMiddleware, requireBoardName, boardController.create);
router.use(
  "/:boardId/cards",
  authMiddleware,
  validateUuidParam("boardId"),
  cardRoutes
);
router.patch(
  "/:id/star",
  authMiddleware,
  validateUuidParam("id"),
  boardController.toggleStar
);
router.post(
  "/:id/view",
  authMiddleware,
  validateUuidParam("id"),
  boardController.recordView
);
router.delete(
  "/:id",
  authMiddleware,
  validateUuidParam("id"),
  boardController.archive
);
router.patch(
  "/:id",
  authMiddleware,
  validateUuidParam("id"),
  requirePatchBoardFields,
  validateBody(updateBoardRules),
  boardController.updateOne
);

module.exports = router;
