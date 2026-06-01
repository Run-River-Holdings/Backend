import Customer from "../infastructure/schemas/customer.js";
import Broker from "../infastructure/schemas/broker.js";
import Investment from "../infastructure/schemas/investement.js";

const LK_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const validDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Sri Lanka calendar day number.
 * This makes "today" work as a full 24-hour Sri Lanka day.
 * Example: from 12:00 AM to 11:59 PM in Sri Lanka.
 */
const lkDayNumber = (date) => {
  const d = validDate(date);
  if (!d) return null;
  return Math.floor((d.getTime() + LK_OFFSET_MS) / DAY_MS);
};

/**
 * Compare only Sri Lanka calendar date, not exact time.
 */
const isSameSriLankaDay = (dateA, dateB = new Date()) => {
  const a = lkDayNumber(dateA);
  const b = lkDayNumber(dateB);

  if (a === null || b === null) return false;

  return a === b;
};

/**
 * Check whether dateA is before dateB by Sri Lanka calendar day.
 */
const isBeforeSriLankaDay = (dateA, dateB = new Date()) => {
  const a = lkDayNumber(dateA);
  const b = lkDayNumber(dateB);

  if (a === null || b === null) return false;

  return a < b;
};

/**
 * Count completed calendar-month cycles before today.
 *
 * Important:
 * If the due date is today, it is NOT counted as previous arrears yet.
 * It stays in Today's Expiry for the full 24-hour Sri Lanka day.
 */
const completedCyclesBeforeToday = (startDate, now = new Date()) => {
  const s = validDate(startDate);
  if (!s) return 0;

  let count = 0;

  const due = new Date(s);
  due.setMonth(due.getMonth() + 1);

  while (isBeforeSriLankaDay(due, now)) {
    count++;
    due.setMonth(due.getMonth() + 1);
  }

  return count;
};

/**
 * Get the Nth due date after startDate.
 * Example:
 * n = 1 means first due date, one month after startDate.
 */
const getNthDueDate = (startDate, n) => {
  const s = validDate(startDate);
  if (!s) return null;

  const d = new Date(s);
  d.setMonth(d.getMonth() + n);

  return d;
};

/**
 * Full investment calculation.
 *
 * Previous arrears calculation excludes today's cycle.
 * Today's expiry calculation checks whether the next due date is today
 * using Sri Lanka calendar date, not exact server time.
 */
const calcInvestment = (inv, now = new Date()) => {
  const principal = safeNum(inv.investmentAmount);
  const totalRate = safeNum(inv.investmentInterestRate);
  const brokerRate = safeNum(inv.brokerCommissionRate);
  const ownerRate = totalRate - brokerRate;

  const monthlyTotalInterest = (principal * totalRate) / 100;
  const monthlyBrokerCommission = (principal * brokerRate) / 100;
  const monthlyOwnerInterest = (principal * ownerRate) / 100;

  /**
   * Only cycles before today are counted as previous arrears.
   * If due date is today, it stays under Today's Expiry for 24 hours.
   */
  const cycles = completedCyclesBeforeToday(inv.startDate, now);

  const totalDueInterestBeforeToday = monthlyTotalInterest * cycles;
  const interestPaid = safeNum(inv.interestPaidAmount);

  const arrearsInterest = Math.max(totalDueInterestBeforeToday - interestPaid, 0);

  const principalPaid = safeNum(inv.principalPaidAmount);

  const principalPending =
    inv.remainingPendingAmount === null || inv.remainingPendingAmount === undefined
      ? Math.max(principal - principalPaid, 0)
      : Math.max(safeNum(inv.remainingPendingAmount), 0);

  const arrearsMonthsCount =
    arrearsInterest > 0 && monthlyTotalInterest > 0
      ? Math.ceil(arrearsInterest / monthlyTotalInterest)
      : 0;

  const firstMissedCycleNumber = cycles - arrearsMonthsCount + 1;

  const arrearsStartDate =
    arrearsMonthsCount > 0
      ? getNthDueDate(inv.startDate, firstMissedCycleNumber)
      : null;

  /**
   * Next due date after previous completed cycles.
   * If this next due date is today, Today's Expiry should show it
   * for the whole Sri Lanka day.
   */
  const nextDueDate = getNthDueDate(inv.startDate, cycles + 1);

  const isCycleDueToday = isSameSriLankaDay(nextDueDate, now);

  /**
   * Check whether today's cycle is already paid.
   * If interestPaid already covers previous arrears + today's interest,
   * then do not show it as today's expiry.
   */
  const totalDueIncludingToday =
    monthlyTotalInterest * (cycles + (isCycleDueToday ? 1 : 0));

  const totalOutstandingIncludingToday = Math.max(
    totalDueIncludingToday - interestPaid,
    0
  );

  const todayDueOutstanding = isCycleDueToday
    ? Math.max(totalOutstandingIncludingToday - arrearsInterest, 0)
    : 0;

  const hasTodayDue =
    isCycleDueToday && principalPending > 0 && todayDueOutstanding > 0;

  const todayDueDate = hasTodayDue ? nextDueDate : null;

  let status = "ongoing";

  if (principalPending <= 0 && arrearsInterest <= 0 && !hasTodayDue) {
    status = "complete";
  } else if (arrearsInterest > 0) {
    status = "arrears";
  } else {
    status = "ongoing";
  }

  return {
    principal,
    totalRate,
    brokerRate,
    ownerRate,

    monthlyTotalInterest: Number(monthlyTotalInterest.toFixed(2)),
    monthlyBrokerCommission: Number(monthlyBrokerCommission.toFixed(2)),
    monthlyOwnerInterest: Number(monthlyOwnerInterest.toFixed(2)),

    cycles,
    totalDueInterest: Number(totalDueInterestBeforeToday.toFixed(2)),
    interestPaid: Number(interestPaid.toFixed(2)),

    arrearsInterest: Number(arrearsInterest.toFixed(2)),
    arrearsMonthsCount,
    arrearsStartDate,

    nextDueDate,
    todayDueDate,
    hasTodayDue,
    todayDueOutstanding: Number(todayDueOutstanding.toFixed(2)),

    principalPending: Number(principalPending.toFixed(2)),
    status,
  };
};

