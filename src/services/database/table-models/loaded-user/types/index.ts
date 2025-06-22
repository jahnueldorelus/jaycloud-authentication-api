import { LoadedUser } from "..";
import { LoadedRefreshToken } from "../../loaded-refresh-token";
import { LoadedRefreshTokenFamily } from "../../loaded-refresh-token-family";
import { LoadedSsoToken } from "../../loaded-sso-token";

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
  | "getPublicInfoJson"
  | "getSsoInfoJson"
  | "getFullName"
  | "generateRefreshTokenOrigins"
  | "generateSsoToken"
>;

export type UserSsoData = Pick<
  UserPublicData,
  "firstName" | "lastName" | "isAdmin"
>;

export type AuthenticatedUserData = {
  userPublicInfo: UserPublicData;
  accessToken: string;
  refreshToken: LoadedRefreshToken;
  refreshTokenFamily: LoadedRefreshTokenFamily;
  ssoToken: LoadedSsoToken;
};

export type RefreshTokenOrigins = {
  refreshTokenFamily: LoadedRefreshTokenFamily;
  refreshToken: LoadedRefreshToken;
};
