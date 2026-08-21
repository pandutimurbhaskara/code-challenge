import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { config } from '../config.js';
import { HttpError } from '../utils/http-error.js';

// Everything funnels through here and comes out as { error: { message, details? } }.
// The unused `_next` has to stay — 4 args is how Express knows it's an error handler.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  // express.json() throws this on a broken body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'Invalid JSON in request body' } });
    return;
  }

  // anything unanticipated — log it, hide the details in prod
  console.error(err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      ...(config.nodeEnv === 'development' && err instanceof Error
        ? { details: err.message }
        : {}),
    },
  });
};
