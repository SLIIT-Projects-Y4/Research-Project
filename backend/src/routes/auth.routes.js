const router = require("express").Router();
const { register, login, getPlanPoolNames } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/users/:id/plan-pool-names", getPlanPoolNames);

module.exports = router;
