import { Request, Response } from "express";

// VULNERABLE: Exposed Version Information
// Info severity - reveals application version
export function healthCheck(req: Request, res: Response) {
  return res.json({
    status: "healthy",
    version: "2.3.1",
    build: "2024-01-15",
    framework: "Express 4.18.2",
    node: process.version,
  });
}
