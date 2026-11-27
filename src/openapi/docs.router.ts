import type { Request, Response } from 'express';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiSpec } from './openapi.spec';

const docsRouter = Router();

function resolveServerUrl(req: Request): string | undefined {
  const forwardedHost = req.get('x-forwarded-host');
  const host = forwardedHost ?? req.get('host');
  if (!host) {
    return undefined;
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto ? forwardedProto.split(',')[0]?.trim() || req.protocol : req.protocol;
  return `${protocol}://${host}`;
}

if (process.env.ENABLE_API_DOCS !== 'false') {
  docsRouter.get('/api/docs.json', (req: Request, res: Response) => {
    const spec = buildOpenApiSpec(process.env.API_PUBLIC_URL || resolveServerUrl(req));
    return res.status(200).json(spec);
  });

  docsRouter.use('/api/docs', swaggerUi.serve);
  docsRouter.get(
    '/api/docs',
    swaggerUi.setup(null, {
      customSiteTitle: 'BioRehab Lab — Documentação da API',
      swaggerOptions: {
        url: '/api/docs.json',
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    })
  );
}

export default docsRouter;