/**
 * GET /api/notifications
 *
 * previousArrears:
 *   Customers with arrears before today.
 *
 * todayArrears:
 *   Customers whose payment is due today.
 *   Today's expiry cards stay visible for the full Sri Lanka day.
 */
export const getNotifications = async (req, res) => {
  try {
    const now = new Date();

    const investments = await Investment.find()
      .populate("customerId", "nic name address city tpNumber")
      .populate("brokerId", "nic name address city tpNumber")
      .sort({ createdAt: -1 })
      .lean();

    const customerMap = new Map();

    for (const inv of investments) {
      const customer = inv.customerId;

      if (!customer) continue;

      const cKey = String(customer._id);

      if (!customerMap.has(cKey)) {
        customerMap.set(cKey, {
          customer,
          investments: [],
        });
      }

      customerMap.get(cKey).investments.push(inv);
    }

    const previousArrears = [];
    const todayArrears = [];

    for (const [, entry] of customerMap) {
      const { customer, investments: invs } = entry;

      let totalArrearsInterest = 0;
      let totalArrearsMonths = 0;
      let earliestArrearsDate = null;
      let hasTodayDue = false;
      let hasPreviousArrears = false;

      const arrearsInvestments = [];

      for (const inv of invs) {
        const calc = calcInvestment(inv, now);

        if (calc.status === "complete") continue;

        totalArrearsInterest += calc.arrearsInterest;
        totalArrearsMonths += calc.arrearsMonthsCount;

        if (calc.arrearsInterest > 0 && calc.arrearsStartDate) {
          if (
            !earliestArrearsDate ||
            calc.arrearsStartDate < earliestArrearsDate
          ) {
            earliestArrearsDate = calc.arrearsStartDate;
          }

          hasPreviousArrears = true;
        }

        if (calc.hasTodayDue) {
          hasTodayDue = true;
        }

        if (calc.arrearsInterest > 0 || calc.hasTodayDue) {
          arrearsInvestments.push({
            _id: inv._id,
            investmentName: inv.investmentName,

            investmentAmount: calc.principal,
            investmentInterestRate: calc.totalRate,
            brokerCommissionRate: calc.brokerRate,
            ownerInterestRate: calc.ownerRate,

            monthlyTotalInterest: calc.monthlyTotalInterest,
            monthlyBrokerCommission: calc.monthlyBrokerCommission,
            monthlyOwnerInterest: calc.monthlyOwnerInterest,

            startDate: inv.startDate,
            cycles: calc.cycles,

            totalDueInterest: calc.totalDueInterest,
            interestPaid: calc.interestPaid,

            arrearsInterest: calc.arrearsInterest,
            arrearsMonthsCount: calc.arrearsMonthsCount,
            arrearsStartDate: calc.arrearsStartDate,

            nextDueDate: calc.nextDueDate,
            todayDueDate: calc.todayDueDate,
            todayDueOutstanding: calc.todayDueOutstanding,

            principalPending: calc.principalPending,
            status: calc.status,

            broker: inv.brokerId
              ? {
                  _id: inv.brokerId._id,
                  name: inv.brokerId.name,
                  nic: inv.brokerId.nic,
                  address: inv.brokerId.address,
                  city: inv.brokerId.city,
                  tpNumber: inv.brokerId.tpNumber,
                }
              : null,
          });
        }
      }

      const entry_data = {
        customerId: customer._id,

        customer: {
          _id: customer._id,
          name: customer.name,
          nic: customer.nic,
          address: customer.address,
          city: customer.city,
          tpNumber: customer.tpNumber,
        },

        totalArrearsInterest: Number(totalArrearsInterest.toFixed(2)),
        totalArrearsMonths,
        earliestArrearsDate,

        hasTodayDue,
        hasPreviousArrears,

        arrearsInvestments,

        isAlsoTodayDue: hasPreviousArrears && hasTodayDue,
      };

      if (hasPreviousArrears) {
        previousArrears.push(entry_data);
      }

      if (hasTodayDue) {
        todayArrears.push(entry_data);
      }
    }

    previousArrears.sort((a, b) => {
      if (!a.earliestArrearsDate) return 1;
      if (!b.earliestArrearsDate) return -1;

      return new Date(a.earliestArrearsDate) - new Date(b.earliestArrearsDate);
    });

    todayArrears.sort((a, b) => {
      const nameA = String(a.customer?.name || "").toLowerCase();
      const nameB = String(b.customer?.name || "").toLowerCase();

      return nameA.localeCompare(nameB);
    });

    return res.status(200).json({
      success: true,

      rule:
        "Today's expiry is calculated using Sri Lanka calendar day. Cards stay visible from 12:00 AM to 11:59 PM.",

      counts: {
        previousArrears: previousArrears.length,
        todayArrears: todayArrears.length,
      },

      previousArrears,
      todayArrears,
    });
  } catch (err) {
    console.error("getNotifications error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};