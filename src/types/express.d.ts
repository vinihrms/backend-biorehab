export {};

declare global {
  namespace Express {
    interface Request {
      usuarioLogado: {
        id: number;
        isAdmin: boolean;
      };
    }
  }
}