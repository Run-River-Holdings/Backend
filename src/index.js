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
   ✅ BODY PARSER
======================= */
app.use(express.json());

/* =======================
   ✅ CORS (ENV BASED)
======================= */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Express 5 FIX: use RegExp instead of "*"
app.options(/.*/, cors());

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
