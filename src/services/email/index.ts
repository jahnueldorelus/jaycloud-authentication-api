import { envNames } from "@startup/config";
import nodemailer, { TransportOptions } from "nodemailer";
import nodemailerHBS, {
  NodemailerExpressHandlebarsOptions,
} from "nodemailer-express-handlebars";
import path from "path";

export const emailService = nodemailer.createTransport(<TransportOptions>{
  service: "gmail",
  auth: {
    user: <string>process.env[envNames.mail.username],
    pass: <string>process.env[envNames.mail.password],
  },
});

emailService.use(
  "compile",
  nodemailerHBS(<NodemailerExpressHandlebarsOptions>{
    viewEngine: {
      extname: ".hbs",
      defaultLayout: false,
      partialsDir: path.resolve("./src/handlebars/email/partials"),
    },
    viewPath: path.resolve("./src/handlebars/email/templates"),
    extName: ".hbs",
  })
);
