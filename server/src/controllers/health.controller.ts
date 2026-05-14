import { Request, Response } from "express";

export const healthController = {
  check(_req: Request, res: Response) {
    res.json({ status: "ok" });
  },
};
