import { getType } from 'mime';

import FileClient from './fileClient';

export const update = function(
    this: FileClient,
    resource: string,
    content: string,
    contentType = 'text/turtle',
) {
    if (getType(resource)) contentType = getType(resource) ?? contentType;
    return this.fetcher.webOperation('PUT', resource, {
        data: content,
        contentType: contentType,
    }) as Promise<Response>;
};
