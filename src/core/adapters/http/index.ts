export { HttpClient } from './client';
export { RequestInterceptor, ResponseInterceptor } from './interceptors';

import { HttpClient } from './client';

export class HttpAdapter {
  createClient(baseURL: string): HttpClient {
    return new HttpClient(baseURL);
  }
}
