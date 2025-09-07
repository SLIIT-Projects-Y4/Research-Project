const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const { getMyPreferences, updatePreferences } = require("../controllers/preferencesController");

router.get("/users/me/preferences", auth, getMyPreferences);
router.put("/users/me/preferences", auth, updatePreferences);

module.exports = router;
