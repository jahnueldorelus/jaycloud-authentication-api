import { emailService } from "@services/email";
import { MockEmailService } from "./types";

export const mockEmailService: MockEmailService = {
  addListener: jest.spyOn(emailService, "addListener").mockImplementation(),

  close: jest.spyOn(emailService, "close").mockImplementation(),

  emit: jest.spyOn(emailService, "emit").mockImplementation(),

  eventNames: jest.spyOn(emailService, "eventNames").mockImplementation(),

  get: jest.spyOn(emailService, "get").mockImplementation(),

  getMaxListeners: jest
    .spyOn(emailService, "getMaxListeners")
    .mockImplementation(),

  getVersionString: jest
    .spyOn(emailService, "getVersionString")
    .mockImplementation(),

  isIdle: jest.spyOn(emailService, "isIdle").mockImplementation(),

  listenerCount: jest.spyOn(emailService, "listenerCount").mockImplementation(),

  listeners: jest.spyOn(emailService, "listeners").mockImplementation(),

  off: jest.spyOn(emailService, "off").mockImplementation(),

  on: jest.spyOn(emailService, "on").mockImplementation(),

  once: jest.spyOn(emailService, "once").mockImplementation(),

  prependListener: jest
    .spyOn(emailService, "prependListener")
    .mockImplementation(),

  prependOnceListener: jest
    .spyOn(emailService, "prependOnceListener")
    .mockImplementation(),

  rawListeners: jest.spyOn(emailService, "rawListeners").mockImplementation(),

  removeAllListeners: jest
    .spyOn(emailService, "removeAllListeners")
    .mockImplementation(),

  removeListener: jest
    .spyOn(emailService, "removeListener")
    .mockImplementation(),

  sendMail: jest.spyOn(emailService, "sendMail").mockImplementation(),

  set: jest.spyOn(emailService, "set").mockImplementation(),

  setMaxListeners: jest
    .spyOn(emailService, "setMaxListeners")
    .mockImplementation(),

  setupProxy: jest.spyOn(emailService, "setupProxy").mockImplementation(),

  use: jest.spyOn(emailService, "use").mockImplementation(),

  verify: jest.spyOn(emailService, "verify").mockImplementation(),
};
