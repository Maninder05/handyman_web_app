const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwt.js");

const jwtAuthWithNext = (req, resp, next) => {
  const full_token =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!full_token) {
    return resp
      .status(401)
      .json({ status: false, message: "No token provided" });
  }

  const parts = full_token.split(" ");
  const actualToken = parts.length === 1 ? parts[0] : parts[1];

  if (!actualToken) {
    return resp
      .status(401)
      .json({ status: false, message: "Invalid token format" });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(actualToken, secret);

    // store user info on req.user
    req.user = decoded;

    // If old code expects req.query.item, try to set if payload matches
    if (decoded?.result?.emailid)
      (req.query = req.query || {}), (req.query.item = decoded.result.emailid);

    next();
  } catch (err) {
    console.log("[JWT Verification Error]:", err.message);
    if (err.name === "TokenExpiredError") {
      return resp.status(401).json({ status: false, message: "Token expired" });
    }
    return resp.status(401).json({ status: false, message: "Invalid token" });
  }
};

module.exports = jwtAuthWithNext;
