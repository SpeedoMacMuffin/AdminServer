const express = require("express");
const router = express.Router();
const authController = require("../Controllers/Auth");
const bcrypt = require("bcrypt");
const db = require("../dbConfig");
const hashs = db.collection("hashs");

//middleware for first time boot. if password doesn't exist, default "ChangeMe" gets created
const passCheck = async (req, res, next) => {
  const dbCheck = await hashs.findOne({ name: "sudo" });
  if (dbCheck == null) {
    await bcrypt.hash("ChangeMe", 10, (err, hash) => {
      if (err) {
        console.log(err);
      } else {
        hashs.insertOne({ name: "sudo", hash: hash, required: true });
        next();
      }
    });
  } else {
    next();
  }
};

//middleware to check if entered password is correct
const comparePW = async (req, res, next) => {
  const { password } = req.body;
  const pass = await hashs.findOne({ name: "sudo" });
  await bcrypt.compare(password, pass.hash, (err, result) => {
    if (err) {
      throw err;
    } else {
      if (!result) {
        return res.json({
          message: "incorrect Password!",
          changed: result,
        });
      } else {
        next();
      }
    }
  });
};

router.get("/", passCheck, authController.getAuth);
router.post("/", passCheck, comparePW, authController.tryAuth);
router.put("/", passCheck, authController.updateAuth);

module.exports = router;
