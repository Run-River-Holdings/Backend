import express from "express";
import { auth } from "./middlewares/auth.js";
import {
  getTodayNotifications,
  getTodayNotificationCount,
} from "../application/notification.js";

const notificationRouter = express.Router();

notificationRouter.get("/today", auth, getTodayNotifications);
notificationRouter.get("/today/count", auth, getTodayNotificationCount);

export default notificationRouter;
