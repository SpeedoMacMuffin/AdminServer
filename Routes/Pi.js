const express = require("express");
const router = express.Router();
const piController = require("../Controllers/Pi");

router.get("/shutdown", piController.shutdown);
router.get("/reboot", piController.reboot);
router.get("/system", piController.getSysInfo);
router.get("/space", piController.getSpaceInfo);

module.exports = router;
