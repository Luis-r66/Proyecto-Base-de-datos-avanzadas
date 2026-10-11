import { z } from "zod";

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectId = (msg = "ID invalido") =>
  z.string().regex(objectIdRegex, msg);

export const optionalObjectId = (msg = "ID invalido") =>
  z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().regex(objectIdRegex, msg).optional()
  );
