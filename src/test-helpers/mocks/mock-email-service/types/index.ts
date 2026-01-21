import { emailService } from "@services/email";

type UnmockableEmailServiceProperties =
  | "dkim"
  | "logger"
  | "MailMessage"
  | "meta"
  | "options"
  | "transporter";
type EmailService = Omit<typeof emailService, UnmockableEmailServiceProperties>;

export type MockEmailService = {
  [A in keyof EmailService]: EmailService[A] extends (
    ...args: infer Args
  ) => infer Return
    ? jest.SpyInstance<Return, Args>
    : jest.SpyInstance;
};
