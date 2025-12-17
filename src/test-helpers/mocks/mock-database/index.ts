import { db } from "@services/database";
import { MockDatabase } from "./types";

export const mockDb: MockDatabase<Omit<typeof db, "pool">> = {
  // Mocks all functions in Approved Password Reset table
  approvedPasswordReset: {
    createApprovedPasswordReset: jest
      .spyOn(db.approvedPasswordReset, "createApprovedPasswordReset")
      .mockImplementation(),
    deleteApprovedPasswordReset: jest
      .spyOn(db.approvedPasswordReset, "deleteApprovedPasswordReset")
      .mockImplementation(),
    deleteExpiredApprovedPasswordResets: jest
      .spyOn(db.approvedPasswordReset, "deleteExpiredApprovedPasswordResets")
      .mockImplementation(),
    getAprByToken: jest
      .spyOn(db.approvedPasswordReset, "getAprByToken")
      .mockImplementation(),
    getUserById: jest
      .spyOn(db.approvedPasswordReset, "getUserById")
      .mockImplementation(),
  },

  // Mocks all functions in Refresh Token table
  refreshToken: {
    createRefreshToken: jest
      .spyOn(db.refreshToken, "createRefreshToken")
      .mockImplementation(),
    expireRefreshToken: jest
      .spyOn(db.refreshToken, "expireRefreshToken")
      .mockImplementation(),
    getRefreshTokenByKey: jest
      .spyOn(db.refreshToken, "getRefreshTokenByKey")
      .mockImplementation(),
    getUserOfToken: jest
      .spyOn(db.refreshToken, "getUserOfToken")
      .mockImplementation(),
  },

  // Mocks all functions in Refresh Token Family table
  refreshTokenFamily: {
    createFamily: jest
      .spyOn(db.refreshTokenFamily, "createFamily")
      .mockImplementation(),
    deleteFamily: jest
      .spyOn(db.refreshTokenFamily, "deleteFamily")
      .mockImplementation(),
  },

  // Mocks all functions in Service table
  service: {
    getListOfServices: jest
      .spyOn(db.service, "getListOfServices")
      .mockImplementation(),
    getOneService: jest.spyOn(db.service, "getOneService").mockImplementation(),
  },

  // Mocks all functions in SSO Token table
  ssoToken: {
    createToken: jest.spyOn(db.ssoToken, "createToken").mockImplementation(),
    deleteExpiredTokens: jest
      .spyOn(db.ssoToken, "deleteExpiredTokens")
      .mockImplementation(),
    deleteToken: jest.spyOn(db.ssoToken, "deleteToken").mockImplementation(),
    getToken: jest.spyOn(db.ssoToken, "getToken").mockImplementation(),
  },

  // Mocks all functions in User table
  user: {
    authenticateUser: jest
      .spyOn(db.user, "authenticateUser")
      .mockImplementation(),
    createUser: jest.spyOn(db.user, "createUser").mockImplementation(),
    getUserByEmail: jest.spyOn(db.user, "getUserByEmail").mockImplementation(),
    getUserById: jest.spyOn(db.user, "getUserById").mockImplementation(),
    updateUser: jest.spyOn(db.user, "updateUser").mockImplementation(),
  },
};
