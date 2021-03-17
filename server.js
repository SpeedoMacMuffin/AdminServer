const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("./dbConfig");
const server = require("./serverConfig");
const PORT = server.PORT;
const exec = require("child_process").exec;
const fs = require("fs");
const path = require("path");
opt = {
  cwd: process.argv[2] ? path.resolve(process.argv[2]) : process.cwd(),
};

const cors = require("cors");
const { stderr } = require("process");
const { fstat } = require("fs");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hashs = db.collection("hashs");

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

//sends
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
app.put("/auth", passCheck, comparePW, async (req, res) => {
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

app.get("/shutdown", (__, res) => {
  //sudo shutdown -h now
  script = exec(`sudo shutdown -h now`, opt, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        output: stdout,
        error: stderr,
      });
    }
  });
});
app.get("/reboot", (__, res) => {
  //change Path on Pi
  script = exec(`sudo reboot`, opt, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        output: stdout,
        error: stderr,
      });
    }
  });
});
app.get("/wifi", (__, res) => {
  //change Path on Pi
  script = exec(
    `node /Users/klarm/Desktop/piratebox-tests/socket-test/AdminServer/Scripts/createHostApd.js`,
    opt,
    (err, stdout, stderr) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          output: stdout,
          error: stderr,
        });
      }
    }
  );
});
app.put("/wifiop", async (req, res) => {
  const { ssid, private } = req.body;
  console.log(ssid);
  //change Path on Pi
  await fs.writeFile("hostapd.conf", `ssid: ${ssid}`, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log(res);
    }
  });
  script = exec(`echo "file created!"`, opt, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        message: stdout.toString(),
        error: stderr,
      });
    }
  });
});
app.put("/wifipriv", (req, res) => {
  //change Path on Pi
  script = exec(`echo "private settings!"`, opt, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        output: stdout.toString(),
        error: stderr,
      });
    }
  });
});

app.get("/wifi", (req, res) => {});
app.listen(PORT, console.log(`DeadNode-AdminServer connected on port ${PORT}`));
