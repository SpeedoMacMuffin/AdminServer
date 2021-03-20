const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("./dbConfig");
const server = require("./serverConfig");
const PORT = server.PORT;
const exec = require("child_process").exec;
const fs = require("fs");
const raspiInfo = require("raspberry-info");
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
const creds = db.collection("creds");

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
app.get("/wifi", checkWireless, async (__, res) => {
  //change Path on Pi

  const wificred = await creds.findOne({ name: "sudo" });
  res.json({
    message: "successfull",
    ssid: wificred.ssid,
    pw: wificred.pw,
    required: wificred.required,
  });
});
app.put("/wifiop", checkWireless, async (req, res) => {
  const { ssid, privateWifi } = req.body;
  if (privateWifi) {
    return res.status(500);
  } else {
    await fs.writeFile(
      "hostapd.conf",
      `interface=wlan0\nssid=${ssid}\nhw_mode=g\nchannel=7\nmacaddr_acl=0\nauth_algs=1\nignore_broadcast_ssid=0`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log("file created!" + result);
          script = exec(
            `sudo mv /home/pi/AdminServer/hostapd.conf /etc/hostapd/hostapd.conf`
          );
          script.stdout.on("data", function (data) {
            console.log(data.toString());
          });
          script.stderr.on("data", function (data) {
            console.log(data.toString());
          });
          script.on("exit", function (code) {
            const filter = { name: "sudo" };
            creds.updateOne(filter, {
              $set: { ssid: ssid, required: privateWifi },
            });
            res.json({
              message: "updated!",
              changed: true,
            });
          });
        }
      }
    );
  }
});

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

app.put("/wifipriv", checkWireless, wifiCheck, async (req, res) => {
  const { ssid, privateWifi, passKey, newPassKey } = req.body;
  console.log(newPassKey);
  if (!privateWifi) {
    return res.status(500);
  } else {
    if (!newPassKey) {
      await fs.writeFile(
        "hostapd.conf",
        `interface=wlan0\nssid=${ssid}\nhw_mode=g\nchannel=7\nmacaddr_acl=0\nauth_algs=1\nignore_broadcast_ssid=0\nwpa=2\nwpa_passphrase=${passKey}\nwpa_key_mgmt=WPA-PSK\nwpa_pairwise=TKIP\nrsn_pairwise=CCMP`,
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log("file created!" + result);
            script = exec(
              `sudo mv /home/pi/AdminServer/hostapd.conf /etc/hostapd/hostapd.conf`
            );
            script.stdout.on("data", function (data) {
              console.log(data.toString());
            });
            script.stderr.on("data", function (data) {
              console.log(data.toString());
            });
            script.on("exit", function (code) {
              const filter = { name: "sudo" };
              creds.updateOne(filter, {
                $set: { ssid: ssid, required: privateWifi },
              });
              res.json({
                message: "updated!",
                changed: true,
              });
            });
          }
        }
      );
    } else {
      await fs.writeFile(
        "hostapd.conf",
        `interface=wlan0\nssid=${ssid}\nhw_mode=g\nchannel=7\nmacaddr_acl=0\nauth_algs=1\nignore_broadcast_ssid=0\nwpa=2\nwpa_passphrase=${newPassKey}\nwpa_key_mgmt=WPA-PSK\nwpa_pairwise=TKIP\nrsn_pairwise=CCMP`,
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log("file created!" + result);
            script = exec(
              `sudo mv /home/pi/AdminServer/hostapd.conf /etc/hostapd/hostapd.conf`
            );
            script.stdout.on("data", function (data) {
              console.log(data.toString());
            });
            script.stderr.on("data", function (data) {
              console.log(data.toString());
            });
            script.on("exit", function (code) {
              const filter = { name: "sudo" };
              creds.updateOne(filter, {
                $set: { ssid: ssid, required: privateWifi, pw: newPassKey },
              });
              res.json({
                message: "updated!",
                changed: true,
              });
            });
          }
        }
      );
    }
  }
});

app.get("/system", async (__, res) => {
  let cpuTemp;
  let memorytotal;
  let memoryused;
  await raspiInfo.getCPUTemperature().then((output) => (cpuTemp = output));
  await raspiInfo.getMemoryTotal().then((output) => (memorytotal = output));
  await raspiInfo.getMemoryUsage().then((output) => (memoryused = output));
  res.json({
    message: "success",
    cpuTemp: cpuTemp,
    memorytotal: memorytotal,
    memoryused: memoryused,
  });
});
app.get("/space", async (__, res) => {
  let availableSpace;
  let usedSpace;
  script = await exec(`df -H / --output=avail,used`);
  script.stdout.on("data", function (data) {
    availableSpace = data.replace("Avail\n", "");
    console.log(data.replace("Used/n", ""));

    res.json({
      message: "success",
      available: availableSpace,
      used: usedSpace,
      data: data.replace("Avail|Used|/n", ""),
    });
  });
});

app.listen(PORT, console.log(`DeadNode-AdminServer connected on port ${PORT}`));
