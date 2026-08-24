import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import {
  createAuthMiddlewareForClientCredentialsFlow,
  createClient,
  createHttpMiddleware,
} from '@commercetools/ts-client';

const projectKey = process.env.NEXT_PUBLIC_CT_PROJECT_KEY;
const apiUrl = process.env.NEXT_PUBLIC_CT_API_URL;
const authUrl = process.env.NEXT_PUBLIC_CT_AUTH_URL;
const clientId = process.env.CT_CLIENT_ID;
const clientSecret = process.env.CT_CLIENT_SECRET;

if (!projectKey || !apiUrl || !authUrl || !clientId || !clientSecret) {
  throw new Error('Missing commercetools environment variables');
}

const authMiddleware = createAuthMiddlewareForClientCredentialsFlow({
  host: authUrl,
  projectKey,
  credentials: { clientId, clientSecret },
  scopes: [`manage_project:${projectKey}`],
  httpClient: fetch,
});

const httpMiddleware = createHttpMiddleware({ host: apiUrl, httpClient: fetch });
const ctpClient = createClient({ middlewares: [authMiddleware, httpMiddleware] });

// The generated Platform SDK exposes typed request builders and executes them
// through the ts-client configured above.
export const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({
  projectKey,
});
