type NonNullableObject<T extends object> = NonNullable<T>;
export interface ApiResponse<T, P = undefined> {
    success: boolean;
    errorMessage?: string;
    data?: T;
    pagination?: P;
}
export declare class ApiManager {
    ApiTargets: Record<string, string>;
    constructor();
    protected getApiSchemeAndHost(): string;
    fetch<B, T>(endpoint: string, { method, query, body, }: {
        method: string;
        query?: Record<string, string | boolean | number | undefined>;
        body?: B;
    }): Promise<T>;
    fetchMultipartFormData<T>(endpoint: string, { method, body, }: {
        method: string;
        body: FormData;
    }): Promise<T>;
    protected get<T>({ endpoint, query, }: {
        endpoint: string;
        query?: Record<string, string | boolean | number | undefined>;
    }): Promise<T>;
    protected post<B, T>({ endpoint, query, body, }: {
        endpoint: string;
        query?: Record<string, string | boolean | number | undefined>;
        body?: B;
    }): Promise<T>;
    protected delete<B, T>({ endpoint, query, body, }: {
        endpoint: string;
        query?: Record<string, string | boolean | number | undefined>;
        body?: B;
    }): Promise<T>;
    protected postFormVideo<T>({ endpoint, formRecord, uuid, blob, blobFileName, }: {
        endpoint: string;
        formRecord: Record<string, string>;
        uuid: string;
        blob?: Blob | File;
        blobFileName?: string;
    }): Promise<T>;
    protected postForm<T>({ endpoint, formRecord, uuid, blob, blobFileName, }: {
        endpoint: string;
        formRecord: Record<string, string>;
        uuid: string;
        blob?: Blob | File;
        blobFileName?: string;
    }): Promise<T>;
    protected camelToSnakeCase(str: string): string;
    protected parseQueryValues(params: Record<string, string | string[] | boolean | number | undefined>): Record<string, string>;
    protected parseBodyValues<T extends object, B extends object>(params: NonNullableObject<T>): B;
}
export {};
//# sourceMappingURL=ApiManager.d.ts.map