import { Options } from "nodemailer/lib/mailer";

interface MailOptionsWithHandlebars<T> extends Options {
  template: string;
  context: T;
}

export type MailOptionsPasswordReset = MailOptionsWithHandlebars<{
  pageTitle: string;
  userFullName: string;
  userLink: string;
}>;
