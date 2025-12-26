export type DatabaseUserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_password: string;
  is_admin: 0 | 1;
  created_at: Date;
  updated_at: Date;
};
