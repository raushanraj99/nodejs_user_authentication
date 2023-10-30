const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')


mongoose
  .connect("mongodb://127.0.0.1:27017/", {
    dbName: "backend",
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

// Schema creation
const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// model/collection creation
const User = mongoose.model("User", userSchema);

const app = express();

// static file

// it is use for miiddle ware and express.static is middle ware.
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// setting up template
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    const decoded = jwt.verify(token, "sdlfjisdfjalsdfk");

    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  // console.log(req.cookies.token)
//   console.log("|| inside slash ||", req.user);
  res.render("logout", { name: req.user.name, email: req.user.email });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) return res.redirect("/register");

   // const isMatch = user.password == password
   const isMatch = await bcrypt.compare(password,user.password)

   if(!isMatch) return res.render("login",{email,message:"Incorrect Password"})

   const tokenid = jwt.sign({ _id: user._id }, "sdlfjisdfjalsdfk");

   res.cookie("token", tokenid, {
     httpOnly: true,
     expires: new Date(Date.now() + 60 * 1000),
   });
   res.redirect("/");

});



app.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedpassword = await bcrypt.hash(password,10)
//   console.log("hashed password : ",hashedpassword);

  user = await User.create({
    name: name,
    email: email,
    password: hashedpassword,
  });
  // const tokenid = user._id;
  const tokenid = jwt.sign({ _id: user._id }, "sdlfjisdfjalsdfk");

  res.cookie("token", tokenid, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

// app.get('/add',(req,res)=>{

//    Message.create({
//       name:"Bittu",
//       email:"test2@mail.com"
//    }).then(()=>{
//       res.send("form created nice")
//    })

// })

app.listen(5000, () => {
  console.log(`Server is working`);
});
