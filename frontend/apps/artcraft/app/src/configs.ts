
// This file fixes some of the old Netlify/Environment variable cruft that was introduced.
// Rather than having 11+ env vars that live in Netlify's stupid UI, we should switch on 

import { BuildEnvironmentType } from "./BuildEnvironment";

// one environment var and use centralized and versioned configs. 
export enum Environment {
    Dev,
    DevProxy,
    Staging,
    Production,
}

// TODO: Rename `EnvConfig` and allow a final override pass from env vars on a per-variable basis.
export class Configs {
    // API backend (protocol + hostname)
    readonly baseApi: string = "https://api.storyteller.ai";

    // CDN (protocol + hostname)
    readonly cdnApi: string = "https://cdn.storyteller.ai";

    // Where we're deployed
    readonly deployContext: string;

    // ??? legacy setting ???
    readonly expressions: boolean = true;

    // I assume this is the preview server. 
    // TODO: Rename when confirmed.
    readonly funnelApi: string = "https://style.storyteller.ai";

    // Why the hell was this even introduced as a variable?
    readonly googleApi: string = "https://storage.googleapis.com";

    // Why the hell was this even introduced as a variable?
    readonly gravatarApi: string = "https://www.gravatar.com";

    // Why the hell was this even introduced as a variable?
    readonly mediaVideoApi: string = "https://storage.googleapis.com/vocodes-public";

    // ??? Something seems to be locked behind this flag in production
    readonly premiumLock: boolean = true;

    readonly uploadApiVideo : string = "https://upload.storyteller.ai";

    // Why does this have almost the same name? Gross!
    readonly uploadVideoApi : string = "https://api.storyteller.ai/v1/media_files/upload/new_video";

    constructor(environment: BuildEnvironmentType) {
        switch (environment) {
            case BuildEnvironmentType.Dev:
                this.deployContext = "DEVELOPMENT";
                this.uploadApiVideo = "http://localhost:12345";
                this.baseApi = "http://localhost:12345";
                break;
            case BuildEnvironmentType.DevProxy:
                this.deployContext = "DEVELOPMENT";
                break;
            case BuildEnvironmentType.Staging:
                this.deployContext = "STAGING";
                break;
            case BuildEnvironmentType.Production:
                this.deployContext = "PRODUCTION";
                this.premiumLock = false;
                break;
        }

        //console.debug(`Build environment type: ${environment}`);
        //console.debug(`Deploy context: ${this.deployContext}`);
        //console.debug(`Upload API: ${this.uploadApiVideo}`);
    }
}