import { z } from "zod";

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectId = (msg = "ID inválido") =>
  z.string().regex(objectIdRegex, msg);

export const optionalObjectId = (msg = "ID inválido") =>
  z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().regex(objectIdRegex, msg).optional()
  );
