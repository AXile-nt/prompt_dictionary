import { Request, Response, NextFunction } from "express";
import { ValidationError } from "./errorHandler";

export function validateBody(requiredFields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });
    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
    }
    next();
  };
}

export function validateParams(requiredParams: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missing = requiredParams.filter((param) => !req.params[param]);
    if (missing.length > 0) {
      throw new ValidationError(`Missing required params: ${missing.join(", ")}`);
    }
    next();
  };
}
