import type { Request, Response, NextFunction } from 'express';

type ValidatorFn = (body: unknown) => string | null;

export function validate(validator: ValidatorFn) {
  return (req: Request, res: Response, next: NextFunction) => {
    const error = validator(req.body);
    if (error) {
      res.status(400).json({ data: null, error });
      return;
    }
    next();
  };
}
