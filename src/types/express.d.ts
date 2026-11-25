export {};

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

declare global {
  namespace Express {
    interface Request {
      usuarioLogado: {
        id: number;
        isAdmin: boolean;
        canCreateStudy: boolean;
      };
      file?: UploadedFile;
    }
  }
}
