import { Express } from "express";
import { userRouter } from "@routes/users";
import { dataRouter } from "@routes/data";
import { servicesRouter } from "@routes/services";
import { ssoRouter } from "@routes/sso";

/**
 * Adds all the routes to an Express server
 * @param server The Express server to add all the routes to
 */
export const addServerRoutes = (server: Express): void => {
  // Handles data requests
  server.use("/api/data", dataRouter);
  // Handles user requests
  server.use("/api/users", userRouter);
  // Handles service requests
  server.use("/api/services", servicesRouter);
  // Handles sso requests
  server.use("/api/sso", ssoRouter);
};
