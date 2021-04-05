const exec = require("child_process").exec;
const fs = require("fs");
const db = require("../dbConfig");
const creds = db.collection("creds");

const wifiController = {
  //gets Wifi-Information
  getWifiInfo: async (__, res) => {
    const wificred = await creds.findOne({ name: "sudo" });
    res.json({
      message: "successfull",
      ssid: wificred.ssid,
      pw: wificred.pw,
      required: wificred.required,
    });
  },
  //edits open wifi-config
  editOp: async (req, res) => {
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
  },
  //edits private wifi-Config
  editPriv: async (req, res) => {
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
  },
};

module.exports = wifiController;
