const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("./dbConfig");
const server = require("./serverConfig");
const PORT = server.PORT;

const cors = require("cors");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hashs = db.collection("hashs");
const crypto = db.collection("cryptos");

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

app.get("/auth", passCheck, async (req, res) => {
  const pass = await hashs.findOne({ name: "sudo" });
  console.log(pass);
  res.json({
    auth: pass.required,
  });
});

app.post("/auth", passCheck, async (req, res) => {
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
});

const compare = async (req, res, next) => {
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
app.put("/auth", passCheck, compare, async (req, res) => {
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
});
app.listen(PORT, console.log(`DeadNode-AdminServer connected on port ${PORT}`));
