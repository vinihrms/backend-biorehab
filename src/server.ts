import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso em http://localhost:${PORT}`);
});