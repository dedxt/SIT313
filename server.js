const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Requester = require("./models/requester");
var bcrypt = require("bcryptjs");

require("dotenv").config();
app.use(cors());

mongoose.connect(
  "mongodb://test:" +
    process.env.MONGO_PW +
    "@sit313-shard-00-00.bdy1m.mongodb.net:27017,sit313-shard-00-01.bdy1m.mongodb.net:27017,sit313-shard-00-02.bdy1m.mongodb.net:27017/iCrowdTaskDB?ssl=true&replicaSet=atlas-13l71y-shard-0&authSource=admin&retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
);

let db = mongoose.connection;

db.once("open", () => {
  console.log("Db connected sucessfully");
});

db.on("error", (err) => {
  console.log(err);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("public/home.html", { root: __dirname });
});

app.get("/register", (req, res) => {
  res.sendFile("public/register.html", { root: __dirname });
});

app.get("/login", (req, res) => {
  res.sendFile("public/login.html", { root: __dirname });
});

app.get("/reqlogin", (req, res) => {
  res.sendFile("public/reqlogin.html", { root: __dirname });
});

app.post("/register", async (req, res) => {
  let {
    country,
    first_name,
    last_name,
    email,
    password,
    confirm_password,
    address,
    city,
    state,
    postal_code,
    mobile,
  } = req.body;

  if (password !== confirm_password)
    return res.json({
      message: "password must be same",
    });

  try {
    var hashedPassword = await bcrypt.hash(password, 10);

    const newRequester = new Requester({
      _id: mongoose.Types.ObjectId(),
      country,
      first_name,
      last_name,
      email,
      password: hashedPassword,
      address,
      city,
      state,
      postal_code,
      mobile,
    });

    const newOne = await newRequester.save();

    return res.json({
      message: "requester registered",
    });
    // console.log(newOne);
  } catch (err) {
    let message;

    if (err.message.includes("duplicate key error"))
      message = "requester already exists";
    else if (err.message.includes("email")) message = "invalid email";
    else if (err.message.includes("password"))
      message = "password length must be greater than 8";
    else if (err.message.includes("mobile"))
      message = "mobile should be of length 9";

    res.json({
      message,
    });
  }
});

app.use("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const data = await Requester.findOne({ email });
    if (data == null) {
      return res.json({
        message: "User not found",
      });
    }
    const passMatch = await bcrypt.compare(password, data.password);
    if (passMatch == true) {
      return res.json({
        message: "login successful",
      });
    }

    return res.json({
      message: "Incorrect Username/Password",
    });
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
