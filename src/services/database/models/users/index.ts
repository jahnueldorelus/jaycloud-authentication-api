import { TokenData } from "@app-types/token";
import { model, Schema } from "mongoose";
import { sign as jwtSign, SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrivateUserData, UserData } from "@app-types/user";
import {
  IUser,
  IUserMethods,
  UsersModel,
} from "@app-types/database/models/users";

/**
 * ANY CHANGES MADE TO THE SCHEMA MUST ALSO BE MADE IN MODEL'S TYPES
 */
const usersSchema = new Schema<IUser, UsersModel, IUserMethods>(
  {
    firstName: {
      type: String,
      required: true,
      min: 1,
    },
    lastName: {
      type: String,
      required: true,
      min: 1,
    },
    email: {
      type: String,
      required: true,
      min: 1,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

usersSchema.static(
  "authenticateUser",
  /**
   * Attempts to authenticate a user using their credentials.
   * If successful, an access token is returned, otherwise null.
   * @param email The user's email
   * @param password The user's password
   */
  async function authenticateUser(email: string, password: string) {
    const user = await usersModel.findOne({ email });

    if (user) {
      const isAuthenticated = await bcrypt.compare(password, user.password);

      if (isAuthenticated) {
        return user;
      }
    }

    return null;
  }
);

usersSchema.method(
  "generateAccessToken",
  /**
   * Generates an access token of the user.
   */
  function generateAccessToken() {
    // The user's data to attach to their web token
    const userData: TokenData = {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
    };

    // Returns the user's web token
    return jwtSign(
      userData,
      <string>process.env["JWT_KEY"],
      <SignOptions>{
        algorithm: <string>process.env["JWT_ALGORITHM"],
        expiresIn: <string>process.env["JWT_ACC_EXP"],
      }
    );
  }
);

usersSchema.method(
  "toPrivateJSON",
  /**
   * Generates a JSON that excludes a user's private information.
   */
  function toPrivateJSON() {
    const privateJSON: PrivateUserData = <UserData>this.toJSON();
    delete privateJSON.id;
    delete privateJSON.password;
    delete privateJSON.updatedAt;

    return privateJSON;
  }
);

export const usersModel = model<IUser, UsersModel>(
  "users",
  usersSchema,
  "users"
);
