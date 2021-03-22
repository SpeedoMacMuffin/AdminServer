const exec = require("child_process").exec;
const fs = require("fs");
const raspiInfo = require("raspberry-info");
const { stderr } = require("process");

const piController = {
  shutdown: (__, res) => {
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
  },
  reboot: (__, res) => {
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
  },
  getSysInfo: async (__, res) => {
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
  },
  getSpaceInfo: async (__, res) => {
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
  },
};

module.exports = piController;
