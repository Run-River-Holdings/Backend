// src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./infastructure/db.js";

import dashboardRouter from "./api/dashboard.js";
import brokerRouter from "./api/broker.js";
import customerRoute from "./api/customer.js";
import assetRouter from "./api/asset.js";
import investmentRouter from "./api/investement.js";
import reportRouter from "./api/cutomerReport.js";
import customerpaymentRouter from "./api/Cutomerpayment.js";
import brokerpaymentRouter from "./api/brokerpayment.js";
import customerPaymentHistoryRouter from "./api/customerPaymentHistory.js";
import brokerPaymentHistoryRouter from "./api/brokerpaymentHistory.js";
import userRouter from "./api/user.js";

const app = express();

/* =======================
   ✅ CORS
======================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Express v5: do not use "*"
app.options(/.*/, cors());

/* =======================
   ✅ BODY PARSER
======================= */
app.use(express.json());

/* =======================
   ✅ Routes
======================= */
app.use("/api/user", userRouter);
app.use("/api/dashboard", dashboardRouter);

app.use("/api/customer/payments", customerpaymentRouter);
app.use("/api/customer/payments", customerPaymentHistoryRouter);

app.use("/api/broker/payments", brokerpaymentRouter);
app.use("/api/broker/payments", brokerPaymentHistoryRouter);

app.use("/api/reports", reportRouter);
app.use("/api/customer", customerRoute);
app.use("/api/broker", brokerRouter);
app.use("/api/assets", assetRouter);
app.use("/api/investment", investmentRouter);

/* =======================
   ✅ Health
======================= */
app.get("/", (req, res) => {
  res.send("🚀 Loan Service API running (Render Ready)");
});

/* =======================
   ✅ DB
======================= */
connectDB();

/* =======================
   ✅ IMPORTANT (Render)
======================= */
const PORT = process.env.PORT ;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
// // src/index.js
// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import connectDB from "./infastructure/db.js";

// import dashboardRouter from "./api/dashboard.js";
// import brokerRouter from "./api/broker.js";
// import customerRoute from "./api/customer.js";
// import assetRouter from "./api/asset.js";
// import investmentRouter from "./api/investement.js";
// import reportRouter from "./api/cutomerReport.js";
// import customerpaymentRouter from "./api/Cutomerpayment.js";
// import brokerpaymentRouter from "./api/brokerpayment.js";
// import customerPaymentHistoryRouter from "./api/customerPaymentHistory.js";
// import brokerPaymentHistoryRouter from "./api/brokerpaymentHistory.js";
// import userRouter from "./api/user.js";

// const app = express();

// /* =======================
//    ✅ CORS
// ======================= */
// const DEV_ALLOWED = [
//   "http://localhost:5173",
//   "http://127.0.0.1:5173",
//   "http://localhost:5174",
//   "http://127.0.0.1:5174",
//   "http://localhost:8081",
//   "http://127.0.0.1:8081",
// ];

// app.use(
//   cors({
//     origin: (origin, cb) => {
//       // allow tools like Postman / server-to-server
//       if (!origin) return cb(null, true);

//       // if you set FRONTEND_URL in .env, use it strictly
//       const fe = (process.env.FRONTEND_URL || "").trim();
//       if (fe) return cb(null, origin === fe);

//       // otherwise allow common dev origins
//       if (DEV_ALLOWED.includes(origin)) return cb(null, true);

//       // allow LAN (mobile) dev if you want (uncomment if needed)
//       // if (origin.startsWith("http://192.168.") || origin.startsWith("http://10.") ) return cb(null, true);

//       return cb(null, false);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // ✅ Express v5: do not use "*"
// app.options(/.*/, cors());

// /* =======================
//    ✅ BODY PARSER
// ======================= */
// app.use(express.json());

// /* =======================
//    ✅ Routes
// ======================= */
// app.use("/api/user", userRouter);
// app.use("/api/dashboard", dashboardRouter);

// app.use("/api/customer/payments", customerpaymentRouter);
// app.use("/api/customer/payments", customerPaymentHistoryRouter);

// app.use("/api/broker/payments", brokerpaymentRouter);
// app.use("/api/broker/payments", brokerPaymentHistoryRouter);

// app.use("/api/reports", reportRouter);
// app.use("/api/customer", customerRoute);
// app.use("/api/broker", brokerRouter);
// app.use("/api/assets", assetRouter);
// app.use("/api/investment", investmentRouter);

// /* =======================
//    ✅ Health
// ======================= */
// app.get("/", (req, res) => {
//   res.send("🚀 Loan Service API running (Render Ready)");
// });

// /* =======================
//    ✅ DB
// ======================= */
// connectDB();

// /* =======================
//    ✅ IMPORTANT (Render)
// ======================= */
// const PORT = Number(process.env.PORT) || 5000;

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
// });
