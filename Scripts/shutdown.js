const exec = require("child_process").exec,
  path = require("path");

opt = {
  cwd: process.argv[2] ? path.resolve(process.argv[2]) : process.cwd(),
};
//sudo shutdown -h now
script = exec(`echo "SHUTTING DOWN!"`, opt);
script.stdout.on("data", function (data) {
  console.log(data.toString());
});
script.stderr.on("data", function (data) {
  console.log(data.toString());
});
script.on("exit", function (code) {
  console.log("program ended with code: " + code);
});
