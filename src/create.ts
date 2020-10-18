import url from 'url';
import mime from 'mime';

import FileClient from './fileClient';

export interface CreateOptions {
    name: string;
    contents: any[] | Blob | string;
    contentType: string;
    headers?: Headers | Record<string, string>;
}

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

export const createFolder = function(
    this: FileClient,
    folderAddress: string,
    options?: Partial<CreateOptions>,
): Promise<Response> {
    const request = {
        headers: {
            Slug: options?.name ?? 'Untitled Folder',
            Link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Content-Type': 'text/turtle',
        },
    };

    return this.fetcher.webOperation('POST', folderAddress, request);
};

export const createFile = function(
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

    return this.fetcher.webOperation('PUT', fileAddress, request);
};

export const createIfNotExist = function(
    this: FileClient,
    resourceAddress: string,
    options: Partial<CreateOptions> = { headers: {} },
): Promise<Response | undefined> {
    return this.fetcher
        ._fetch(resourceAddress, { headers: options.headers })
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
