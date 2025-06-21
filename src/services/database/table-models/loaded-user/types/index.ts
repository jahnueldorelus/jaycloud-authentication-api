import { LoadedUser } from "..";

export type TokenData = {
  firstName: string;
  lastName: string;
  email: string;
  iat?: number;
  exp?: number;
};

export type UserPublicData = Omit<
  LoadedUser,
  | "password"
  | "generateAccessToken"
  | "toPublicJson"
  | "toSsoJson"
  | "getFullName"
  | "generateRefreshToken"
>;

export type UserSsoData = Pick<
  UserPublicData,
  "firstName" | "lastName" | "isAdmin"
>;

export type AuthenticatedUserData = {
  userPublicData: UserPublicData;
  accessToken: string;
  refreshToken: any /**** PLEASE CHANGE ME TO ACTUAL REFREH TOKEN MODEL */;
};
