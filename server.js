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

const authRoutes = require("./Routes/Auth");
const piRoutes = require("./Routes/Pi");
const wifiRoutes = require("./Routes/Wifi");

app.use("/auth", authRoutes);
app.use("/pi", piRoutes);
app.use("/wifi", wifiRoutes);

app.listen(PORT, console.log(`DeadNode-AdminServer connected on port ${PORT}`));
