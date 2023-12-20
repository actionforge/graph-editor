import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IGraph } from '../schemas/graph';
import { YamlService } from './yaml.service';
import { NotificationService } from './notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GatewayService {
    ns = inject(NotificationService)
    yamlService = inject(YamlService)

    async graphRead(source: { provider: string, owner: string, repo: string, ref: string, path: string }): Promise<IGraph> {
        if (!environment.web && !environment.dev) {
            throw new Error('not in dev or web mode');
        }

        try {
            const graph = await this.yamlService.httpPost<IGraph>(`${environment.gatewayUrl}/api/v1/graph/read`, {
                provider: source.provider,
                // keys dependend on provider, currently 'github'
                owner: source.owner,
                repo: source.repo,
                ref: source.ref,
                path: source.path,
            }, {
                withCredentials: true
            });
            if (!graph) {
                throw new Error(`graph ${source.owner} not found`);
            }
            return graph;
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new Error(error.error)
            } else {
                throw error;
            }
        }
    }
}