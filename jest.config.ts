import { pathsToModuleNameMapper } from "ts-jest";
import tsConfig from "tsconfig.json";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  coveragePathIgnorePatterns: ["/node_modules/"],
  roots: ["<rootDir>/src"],
};
