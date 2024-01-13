import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { VsCodeService } from "src/app/services/vscode.service";
import { YamlService } from "src/app/services/yaml.service";
import { environment } from "src/environments/environment";
import { INodeTypeDefinitionBasic, INodeTypeDefinitionFull } from "../helper/rete/interfaces/nodes";
import { RegistryUriInfo, parseRegistryUri, uriToString } from "../helper/utils";
import { GraphService } from "./graph.service";

@Injectable({
    providedIn: 'root'
})
export class Registry {
    yamlService = inject(YamlService);
    vscode = inject(VsCodeService);
    gs = inject(GraphService);

    private basicDefs = new BehaviorSubject<Map<string, INodeTypeDefinitionBasic> | 'loading'>('loading');
    private basicNodeTypeObservable$ = this.basicDefs.asObservable();

    private fullDefs = new Map<string, INodeTypeDefinitionFull>();

    async loadBasicNodeTypeDefinitions(registryUris: Set<string>): Promise<void> {
        try {
            registryUris = new Set(registryUris);

            const nodeUris = [
                "github.com/actions/cache",
                "github.com/actions/checkout",
                "github.com/actions/create-release",
                "github.com/actions/setup-dotnet",
                "github.com/actions/setup-go",
                "github.com/actions/setup-java",
                "github.com/actions/setup-node",
                "github.com/actions/setup-python",
                "github.com/actions/upload-artifact",
            ];

            for (const nodeUri of nodeUris) {
                registryUris.add(nodeUri);
            }

            const nodeDefs = await this.yamlService.httpPost<INodeTypeDefinitionBasic[]>(`${environment.gatewayUrl}/api/v1/registry/nodedefs/basic`, {
                registry_uris: [...registryUris]
            }, {
                withCredentials: false
            })

            const defs = new Map<string, INodeTypeDefinitionBasic>();
            for (const [nodeUri, nodeDef] of Object.entries(nodeDefs)) {
                defs.set(nodeUri, nodeDef);
            }
            this.basicDefs.next(defs);
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new Error(error.error)
            } else {
                throw error;
            }
        }
    }

    async loadFullNodeTypeDefinitions(registryUris: Set<string>): Promise<void> {
        try {
            const nodeDefs = await this.yamlService.httpPost<INodeTypeDefinitionFull[]>(`${environment.gatewayUrl}/api/v1/registry/nodedefs/full`, {
                registry_uris: [...registryUris],
            }, {
                withCredentials: false
            })

            const defs = new Map<string, INodeTypeDefinitionFull>();
            for (const [nodeUri, nodeDef] of this.fullDefs) {
                defs.set(nodeUri, nodeDef);
            }
            for (const [nodeUri, nodeDef] of Object.entries(nodeDefs)) {
                defs.set(nodeUri, nodeDef);
            }
            this.fullDefs = defs;
        } catch (error: unknown) {
            if (error instanceof HttpErrorResponse) {
                throw new Error(error.error);
            } else {
                throw error;
            }
        }
    }

    async loadRegistry(uri: string): Promise<void> {
        const ruri: RegistryUriInfo = parseRegistryUri(uri);
        uri = uriToString(ruri);

        const registries = this.gs.getRegistriesCopy();
        registries.add(uri);
        await this.loadBasicNodeTypeDefinitions(registries);

        this.gs.addRegistry(uri);
    }

    getBasicNodeTypeDefinitions(): Observable<Map<string, INodeTypeDefinitionBasic> | 'loading'> {
        return this.basicNodeTypeObservable$;
    }

    findBasicNodeTypeDefinitionsSync(matchFn: (nodeId: string) => boolean): INodeTypeDefinitionBasic | null {
        if (this.basicDefs.value === 'loading') {
            throw new Error('Basic node type definitions are still loading');
        }

        for (const [k, v] of this.basicDefs.value) {
            if (matchFn(k)) {
                return v;
            }
        }

        return null;
    }

    getFullNodeTypeDefinitions(): Map<string, INodeTypeDefinitionFull> {
        return this.fullDefs;
    }
}