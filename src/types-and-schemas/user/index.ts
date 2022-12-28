export type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

// Makes some properties of the user's data optional to allow deletion
export type PrivateUserData = Partial<UserData> &
  Omit<UserData, "id" | "password" | "updatedAt">;
