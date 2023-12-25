import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

interface VsCodeApi {
    postMessage(msg: unknown): void;
    setState(state: unknown): void;
    getState(): unknown;
}

declare function acquireVsCodeApi(): VsCodeApi;

export type VsCodeMessage = {
    data: {
        type: string;
        requestId: number;
        data: unknown;
    }
};

@Injectable({
    providedIn: 'root'
})
export class VsCodeService {
    _vsCode: VsCodeApi | undefined;

    _requestId = 0;
    _callbacks = new Map<number, (data: unknown) => void>();

    message$ = new Subject<VsCodeMessage>();
    messageObservable$ = this.message$.asObservable();

    constructor() {
        if (typeof acquireVsCodeApi !== 'undefined') {
            this._vsCode = acquireVsCodeApi();

            window.addEventListener('message', (event: Event) => {
                const { type } = (event as MessageEvent).data;
                switch (type) {
                    default: {
                        this.message$.next(event as unknown as VsCodeMessage);
                        break;
                    }
                }
            });
        }
    }

    postMessage(opts: { type: string, requestId: number, data: unknown }): void {
        if (!this._vsCode) {
            throw new Error('vscode not found');
        }
        this._vsCode.postMessage(opts);
    }
}