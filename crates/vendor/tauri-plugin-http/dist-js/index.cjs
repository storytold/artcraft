'use strict';

var core = require('@tauri-apps/api/core');

// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
/**
 * Make HTTP requests with the Rust backend.
 *
 * ## Security
 *
 * This API has a scope configuration that forces you to restrict the URLs that can be accessed using glob patterns.
 *
 * For instance, this scope configuration only allows making HTTP requests to all subdomains for `tauri.app` except for `https://private.tauri.app`:
 * ```json
 * {
 *   "permissions": [
 *     {
 *       "identifier": "http:default",
 *       "allow": [{ "url": "https://*.tauri.app" }],
 *       "deny": [{ "url": "https://private.tauri.app" }]
 *     }
 *   ]
 * }
 * ```
 * Trying to execute any API with a URL not configured on the scope results in a promise rejection due to denied access.
 *
 * @module
 */
const ERROR_REQUEST_CANCELLED = 'Request cancelled';
/**
 * Fetch a resource from the network. It returns a `Promise` that resolves to the
 * `Response` to that `Request`, whether it is successful or not.
 *
 * @example
 * ```typescript
 * const response = await fetch("http://my.json.host/data.json");
 * console.log(response.status);  // e.g. 200
 * console.log(response.statusText); // e.g. "OK"
 * const jsonData = await response.json();
 * ```
 *
 * @since 2.0.0
 */
async function fetch(input, init) {
    // abort early here if needed
    const signal = init?.signal;
    if (signal?.aborted) {
        throw new Error(ERROR_REQUEST_CANCELLED);
    }
    const maxRedirections = init?.maxRedirections;
    const connectTimeout = init?.connectTimeout;
    const proxy = init?.proxy;
    const danger = init?.danger;
    // Remove these fields before creating the request
    if (init) {
        delete init.maxRedirections;
        delete init.connectTimeout;
        delete init.proxy;
        delete init.danger;
    }
    const headers = init?.headers
        ? init.headers instanceof Headers
            ? init.headers
            : new Headers(init.headers)
        : new Headers();
    const req = new Request(input, init);
    const buffer = await req.arrayBuffer();
    const data = buffer.byteLength !== 0 ? Array.from(new Uint8Array(buffer)) : null;
    // append new headers created by the browser `Request` implementation,
    // if not already declared by the caller of this function
    for (const [key, value] of req.headers) {
        if (!headers.get(key)) {
            headers.set(key, value);
        }
    }
    const headersArray = headers instanceof Headers
        ? Array.from(headers.entries())
        : Array.isArray(headers)
            ? headers
            : Object.entries(headers);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mappedHeaders = headersArray.map(([name, val]) => [
        name,
        // we need to ensure we have all header values as strings
        // eslint-disable-next-line
        typeof val === 'string' ? val : val.toString()
    ]);
    // abort early here if needed
    if (signal?.aborted) {
        throw new Error(ERROR_REQUEST_CANCELLED);
    }
    const rid = await core.invoke('plugin:http|fetch', {
        clientConfig: {
            method: req.method,
            url: req.url,
            headers: mappedHeaders,
            data,
            maxRedirections,
            connectTimeout,
            proxy,
            danger
        }
    });
    const abort = () => core.invoke('plugin:http|fetch_cancel', { rid });
    // abort early here if needed
    if (signal?.aborted) {
        // we don't care about the result of this proimse
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        abort();
        throw new Error(ERROR_REQUEST_CANCELLED);
    }
    signal?.addEventListener('abort', () => void abort());
    const { status, statusText, url, headers: responseHeaders, rid: responseRid } = await core.invoke('plugin:http|fetch_send', {
        rid
    });
    // no body for 101, 103, 204, 205 and 304
    // see https://fetch.spec.whatwg.org/#null-body-status
    const body = [101, 103, 204, 205, 304].includes(status)
        ? null
        : new ReadableStream({
            start: (controller) => {
                const streamChannel = new core.Channel();
                streamChannel.onmessage = (res) => {
                    // close early if aborted
                    if (signal?.aborted) {
                        controller.error(ERROR_REQUEST_CANCELLED);
                        return;
                    }
                    const resUint8 = new Uint8Array(res);
                    const lastByte = resUint8[resUint8.byteLength - 1];
                    const actualRes = resUint8.slice(0, resUint8.byteLength - 1);
                    // close when the signal to close (last byte is 1) is sent from the IPC.
                    if (lastByte == 1) {
                        controller.close();
                        return;
                    }
                    controller.enqueue(actualRes);
                };
                // run a non-blocking body stream fetch
                core.invoke('plugin:http|fetch_read_body', {
                    rid: responseRid,
                    streamChannel
                }).catch((e) => {
                    controller.error(e);
                });
            }
        });
    const res = new Response(body, {
        status,
        statusText
    });
    // Set `Response` properties that are ignored by the
    // constructor, like url and some headers
    //
    // Since url and headers are read only properties
    // this is the only way to set them.
    Object.defineProperty(res, 'url', { value: url });
    Object.defineProperty(res, 'headers', {
        value: new Headers(responseHeaders)
    });
    return res;
}

exports.fetch = fetch;
