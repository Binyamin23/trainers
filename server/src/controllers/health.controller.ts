import { Request, Response } from "express";

export const healthController = {
  check(_req: Request, res: Response) {
    console.log('hi from server')
    res.json({ status: "ok" });
  },
};
