import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class JsonService {
  http = inject(HttpClient)

  async httpGet<T = NonNullable<unknown>>(url: string, opts: {
    withCredentials: boolean
  }): Promise<T> {
    const res: unknown | undefined = await this.http.get(url, {
      responseType: 'json',
      withCredentials: opts.withCredentials,
    }).toPromise();
    return res as T;
  }

  async httpPost<T = NonNullable<unknown>>(url: string, data: unknown, opts: {
    withCredentials: boolean
  }): Promise<T> {
    const res: unknown | undefined = await this.http.post(url, data, {
      responseType: 'json',
      withCredentials: opts.withCredentials,
    }).toPromise();
    return res as T;
  }
}