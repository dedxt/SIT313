const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Requester = require("./models/requester");
var bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const Worker = require("./models/worker");


require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, name) => {
  const msg = {
    to: email,
    from: "dixitdr@live.in",
    subject: "Hi " + name + ", Welcome to iCrowdTask",
    text: "and easy to do anywhere, even with Node.js",
    html:
      '<h2 style="text-align: center; color: #00897b">iCrowdTask</h2><p style="text-align: center">You just created your account on iCrowdTask.</p><h3 style="text-align: center">Account details:</h3><p style="text-align: center">You can login on iCrowdTask with this <strong>email</strong> and <strong>password</strong> you chose at the time of registeration.</p><p style="text-align: center">Click on the link to visit the website: <a href="https://icrowd1.herokuapp.com/">iCrowdTask</a><p>',
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.log(err);
  }
};

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

    sendEmail(email, first_name);

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


app.post("/loginByGoogle", async (req, res) => {
  console.log("login by google");
  console.log(req.body);
  let { first_name, last_name, id, email } = req.body;

  try {
    const dataFound = await Requester.findOne({ email });

    if (dataFound != null) {
      console.log(dataFound);
      return res.json({
        message: "user created via google auth",
      });
    }

    let newRequester = new Requester({
      _id: mongoose.Types.ObjectId(),
      country: "Australia",
      first_name,
      last_name,
      email,
      password: id,
      address: "Melbourne",
      city: "Chdnioionl",
      state: "Mej",
      postal_code: 123456,
      mobile: 123456789,
    });

    const newOne = await newRequester.save();

    // sendEmail(email, first_name);

    return res.json({
      message: "user created via google auth",
    });
    // console.log(newOne);
  } catch (err) {
    res.json({
      message: err,
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
// Worker Routes

// TO ADD A WORKER

app.post("/workers", async (req, res) => {
  const { first_name, last_name, email, password, address, mobile } = req.body;

  try {
    var hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = new Worker({
      _id: mongoose.Types.ObjectId(),
      email,
      first_name,
      last_name,
      password: hashedPassword,
      address,
      mobile,
    });

    const created = await newWorker.save();

    console.log(created);

    return res.json({
      message: "worker added successfully",
    });
  } catch (err) {
    // console.log(err.message);
    let errorMessage = err.message;
    if (err.message.includes("is required")) {
      errorMessage = "Provide all the fields";
    } else if (err.message.includes("duplicate key error")) {
      errorMessage = "Email already exists";
    }
    res.json({
      message: errorMessage,
    });
  }
});

// To get all the workers

app.get("/workers", async (req, res) => {
  let allWorkers;

  try {
    allWorkers = await Worker.find().select(
      "first_name last_name email address mobile"
    );
    // console.log("all workers sent");
  } catch (err) {
    console.log(err);
    res.json({
      error: err,
    });
  }

  res.json({
    workers: [...allWorkers],
  });
});

//To remove all workers

app.delete("/workers", async (req, res) => {
  try {
    const deleteAll = await Worker.deleteMany({});

    console.log("all workers deleted");

    return res.json({
      message: "all workers deleted",
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

//To get a worker by Id

app.get("/workers/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const dataFetched = await Worker.findOne({ _id: id }).select(
      "first_name last_name email address mobile"
    );

    return res.json(dataFetched);
  } catch (err) {
    let errMessage = err.message;
    if (err.message.includes("Cast to ObjectId failed"))
      errMessage = "No object with this id";
    res.json({
      error: errMessage,
    });
  }
});

// To remove a worker by Id

app.delete("/workers/:id", async (req, res) => {
  const id = req.params.id;
  try {
    let objectData = await Worker.deleteOne({ _id: id });
    if (objectData.deletedCount == 0) {
      return res.json({
        message: "No worker with provided entry",
      });
    }
    console.log(`worker deleted with id ${id}`);

    return res.json({
      message: `worker deleted with id ${id}`,
    });
  } catch (err) {
    return res.json({
      error: err.message,
    });
  }
});

//To update a worker by id

app.patch("/workers/:id", async (req, res) => {
  const id = req.params.id;

  const { address, mobile, old_password, new_password } = req.body;

  try {
    let updatedObject = {};
    let updateMessage = "";
    if (address !== undefined) {
      updatedObject.address = address;
      updateMessage += "address, ";
    }
    if (mobile !== undefined) {
      updatedObject.mobile = mobile;
      updateMessage += "mobile, ";
    }
    if (
      new_password != undefined &&
      old_password != undefined &&
      old_password !== new_password
    ) {
      const workerData = await Worker.findById({ _id: id });
      const workerHashPass = workerData.password;

      let isPasswordSame = await bcrypt.compare(old_password, workerHashPass);
      if (isPasswordSame) {
        var hashedPassword = await bcrypt.hash(new_password, 10);
        updatedObject.password = hashedPassword;
        updateMessage += "password, ";
      } else {
        return res.json({
          message: "Something is fishy. Wrong password entered",
        });
      }
    }

    updatedObject = await Worker.updateOne(
      { _id: id },
      { $set: updatedObject }
    );

    return res.json({
      message: `${updateMessage}updated`,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
