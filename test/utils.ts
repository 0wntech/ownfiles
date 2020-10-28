import FileClient from '../lib';
import { FolderType } from '../lib/read';

const rdf = require('rdflib');
const auth = require('solid-auth-cli');
const config = require('./podConfig.json');

export const cleanUp = (podClient: FileClient): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const credentials = await auth.getCredentials();
        await auth.login(credentials);
        podClient.fetcher = new rdf.Fetcher(podClient.graph, {
            fetch: auth.fetch,
        });
        const pod = (await podClient.read(config.podUrl, {
            headOnly: true,
        })) as FolderType;
        const cleanUps: Promise<unknown>[] = [];
        pod.folders.forEach((element: string) => {
            if (!config.folder.folders.includes(element)) {
                cleanUps.push(podClient.delete(element));
            }
        });
        pod.files.forEach((element) => {
            element = element as string;
            if (element && !config.folder.files.includes(element)) {
                cleanUps.push(podClient.delete(element));
            }
        });

        await Promise.all(cleanUps)
            .then(() => {
                resolve();
            })
            .catch((err) => {
                reject(err);
            });
    });
};
