import { connect, connection } from "mongoose";
import { usersModel } from "./models/users";
import { refreshTokensModel } from "./models/refresh-tokens";
import { refreshTokenFamiliesModel } from "./models/refresh-token-families";
import { approvedPasswordResetModel } from "./models/approved-password-reset";
import { servicesModel } from "./models/services";
import { ssoModel } from "./models/sso";
import { envNames } from "@startup/config";

const connectToDatabase = () => {
  connect(process.env[envNames.db.host] || "", {
    dbName: process.env[envNames.db.name],
    authSource: process.env[envNames.db.name],
    auth: {
      username: process.env[envNames.db.user],
      password: process.env[envNames.db.password],
    },
    authMechanism: "DEFAULT",
    directConnection: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });

  connection.once("open", () =>
    console.log("Connected to MongoDB successfully")
  );

  return {
    usersModel,
    refreshTokensModel,
    refreshTokenFamiliesModel,
    approvedPasswordResetModel,
    servicesModel,
    ssoModel,
  };
};

export const dbAuth = connectToDatabase();
