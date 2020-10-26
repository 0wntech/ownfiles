import url from 'url';
import mime from 'mime';

import FileClient from './fileClient';
import { Quad_Subject } from 'rdflib/lib/tf-types';

export interface CreateOptions {
    name: string;
    contents: any[] | Blob | string;
    contentType: string;
    headers?: Headers | Record<string, string>;
}

export type ExtendedResponseType = Response & {
    responseText: string;
    req?: Quad_Subject;
    size: number;
    error: string;
};

export const create = function(
    this: FileClient,
    resourceAddress: string,
    options: Partial<CreateOptions> = {},
) {
    if (!resourceAddress) {
        throw new Error('Please specify the location for the new resource.');
    } else if (url.parse(resourceAddress).protocol !== 'https:') {
        throw new Error(
            'Please specify a valid location for the new resource.',
        );
    }

    const paths = resourceAddress.split('/');
    if (!options.name) {
        if (paths[paths.length - 1] !== '') {
            options.name = paths[paths.length - 1];
            paths.pop();
            return this.createFile(paths.join('/') + '/', options);
        } else {
            options.name = paths[paths.length - 2];
            paths.pop();
            paths.pop();
            return this.createFolder(paths.join('/') + '/', options);
        }
    } else if (resourceAddress.endsWith('/')) {
        paths.pop();
        paths.pop();
        return this.createFolder(paths.join('/') + '/', options);
    } else {
        paths.pop();
        return this.createFile(paths.join('/') + '/', options);
    }
};

export const createFolder = async function(
    this: FileClient,
    folderAddress: string,
    options?: Partial<CreateOptions>,
) {
    const request = {
        method: 'POST',
        headers: {
            Slug: options?.name ?? 'Untitled Folder',
            Link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Content-Type': 'text/turtle',
        },
    };

    const res = (await this.fetcher._fetch(
        folderAddress,
        request,
    )) as ExtendedResponseType;
    const location = res.headers.get('Location');

    if (location && res.status < 304) {
        const parsedUrl = url.parse(folderAddress);
        const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
        await this.addToIndex(
            { url: rootUrl + location, types: [] },
            { force: true },
        );
    }
    return res;
};

export const createFile = async function(
    this: FileClient,
    fileAddress: string,
    options: Partial<CreateOptions> = {},
): Promise<Response> {
    const stringContent = options.contents as string;
    const blobContent = options.contents as Blob;
    const anyContent = options.contents as any[];
    const body = stringContent ?? blobContent ?? bodyFromContent(anyContent);

    if (options.name) {
        options.contentType =
            options.contentType ?? mime.getType(options.name) ?? 'text/turtle';

        const fileExtension =
            (options.contentType === 'image/jpeg' ||
                options.contentType === 'application/octet-stream') &&
            options.name &&
            options.name.split('.')[1] === 'jpg'
                ? 'jpg'
                : mime.getExtension(options.contentType);

        fileAddress = `${fileAddress}${
            options.name.split('.')[0]
        }.${fileExtension}`;
    }

    const request = {
        contentType: options.contentType,
        data: body,
    };

    const res = await this.fetcher.webOperation('PUT', fileAddress, request);
    const location =
        res.headers.get('Location') || url.parse(fileAddress).pathname;
    if (location && res.status < 300) {
        const parsedUrl = url.parse(fileAddress);
        const rootUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
        await this.addToIndex({
            url: rootUrl + location ?? fileAddress,
            type: options.contentType ?? 'text/plain',
        });
    }
    return await res;
};

export const createIfNotExist = function(
    this: FileClient,
    resourceAddress: string,
    options: Partial<CreateOptions> = { headers: {} },
): Promise<Response | undefined> {
    return this.fetcher
        ._fetch(resourceAddress, { method: 'HEAD', headers: options.headers })
        .then((res: Response) => {
            if (res.status === 200) {
                return;
            } else {
                return this.create(resourceAddress, options);
            }
        });
};

function bodyFromContent(content: any[] | string | undefined) {
    if (content) {
        if (Array.isArray(content)) {
            if (
                content.every((el) => {
                    return el.constructor.name === 'Statement';
                })
            ) {
                let bodyString = '';
                content.forEach((st) => {
                    bodyString += st.toNT() + '\n';
                });
                return bodyString;
            }
        } else {
            return content;
        }
    } else {
        return '';
    }
}
