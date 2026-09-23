import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import errorMiddleware from './middlewares/error.middleware';
import routes from './routes';
import { HttpStatus } from './utils/http-status';
import { sendError } from './utils/response';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(routes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend do BioRehab Lab online!'
  });
});

app.use((_req, res) => {
  return sendError(
    res,
    {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Recurso não encontrado.'
    },
    HttpStatus.NOT_FOUND
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso em http://localhost:${PORT}`);
});