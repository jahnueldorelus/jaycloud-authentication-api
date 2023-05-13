import checkConfig, { envNames } from "@startup/config";
/**
 * Checks to make sure all required configuration is available
 * before attempting to continue to run the application
 */
const configResults = checkConfig();

if (!configResults.configComplete) {
  // Logs the error
  console.log(configResults.error);
  // Exists the application
  process.exit(0);
}

import express from "express";
import { addServerRoutes } from "@startup/routes";
import { addStartMiddleware, addEndMiddleware } from "@startup/middleware";
import { startBackgroundTasks } from "@startup/cron";

// Express server
const server = express();

// Adds all the starting middlware used by the server
addStartMiddleware(server);

// Adds all routes used by the server
addServerRoutes(server);

// Adds all the ending middlware used by the server
addEndMiddleware(server);

// Starts all scheduled background tasks
startBackgroundTasks();

// The port for the server to listen on
let port: number | string;
switch (process.env[envNames.nodeEnv]) {
  case "development":
    port = 61177;
    break;
  case "test":
    port = 0; // Port 0 tells the OS to choose a random port
    break;
  default:
    port = 61179;
}

// The application
module.exports = server.listen(port, () => {
  console.log("Connected to port", port, "successfully.");
});
