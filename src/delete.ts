import { ExtendedResponseType } from './create';
import FileClient from './fileClient';

export const deleteResource = function(
    this: FileClient,
    resources: string | string[],
) {
    if (resources) {
        if (Array.isArray(resources)) {
            return Promise.all(
                resources.map((item) => {
                    return this.deleteRecursively(item);
                }),
            );
        } else {
            return this.deleteRecursively(resources);
        }
    } else {
        throw new Error(
            'Please specify the item/items you would like to delete.',
        );
    }
};

export const deleteRecursively = async function(
    this: FileClient,
    resource: string,
) {
    const fileHierarchy = (await this.deepRead(resource)) as string[];
    if (fileHierarchy.length > 1) {
        return (await this.fetcher.webOperation(
            'DELETE',
            fileHierarchy[0],
        )) as ExtendedResponseType;
    } else {
        const responses = await Promise.all(
            fileHierarchy.map((item) =>
                this.fetcher.webOperation('DELETE', item),
            ) as Promise<ExtendedResponseType>[],
        );
        return responses[responses.length - 1];
    }
};
