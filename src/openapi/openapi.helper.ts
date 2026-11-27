import { z } from 'zod';

export type OpenApiSchema = Record<string, unknown>;

export type OpenApiParameter = {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  description: string;
  schema: OpenApiSchema;
};

export type OpenApiResponse =
  | { $ref: string }
  | {
      description: string;
      content?: Record<string, { schema: OpenApiSchema }>;
    };

export type OpenApiRequestBody = {
  required: boolean;
  description?: string;
  content: Record<string, { schema: OpenApiSchema }>;
};

export type OpenApiOperation = {
  tags: string[];
  summary: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
};

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type OpenApiPaths = Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;

/**
 * Converte um schema Zod v4 para JSON Schema compatível com OpenAPI 3.0.3,
 * preservando campos de data (`z.coerce.date()`) como string `date-time`.
 */
export function zodToOpenApi(schema: z.ZodTypeAny): OpenApiSchema {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    unrepresentable: 'any',
    io: 'input',
    override: (ctx) => {
      const zodSchema = ctx.zodSchema as { _zod?: { def?: { type?: string } } } | undefined;
      if (zodSchema?._zod?.def?.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date-time';
      }
    },
  }) as OpenApiSchema;
}

export function intPathParam(name: string, description: string): OpenApiParameter {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'integer', minimum: 1 },
  };
}

export function strPathParam(name: string, description: string): OpenApiParameter {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'string' },
  };
}

export function queryParam(
  name: string,
  description: string,
  schema: OpenApiSchema = { type: 'string' },
  required = false
): OpenApiParameter {
  return {
    name,
    in: 'query',
    required,
    description,
    schema,
  };
}

export function jsonBody(schema: z.ZodTypeAny, description?: string): OpenApiRequestBody {
  return {
    required: true,
    ...(description ? { description } : {}),
    content: {
      'application/json': {
        schema: zodToOpenApi(schema),
      },
    },
  };
}

export function successEnvelope(dataSchema: OpenApiSchema = { nullable: true }): OpenApiSchema {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: dataSchema,
      message: { type: 'string' },
      meta: { type: 'object', additionalProperties: true },
    },
    required: ['success', 'data'],
  };
}

export function jsonResponse(description: string, dataSchema?: OpenApiSchema): OpenApiResponse {
  return {
    description,
    content: {
      'application/json': {
        schema: successEnvelope(dataSchema),
      },
    },
  };
}

export type EndpointConfig = {
  tag: string;
  summary: string;
  description?: string;
  isPublic?: boolean;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  successStatus?: '200' | '201' | '204';
  successDescription?: string;
  responseDataSchema?: OpenApiSchema;
  responses?: Record<string, OpenApiResponse>;
  errors?: Array<400 | 401 | 403 | 404 | 409 | 422>;
};

const ERROR_REFS: Record<400 | 401 | 403 | 404 | 409 | 422, string> = {
  400: '#/components/responses/BadRequestError',
  401: '#/components/responses/UnauthorizedError',
  403: '#/components/responses/ForbiddenError',
  404: '#/components/responses/NotFoundError',
  409: '#/components/responses/ConflictError',
  422: '#/components/responses/ValidationError',
};

export function createOperation(config: EndpointConfig): OpenApiOperation {
  const status = config.successStatus ?? '200';
  const defaultSuccess: Record<string, OpenApiResponse> =
    status === '204'
      ? { '204': { description: config.successDescription ?? 'Operação concluída sem conteúdo.' } }
      : {
          [status]: jsonResponse(
            config.successDescription ?? 'Operação realizada com sucesso.',
            config.responseDataSchema ?? { type: 'object', additionalProperties: true }
          ),
        };

  const responses: Record<string, OpenApiResponse> = {
    ...defaultSuccess,
    ...(config.responses ?? {}),
  };

  const errorCodes = new Set<400 | 401 | 403 | 404 | 409 | 422>(config.errors ?? []);
  if (!config.isPublic) {
    errorCodes.add(401);
  }
  if (config.requestBody) {
    errorCodes.add(422);
  }

  for (const code of errorCodes) {
    responses[String(code)] = { $ref: ERROR_REFS[code] };
  }

  return {
    tags: [config.tag],
    summary: config.summary,
    ...(config.description ? { description: config.description } : {}),
    security: config.isPublic ? [] : [{ bearerAuth: [] }],
    ...(config.parameters && config.parameters.length > 0 ? { parameters: config.parameters } : {}),
    ...(config.requestBody ? { requestBody: config.requestBody } : {}),
    responses,
  };
}
