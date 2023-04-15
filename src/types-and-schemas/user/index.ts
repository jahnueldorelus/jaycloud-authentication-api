export type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

type PersonalUserData = Omit<UserData, "id"> & { _id: string; __v: number };

// Makes some properties of the user's data optional to allow deletion
export type PrivateUserData = Partial<PersonalUserData> &
  Omit<UserData, "password" | "updatedAt">;

// Makes some properties of the user's data optional to allow deletion
export type PrivateSSOUserData = Partial<PersonalUserData> &
  Pick<UserData, "firstName" | "lastName">;
