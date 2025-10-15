const router = require("express").Router();
const { register, login, getPlanPoolNames, getPreferences} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/users/:id/plan-pool-names", getPlanPoolNames);
router.get("/preferences/:id", getPreferences);

module.exports = router;
