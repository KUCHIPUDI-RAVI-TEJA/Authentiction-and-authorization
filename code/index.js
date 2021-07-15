require("dotenv").config();
const express = require("express");
const mustache = require("mustache-express");
const bodyParser = require("body-parser");

const fetch = require('node-fetch');
const { stringify } = require('querystring');

const mockDb = require("./mockDb.js");
const twilioClient = require("twilio")(
  "AC472221fa44b4194877ada75b38b89d84",
  "f30ebabfdbf3b527c2e8581e4cfd80f2"
);

const verificationSID = "VA18828816aed9549c081c7b28a8fdc7ca"; 

const app = express();

//Templating Engine Setup
app.engine("html", mustache());
app.set("view engine", "html");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
//Fake Database
const database = new mockDb();

//Sign Up Page
app.get("/", (req, res) => {
  res.render("register");
});

//New User Created
app.post("/", (req, res) => {
  const email = req.body.email;
  const phone=req.body.phone;
  database.addUser({
    username: req.body.username,
    email: email,
    phone:phone,
    password: req.body.password,
    verified: "Not Verified",
  });

  // //CREATE A NEW VERIFICATION HERE
  twilioClient.verify
    .services(verificationSID)
    .verifications.create({ to: email, channel: "email" })
    .then((verification) => {
      console.log("Verification email sent");
      res.redirect(`/verify?email=${email}`);
    })
    .catch((error) => {
      console.log(error);
    });
    
});

//Requesting Verification Code
app.get("/verify", (req, res) => {
  res.render("verify", { email: req.query.email });
});

