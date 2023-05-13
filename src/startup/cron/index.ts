import { CronJobs } from "@app-types/cron";
import cron from "node-cron";
import { dbAuth } from "@services/database";
import moment from "moment";

/**
 * Logs a message to the console with the date and time it logged
 * the message.
 * @param message The message to log
 */
const logMessageWithTime = (message: string) => {
  const currentDate = moment(new Date());
  const dateString = currentDate.format("M/D/YYYY h:mma");

  console.log(dateString, message);
};

/**
 * Removes expired password resets from the database.
 */
const removeExpiredPasswordResets = () => {
  return cron.schedule(
    "0 */6 * * *",
    async () => {
      logMessageWithTime(
        "Attempting to remove expired password resets from database."
      );
      const removedExpired =
        await dbAuth.approvedPasswordResetModel.deleteExpiredApprovedPassResets();
      logMessageWithTime(
        `${
          removedExpired ? "Successfully removed" : "Failed removing"
        } expired password resets from database.`
      );
    },
    {
      name: "remove-expired-password-resets",
      scheduled: true,
      timezone: "America/New_York",
      recoverMissedExecutions: false,
      runOnInit: false,
    }
  );
};

/**
 * Removes expired password sso tokens from the database.
 */
const removeExpiredSSOTokens = () => {
  return cron.schedule(
    "0 */6 * * *",
    async () => {
      logMessageWithTime(
        "Attempting to remove expired refresh tokens from database."
      );
      const removedExpired = await dbAuth.ssoModel.deleteMany({
        expDate: { $lte: new Date() },
      });
      logMessageWithTime(
        `${
          removedExpired ? "Successfully removed" : "Failed removing"
        } expired sso tokens from database.`
      );
    },
    {
      name: "remove-expired-refresh-tokens",
      scheduled: true,
      timezone: "America/New_York",
      recoverMissedExecutions: false,
      runOnInit: false,
    }
  );
};

const cronJobs: CronJobs = [
  removeExpiredPasswordResets(),
  removeExpiredSSOTokens(),
];

/**
 * Starts all background tasks of the server.
 */
export const startBackgroundTasks = () => {
  cronJobs.forEach((job) => job.start());
};
