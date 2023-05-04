import { IUser } from "@app-types/database/models/users";

export type UserData = IUser & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PrivateUserData = Omit<UserData, "id" | "password" | "updatedAt">;

export type PrivateSSOUserData = Pick<
  UserData,
  "firstName" | "lastName" | "isAdmin"
>;
