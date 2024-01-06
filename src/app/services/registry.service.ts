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

    private partDefs = new BehaviorSubject<Map<string, INodeTypeDefinitionBasic> | 'loading'>('loading');
    private basicNodeTypeObservable$ = this.partDefs.asObservable();

    private fullDefs = new Map<string, INodeTypeDefinitionFull>();

    async loadBasicNodeTypeDefinitions(registryUrl: Set<string>): Promise<void> {
        try {
            // add some default registry urls
            const registryUriCopy = new Set<string>(registryUrl);
            registryUriCopy.add("github.com/actions/checkout");
            registryUriCopy.add("github.com/actions/cache");
            registryUriCopy.add("github.com/actions/publish-action");
            registryUriCopy.add("github.com/actions/upload-artifact");
            registryUriCopy.add("github.com/actions/create-release");
            registryUriCopy.add("github.com/actions/upload-release-asset");
            registryUriCopy.add("github.com/actions/setup-dotnet");
            registryUriCopy.add("github.com/actions/setup-node");
            registryUriCopy.add("github.com/actions/setup-java");
            registryUriCopy.add("github.com/actions/setup-go");
            registryUriCopy.add("github.com/actions/setup-python");

            const nodeDefs = await this.yamlService.httpPost<INodeTypeDefinitionBasic[]>(`${environment.registryUrl}/api/v1/registry/nodedefs/basic`, {
                registry_uris: [...registryUriCopy]
            }, {
                withCredentials: false
            })

            const defs = new Map<string, INodeTypeDefinitionBasic>();
            for (const nodeDef of Object.values(nodeDefs)) {
                defs.set(nodeDef.id, nodeDef);
            }
            this.partDefs.next(defs);
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new Error(error.error)
            } else {
                throw error;
            }
        }
    }
    async loadRegistry(uri: string): Promise<void> {
        const registries = this.gs.getRegistriesCopy();
        const uriInfo: RegistryUriInfo = parseRegistryUri(uri);
        if (!uriInfo.ref) {
            const latestVersion = await this.getLatestNodeTypeVersion(uriToString(uriInfo));
            uriInfo.ref = latestVersion;
        }
        registries.add(uriToString(uriInfo));

        await this.loadBasicNodeTypeDefinitions(registries);
        this.gs.addRegistry(uriInfo);
    }

    async loadFullNodeTypeDefinitions(registryUrl: Set<string>): Promise<void> {
        try {
            const nodeDefs = await this.yamlService.httpPost<INodeTypeDefinitionFull[]>(`${environment.registryUrl}/api/v1/registry/nodedefs/full`, {
                registry_uris: [...registryUrl]
            }, {
                withCredentials: false
            })

            const defs = new Map<string, INodeTypeDefinitionFull>();
            for (const nodeDef of Object.values(nodeDefs)) {
                defs.set(nodeDef.id, nodeDef);
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

    async getLatestNodeTypeVersion(registryUrl: string): Promise<string> {
        try {
            interface IVersion {
                version: string
            }
            const res = await this.yamlService.httpPost<IVersion>(`${environment.registryUrl}/api/v1/registry/nodedefs/latest`, {
                registry_uri: registryUrl
            }, {
                withCredentials: false
            })

            return res.version;
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new Error(error.error)
            } else {
                throw error;
            }
        }
    }

    getBasicNodeTypeDefinitions(): Observable<Map<string, INodeTypeDefinitionBasic> | 'loading'> {
        return this.basicNodeTypeObservable$;
    }

    findBasicNodeTypeDefinitionsSync(matchFn: (nodeId: string) => boolean): INodeTypeDefinitionBasic | null {
        if (this.partDefs.value === 'loading') {
            throw new Error('Basic node type definitions are still loading');
        }

        for (const [k, v] of this.partDefs.value) {
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