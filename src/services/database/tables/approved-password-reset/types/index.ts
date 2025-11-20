export type DatabaseApprovedPasswordResetData = {
  id: number;
  user_id: number;
  token: string;
  expiration_date: Date;
};
