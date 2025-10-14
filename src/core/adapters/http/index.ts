export { HttpClient } from './client';
export { RequestInterceptor, ResponseInterceptor } from './interceptors';

import { HttpClient } from './client';

export class HttpAdapter {
  createClient(baseURL: string, options: { enableAuth?: boolean } = {}): HttpClient {
    return new HttpClient(baseURL, options);
  }

  createUnauthenticatedClient(baseURL: string): HttpClient {
    return HttpClient.createUnauthenticated(baseURL);
  }
}
