import { Request as ExpressRequest } from "express";
import Joi from "joi";

type Controller = {
  transferRoute: (arg0: ExpressRequest) => Promise<void>;
};

const requestDataSchema = Joi.object({
  app: Joi.string().valid(
    "jaylock",
    "jayblog",
    "chants-desperance",
    "jayheart",
    "jayspark"
  ),
});

export const DataController: Controller = {
  transferRoute: async (req: ExpressRequest) => {
    const reqData = req.body;
    const validationResults = requestDataSchema.validate(reqData);
    if (validationResults.error) {
      console.log("Validation failed");
    } else {
      console.log("Validation passed");
    }
  },
};