//Verification Code submission
app.post("/verify", (req, res) => {
  const userCode = req.body.code;
  const email = req.body.email;
  console.log(`Code: ${userCode}`);
  console.log(`Email: ${email}`);
  //CHECK YOUR VERIFICATION CODE HERE

  twilioClient.verify
    .services(verificationSID)
    .verificationChecks.create({ to: email, code: userCode })
    .then((verification_check) => {
      if (verification_check.status === "approved") {
        database.verifyUser(email);
        console.log("Verification of email successful");
        res.redirect("registerphone");
      } else {
        res.render("verify", {
          email: email,
          message: "Verification Failed. Please enter the code from your email",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.render("verify", {
        email: email,
        message: "Verification Failed. Please enter the code from your email",
      });
    });

    

});
app.get("/registerphone", (req, res) => {
  res.render("registerphone");
});
app.post("/registerphone", (req, res) => {
  const phone=req.body.phone;
  
  twilioClient.verify
    .services(verificationSID)
    .verifications.create({ to: `+91${phone}`, channel: "sms" })
    .then((verification) => {
      console.log("OTP sent");
      res.redirect(`/verifyphone?phone=${phone}`);
    })
    .catch((error) => {
      console.log(error);
    });
  
});

app.get("/verifyphone", (req, res) => {
  res.render("verifyphone", {phone:req.query.phone});
});
app.post("/verifyphone", (req, res) => {
  const phone= req.body.phone;
  const otp=req.body.otp;
 console.log(phone)
  twilioClient.verify
    .services(verificationSID)
    .verificationChecks.create({ to:`+91${phone}`, code: otp })
    .then((verification_check) => {
      if (verification_check.status === "approved") {
        console.log("Verification of phone successful");
        // res.redirect("users");
        res.render("captcha");

      } else {
        res.render("verifyphone", {
          phone:phone,
          message: "Verification Failed. Please enter the code from your phone",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.render("verifyphone", {
        phone:phone,
        message: "Verification Failed. Please enter the code from your phone",
      });
    });
  });

app.get("/users", (req, res) => {
  let users = database.getUsers();
  res.render("users", {
    users: {
      users: users,
    },
  });
});


///////////////////////






app.post('/subscribe', async (req, res) => {
  if (!req.body.captcha)
    return res.json({ success: false, msg: 'pleasse select captcha' });

  // Secret key
  const secretKey = '6Lcg49kZAAAAADRQqjgsDhHR632hVtMzbccgo5Y6';

  // Verify URL
  const query = stringify({
    secret: secretKey,
    response: req.body.captcha,
    remoteip: req.connection.remoteAddress
  });
  const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

  // Make a request to verifyURL
  const body = await fetch(verifyURL).then(res => res.json());

  // If not successful
  if (body.success !== undefined && !body.success)
    return res.json({ success: false, msg: 'Failed captcha verification' });

  // If successful
  return res.json({ success: true, msg: 'Captcha passed' });
  
});



/////////////////////////
console.log("Listening on Port 3000");
app.listen(3000);











// require("dotenv").config();
// const express = require("express");
// const request = require("request");
// const mustache = require("mustache-express");
// const bodyParser = require("body-parser");
// const mockDb = require("./mockDb.js");
// const twilioClient = require("twilio")(
//   "AC472221fa44b4194877ada75b38b89d84", //"AC9821d06fca78e7ebe76b61ca3e2024a3", //"AC472221fa44b4194877ada75b38b89d84", // process.env.TWILIO_ACCOUNT_SID,
//   "f30ebabfdbf3b527c2e8581e4cfd80f2" //"c890959319335e46c614b7df3c6e2d75" //"f30ebabfdbf3b527c2e8581e4cfd80f2" //process.env.TWILIO_AUTH_TOKEN
// );

// const verificationSID = "VA18828816aed9549c081c7b28a8fdc7ca"; //"VA839a39285dd5e356fdc44d55b80a5f18"; //"VA18828816aed9549c081c7b28a8fdc7ca"; //process.env.TWILIO_VERIFY_SID;

// const app = express();

// //Templating Engine Setup
// app.engine("html", mustache());
// app.set("view engine", "html");
// app.set("views", __dirname + "/views");
// app.use(express.static(__dirname + "/public"));
// app.use(bodyParser.urlencoded({ extended: false }));

// //Fake Database
// const database = new mockDb();

// //Sign Up Page
// app.get("/", (req, res) => {
//   res.render("register");
// });

// //New User Created
// app.post("/", (req, res) => {
//   const email = req.body.email;

//   database.addUser({
//     username: req.body.username,
//     email: email,
//     password: req.body.password,
//     verified: "Not Verified",
//   });

//   // //CREATE A NEW VERIFICATION HERE
//   twilioClient.verify
//     .services(verificationSID)
//     .verifications.create({ to: email, channel: "email" })
//     .then((verification) => {
//       console.log("Verification email sent");
//       res.redirect(`/verify?email=${email}`);
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// });

// //Requesting Verification Code
// app.get("/verify", (req, res) => {
//   res.render("verify", { email: req.query.email });
// });

// //Verification Code submission
// app.post("/verify", (req, res) => {
//   const userCode = req.body.code;
//   const email = req.body.email;

//   console.log(`Code: ${userCode}`);
//   console.log(`Email: ${email}`);
//   //CHECK YOUR VERIFICATION CODE HERE

//   twilioClient.verify
//     .services(verificationSID)
//     .verificationChecks.create({ to: email, code: userCode })
//     .then((verification_check) => {
//       if (verification_check.status === "approved") {
//         database.verifyUser(email);
//         // res.redirect("otp"); //users
//         res.render("otp"); //users

//       } else {
//         res.render("verify", {
//           email: email,
//           message: "Verification Failed. Please enter the code from your email",
//         });
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//       res.render("verify", {
//         email: email,
//         message: "Verification Failed. Please enter the code from your email",
//       });
//     });
// });

// app.get("/users", (req, res) => {
//   let users = database.getUsers();
//   res.render("users", {
//     users: {
//       users: users,
//     },
//   });
// });

// //////////////////////////////


// ////////////////////////////////

// console.log("Listening on Port 3001");
// app.listen(3001);
