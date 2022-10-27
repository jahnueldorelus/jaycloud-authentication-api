"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.post("/new", async (req, res, next) => {
    next();
});
exports.userRouter.post("/", async (req, res, next) => {
    next();
});
exports.userRouter.post("/refreshToken", async (req, res, next) => {
    next();
});
exports.userRouter.get("/form-models", async (req, res, next) => {
    next();
});
