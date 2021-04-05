const bcrypt = require("bcrypt");
const db = require("../dbConfig");
const hashs = db.collection("hashs");

const authController = {
  //gets authorization information
  getAuth: async (__, res) => {
    const pass = await hashs.findOne({ name: "sudo" });
    res.json({
      auth: pass.required,
    });
  },
  //compare passwords
  tryAuth: async (req, res) => {
    const { password } = req.body;
    const pass = await hashs.findOne({ name: "sudo" });
    bcrypt.compare(password, pass.hash, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          match: result,
        });
      }
    });
  },
  //updates password to newPassword
  updateAuth: async (req, res) => {
    const { password, newPassword } = req.body;

    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) {
        console.log(err);
      } else {
        const filter = { name: "sudo" };
        hashs.updateOne(filter, { $set: { hash: hash } });
        res.json({
          message: "Password updated!",
          changed: true,
        });
      }
    });
  },
};

module.exports = authController;
