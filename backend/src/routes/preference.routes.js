const router = require("express").Router();
const auth = require("../middlewares/auth");
const { getMyPreferences, updatePreferences } = require("../controllers/preference.controller");

router.get("/", auth, getMyPreferences);
router.put("/", auth, updatePreferences);

module.exports = router;
