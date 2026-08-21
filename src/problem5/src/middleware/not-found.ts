import type { Request, Response } from 'express';

// nothing matched, so it's a 404
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}
