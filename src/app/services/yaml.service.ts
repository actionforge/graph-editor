import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { load } from 'js-yaml';

@Injectable({
  providedIn: 'root'
})
export class YamlService {
  http = inject(HttpClient)

  async httpGet<T = NonNullable<unknown>>(url: string, opts?: {
    withCredentials?: boolean
  }): Promise<T> {
    const res: string | undefined = await this.http.get(url, {
      responseType: 'text',
      withCredentials: Boolean(opts?.withCredentials),
    }).toPromise();
    const yamlObject = load(res!);
    return yamlObject as T;
  }

  async httpPost<T = NonNullable<unknown>>(url: string, data: unknown, opts: {
    withCredentials: boolean
  }): Promise<T> {
    const res: string | undefined = await this.http.post(url, data, {
      responseType: 'text',
      withCredentials: opts.withCredentials,
    }).toPromise();
    const yamlObject = load(res!);
    return yamlObject as T;
  }
}