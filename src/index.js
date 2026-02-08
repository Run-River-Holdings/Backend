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
   - local + deployed frontend support
   - set FRONTEND_URL in Render/Netlify env if you want strict CORS
======================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true, // true = allow all (temporary)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

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
   ✅ Test / Health Route
======================= */
app.get("/", (req, res) => {
  res.send("🚀 Loan Service API running (Render Ready)");
});

/* =======================
   ✅ Database
======================= */
connectDB();

/* =======================
   ✅ IMPORTANT (Render)
======================= */
const PORT =  5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
