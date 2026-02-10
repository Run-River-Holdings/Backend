import Investment from "../infastructure/schemas/investement.js";

const SL_OFFSET_MINUTES = 330; // UTC+05:30

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const monthlyInterest = (principal, ratePercent) => {
  const p = n(principal);
  const r = n(ratePercent);
  return Math.max((p * r) / 100, 0);
};

const addMonthsKeepDay = (date, months) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // overflow fix (Jan 31 -> last day next month)
  if (d.getDate() !== day) d.setDate(0);
  return d;
};

const toColomboYMD = (date) => {
  const t = new Date(date);
  const utcMs = t.getTime() + t.getTimezoneOffset() * 60000;
  const sl = new Date(utcMs + SL_OFFSET_MINUTES * 60000);

  const y = sl.getUTCFullYear();
  const m = sl.getUTCMonth();
  const d = sl.getUTCDate();

  return {
    y,
    m,
    d,
    key: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  };
};

const colomboStartOfToday = () => {
  const now = new Date();
  const { y, m, d } = toColomboYMD(now);

  // Colombo midnight converted to UTC instant
  const utcMs = Date.UTC(y, m, d) - SL_OFFSET_MINUTES * 60000;
  return new Date(utcMs);
};

const fullMonthsElapsedAtMidnight = (startDate, nowMidnightColombo) => {
  if (!startDate) return 0;
  const s = new Date(startDate);
  if (Number.isNaN(s.getTime())) return 0;

  const sYMD = toColomboYMD(s);
  const nYMD = toColomboYMD(nowMidnightColombo);

  let months = (nYMD.y - sYMD.y) * 12 + (nYMD.m - sYMD.m);

  // only count month when day reached
  if (nYMD.d < sYMD.d) months -= 1;

  return Math.max(months, 0);
};

const dueDateForMonth = (startDate, monthNumber) => {
  const base = addMonthsKeepDay(startDate, monthNumber);
  if (!base) return null;

  // force 00:00 Colombo on that day
  const { y, m, d } = toColomboYMD(base);
  const utcMs = Date.UTC(y, m, d) - SL_OFFSET_MINUTES * 60000;
  return new Date(utcMs);
};

export const getTodayNotifications = async (req, res) => {
  try {
    const todayMidnight = colomboStartOfToday();
    const todayKey = toColomboYMD(todayMidnight).key;

    const investments = await Investment.find()
      .populate("customerId", "nic name")
      .populate("brokerId", "nic name")
      .sort({ createdAt: -1 })
      .lean();

    const rows = [];

    for (const inv of investments) {
      const startDate = inv?.startDate ? new Date(inv.startDate) : null;
      if (!startDate || Number.isNaN(startDate.getTime())) continue;

      // ✅ Due day = startDate + 1 month @ 12:00AM Colombo
      const firstDue = dueDateForMonth(startDate, 1);
      if (!firstDue) continue;

      const dueKey = toColomboYMD(firstDue).key;
      if (dueKey !== todayKey) continue;

      const dueMonths = fullMonthsElapsedAtMidnight(startDate, todayMidnight);

      const principal = n(inv.investmentAmount);
      const rate = n(inv.investmentInterestRate);

      const monthInt = monthlyInterest(principal, rate);
      const expectedInterest = monthInt * dueMonths;

      const interestPaid = n(inv.interestPaidAmount);
      const arrearsAmount = Math.max(expectedInterest - interestPaid, 0);

      // show notification only if arrears exists
      if (arrearsAmount <= 0) continue;

      const arrearsMonthsCount =
        monthInt > 0 ? Math.ceil(arrearsAmount / monthInt) : 0;

      rows.push({
        investmentId: inv._id,
        investmentName: inv.investmentName || "",
        startDate: inv.startDate,

        customer: inv.customerId || null,
        broker: inv.brokerId || null,

        dueDate: firstDue,
        expireLabel: "Expire Today",

        monthlyInterest: Number(monthInt.toFixed(2)),
        arrearsAmount: Number(arrearsAmount.toFixed(2)),
        arrearsMonthsCount: Number(arrearsMonthsCount),
      });
    }

    return res.status(200).json({
      success: true,
      date: todayKey,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("getTodayNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTodayNotificationCount = async (req, res) => {
  try {
    const todayMidnight = colomboStartOfToday();
    const todayKey = toColomboYMD(todayMidnight).key;

    const investments = await Investment.find()
      .select("startDate investmentAmount investmentInterestRate interestPaidAmount")
      .lean();

    let count = 0;

    for (const inv of investments) {
      const startDate = inv?.startDate ? new Date(inv.startDate) : null;
      if (!startDate || Number.isNaN(startDate.getTime())) continue;

      const firstDue = dueDateForMonth(startDate, 1);
      if (!firstDue) continue;

      const dueKey = toColomboYMD(firstDue).key;
      if (dueKey !== todayKey) continue;

      const dueMonths = fullMonthsElapsedAtMidnight(startDate, todayMidnight);

      const principal = n(inv.investmentAmount);
      const rate = n(inv.investmentInterestRate);

      const monthInt = monthlyInterest(principal, rate);
      const expectedInterest = monthInt * dueMonths;

      const interestPaid = n(inv.interestPaidAmount);
      const arrearsAmount = Math.max(expectedInterest - interestPaid, 0);

      if (arrearsAmount > 0) count += 1;
    }

    return res.status(200).json({ success: true, date: todayKey, count });
  } catch (err) {
    console.error("getTodayNotificationCount error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
