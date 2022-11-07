import { PrivateUserData } from "@app-types/user";
import { HydratedDocument, Model } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IUserMethods {
  generateAccessToken(): string;
  toPrivateJSON(): PrivateUserData;
}

export interface UsersModel extends Model<IUser, {}, IUserMethods> {
  authenticateUser(
    email: string,
    password: string
  ): Promise<HydratedDocument<IUser, IUserMethods> | null>;
}
