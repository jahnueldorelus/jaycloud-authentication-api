import { connect, connection } from "mongoose";
import { usersModel } from "./models/users";
import { refreshTokensModel } from "./models/refresh-tokens";

const connectToDatabase = () => {
  connect(process.env["DATABASE_HOST"] || "", {
    dbName: process.env["DATABASE_NAME"],
    authSource: process.env["DATABASE_NAME"],
    auth: {
      username: process.env["DATABASE_USERNAME"],
      password: process.env["DATABASE_PASSWORD"],
    },
    authMechanism: "DEFAULT",
  });

  connection.once("open", () =>
    console.log("Connected to MongoDB successfully")
  );

  return { usersModel, refreshTokensModel };
};

export const dbAuth = connectToDatabase();
