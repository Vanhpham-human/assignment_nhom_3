const express = require("express");
const { validateBody } = require("../middlewares/validate");
const { registerRules, loginRules } = require("../middlewares/validationRules");
const { authMiddleware } = require("../middlewares/auth");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", validateBody(registerRules), authController.register);
router.post("/login", validateBody(loginRules), authController.login);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
