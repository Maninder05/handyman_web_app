import { validationResult } from "express-validator";

export default function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({
      message: errorMessages[0] || "Validation failed",
      errors: errors.array().map(err => ({ field: err.param, msg: err.msg })),
    });
  }
  next();
}
