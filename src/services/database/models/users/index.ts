import { TokenData } from "@app-types/token/access-token";
import { ClientSession, connection, model, Schema } from "mongoose";
import { sign as jwtSign, SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrivateSSOUserData, PrivateUserData, UserData } from "@app-types/user";
import {
  IUser,
  IUserMethods,
  DBLoadedUser,
  UsersModel,
} from "@app-types/database/models/users";
import { envNames } from "@startup/config";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const usersSchema = new Schema<IUser, UsersModel, IUserMethods>(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 255,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 255,
    },
    email: {
      type: String,
      required: true,
      minLength: 5,
      maxLength: 100,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 5,
    },
  },
  {
    timestamps: true,
  }
);

usersSchema.static(
  "authenticateUser",
  async function (
    email: string,
    password: string,
    givenSession?: ClientSession
  ) {
    const dbSession = givenSession
      ? givenSession
      : await connection.startSession();

    try {
      // Creates a new transaction if no session was provided
      if (!givenSession || !givenSession.inTransaction()) {
        dbSession.startTransaction();
      }

      const user = await usersModel.findOne({ email }).session(dbSession);

      // Commits the transaction if it was created within this method
      if (!givenSession) {
        await dbSession.commitTransaction();
      }

      if (user) {
        const isAuthenticated = await bcrypt.compare(password, user.password);

        if (isAuthenticated) {
          return user;
        }
      }

      return null;
    } catch (error) {
      // Aborts the transaction if it was created within this method
      if (!givenSession && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }

      return null;
    } finally {
      // Ends the session if it was created within this method
      if (!givenSession) {
        await dbSession.endSession();
      }
    }
  }
);

usersSchema.method<DBLoadedUser>("generateAccessToken", function () {
  // The user's data to attach to their web token
  const userData: TokenData = {
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
  };

  // Returns the user's web token
  return jwtSign(
    userData,
    <string>process.env[envNames.jwt.privateKey],
    <SignOptions>{
      algorithm: <string>process.env[envNames.jwt.alg],
      expiresIn: <string>process.env[envNames.jwt.accessExpiration],
    }
  );
});

usersSchema.method<DBLoadedUser>("toPrivateJSON", function () {
  const userData: UserData = this.toJSON();

  const privateJSON: PrivateUserData = {
    createdAt: userData.createdAt,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
  };

  return privateJSON;
});

usersSchema.method<DBLoadedUser>("toPrivateSSOJSON", function () {
  const privateJSON: PrivateSSOUserData = {
    firstName: this.firstName,
    lastName: this.lastName,
  };

  return privateJSON;
});

usersSchema.method<DBLoadedUser>("getFullName", function () {
  const firstName: string =
    this.firstName[0]?.toUpperCase() + this.firstName.slice(1);
  const lastName: string =
    this.lastName[0]?.toUpperCase() + this.lastName.slice(1);

  return `${firstName} ${lastName}`;
});

export const usersModel = model<IUser, UsersModel>(
  "users",
  usersSchema,
  "users"
);
