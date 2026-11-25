import type { RequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer') as {
  (options: {
    storage: unknown;
    limits?: { fileSize?: number };
  }): { single(fieldName: string): RequestHandler };
  memoryStorage(): unknown;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});

export const uploadPlanilhaMiddleware: RequestHandler = upload.single('arquivo');
