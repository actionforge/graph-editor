import { load } from "js-yaml";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorMessage(e: any): string {

    if (e.error) {
        e = e.error;
    }

    if (e.message) {
        return e.message;
    }

    if (typeof e === "string") {
        return e;
    }

    return "Unknown error";
}


const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte']
const BYTES_PER_KB = 1000

export function humanFileSize(sizeBytes: number | bigint): string {
    let size = Math.abs(Number(sizeBytes))

    let u = 0
    while (size >= BYTES_PER_KB && u < UNITS.length - 1) {
        size /= BYTES_PER_KB
        ++u
    }

    return new Intl.NumberFormat([], {
        style: 'unit',
        unit: UNITS[u],
        unitDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(size)
}

export interface RegistryUriInfo {
    registry: string;
    owner: string;
    regname: string;
    ref: string;
}

export function uriToString(uri: RegistryUriInfo): string {
    let r = '';
    if (uri.registry) {
        r += `${uri.registry}/`;
    }

    r = `${r}${uri.owner}/${uri.regname}`;

    if (uri.ref) {
        r = `${r}@${uri.ref}`;
    }

    return r;
}

export function parseRegistryUri(uri: string): RegistryUriInfo {

    if (uri.startsWith("http://") ||
        uri.startsWith("https://") ||
        uri.startsWith("www.") ||
        uri.startsWith("github.com")
    ) {
        const matches = uri.match(/^((http:\/\/|https:\/\/)?)((www.)?github.com)(\/marketplace)?\/(.+?)\/(.+?)(@([a-zA-Z][a-zA-Z0-9._/-]*)?)$/);
        if (!matches) {
            throw new Error("invalid node type id");
        }

        return {
            registry: matches[3].toLowerCase(),
            owner: matches[6].toLowerCase(),
            regname: matches[7].toLowerCase(),
            ref: matches[9],
        };
    }

    let allowFallback = true;

    // If the uri is a yaml string, check if it is from the github marketplace
    try {
        interface GitHubActionStep {
            name: string;
            uses: string;
        }

        let ghStep = load(uri) as GitHubActionStep | GitHubActionStep[];

        // from here on, we know that the node type uri is a valid yaml
        // and we can disable the fallback below
        allowFallback = false;
        if (Array.isArray(ghStep)) {
            if (ghStep.length > 1) {
                throw new Error("invalid node type id");
            }
            ghStep = ghStep[0];
        }
        uri = `github.com/${ghStep.uses.trim()}`
    } catch (error) {
        if (!allowFallback) {
            throw error;
        }
    }

    // As a fallback, if YAML failed, try to parse the node type uri
    // if it fits the format of[registry:]name/foo[@ref]
    const matches = uri.match(/^(([-.\w]+)\/)?([-\w]+)\/([-\w]+)((@([-.\w]+))?)$/);
    if (!matches) {
        throw new Error("invalid node type id");
    }

    return {
        // yaml definitions come from github
        registry: matches[2].toLowerCase(),
        owner: matches[3].toLowerCase(),
        regname: matches[4].toLowerCase(),
        ref: matches[7].toLowerCase(),
    };
}