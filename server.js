const express = require("express");
const app = express();
const server = require("./serverConfig");
const PORT = server.PORT;

const cors = require("cors");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  let id = req.body;
  console.log(id);
  res.json({
    message: "wooop to you too!",
  });
});

app.listen(PORT, console.log(`DeadNode-AdminServer connected on port ${PORT}`));
