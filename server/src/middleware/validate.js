/**
 * Middleware factory for validating request parts with Zod schemas
 * @param {{ body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schemas
 */
export const validate = (schemas) => async (req, res, next) => {
  try {
    if (schemas.params) {
      req.params = await schemas.params.parseAsync(req.params);
    }
    if (schemas.query) {
      req.query = await schemas.query.parseAsync(req.query);
    }
    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }
    next();
  } catch (error) {
    next(error);
  }
};
