import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 2 AM UTC to check and delete inactive club owner accounts
crons.daily(
  "delete-inactive-club-owners",
  {
    hourUTC: 2,
    minuteUTC: 0,
  },
  internal.users.checkAndDeleteInactiveClubOwnersInternal
);

// Run every hour to check for subscriptions that need to be processed at period end
crons.hourly(
  "process-scheduled-subscriptions",
  {
    minuteUTC: 0, // At the top of the hour
  },
  internal.subscriptions.processScheduledSubscriptionChanges
);

// Also run daily at midnight UTC for safety
crons.daily(
  "process-scheduled-subscriptions-daily",
  {
    hourUTC: 0,
    minuteUTC: 0,
  },
  internal.subscriptions.processScheduledSubscriptionChanges
);

