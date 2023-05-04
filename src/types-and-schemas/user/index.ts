export type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

export type PrivateUserData = Omit<UserData, "id" | "password" | "updatedAt">;

export type PrivateSSOUserData = Pick<UserData, "firstName" | "lastName">;
