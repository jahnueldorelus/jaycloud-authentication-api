import { connect, connection } from "mongoose";
import { usersModel } from "./models/users";
import { refreshTokensModel } from "./models/refresh-tokens";
import { refreshTokenFamiliesModel } from "./models/refresh-token-families";
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
  });

  connection.once("open", () =>
    console.log("Connected to MongoDB successfully")
  );

  return { usersModel, refreshTokensModel, refreshTokenFamiliesModel };
};

export const dbAuth = connectToDatabase();
