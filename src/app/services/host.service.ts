import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

interface IVsCodeApi {
    postMessage(msg: unknown): void;
}

declare global {
    interface Window {
        vscode?: IVsCodeApi;
    }
}

declare function acquireVsCodeApi(): IVsCodeApi;

export type HostAppMessage = {
    data: {
        type: string;
        requestId: number;
        data: unknown;
    }
};

@Injectable({
    providedIn: 'root'
})
export class HostService {
    _vscode: IVsCodeApi | undefined;

    _requestId = 0;
    _callbacks = new Map<number, (data: unknown) => void>();

    message$ = new Subject<HostAppMessage>();
    messageObservable$ = this.message$.asObservable();

    constructor() {
        if (typeof acquireVsCodeApi !== 'undefined') {
            this._vscode = acquireVsCodeApi();
        }

        if (this._vscode || window.top) {
            window.addEventListener('message', (event) => {
                this.message$.next(event as unknown as HostAppMessage);
            });
        }
    }

    postMessage(opts: { type: string, data: unknown }): void {
        if (this._vscode) {
            this._vscode.postMessage(opts);
        } else if (window.top) {
            window.top?.postMessage(opts, '*');
        } else {
            throw new Error('no host environment found');
        }
    }
}