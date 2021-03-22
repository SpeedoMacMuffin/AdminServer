const express = require("express");
const router = express.Router();
const db = require("../dbConfig");
const wifiController = require("../Controllers/Wifi");
const creds = db.collection("creds");

//middleware to create Wifi-entry in db with default credentials if none exists
const checkWireless = async (req, res, next) => {
  const dbCheck = await creds.findOne({ name: "sudo" });
  if (dbCheck == null) {
    await creds.insertOne({
      name: "sudo",
      pw: "ChangeMe",
      required: true,
      ssid: "DeadNode",
    });
    next();
  } else {
    next();
  }
};

//middleware to check correct password input
const wifiCheck = async (req, res, next) => {
  const { passKey } = req.body;
  const wificred = await creds.findOne({ name: "sudo" });
  if (passKey !== wificred.pw) {
    return res.json({
      message: "incorrect Password!",
      changed: false,
    });
  } else {
    next();
  }
};

router.get("/", checkWireless, wifiController.getWifiInfo);
router.put("/wifiop", checkWireless, wifiController.editOp);
router.put("/wifipriv", checkWireless, wifiCheck, wifiController.editPriv);

module.exports = router;
