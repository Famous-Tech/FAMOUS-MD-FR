const fsSync = require("fs");
const { promises: fs } = require("fs");
const path = require("path");
const proto = require("baileys");
const { BufferJSON, initAuthCreds } = require("baileys");
const AsyncLock = require("async-lock");
const fileLock = new AsyncLock({ maxPending: Infinity });

function createFileStorage(folder = "./Auth-info") {
    const authInfoDir = path.resolve(folder);
    const fileCache = new Map();

    if (!fsSync.existsSync(authInfoDir)) {
        fsSync.mkdirSync(authInfoDir);
    }

    async function loadFile(fileName) {
        try {
            if (fileCache.has(fileName)) {
                return fileCache.get(fileName);
            }

            const filePath = path.join(authInfoDir, fileName);
            const fileContent = await fileLock.acquire(filePath, () =>
                fs.readFile(filePath, { encoding: "utf-8" })
            );
            const content = JSON.parse(fileContent, BufferJSON.reviver);
            fileCache.set(fileName, content);
            return content;
        } catch (error) {
            return null;
        }
    }

    async function saveFile(fileName, content) {
        try {
            const serializedContent = JSON.stringify(
                content,
                BufferJSON.replacer,
                2
            );
            const filePath = path.join(authInfoDir, fileName);

            return await fileLock.acquire(filePath, () =>
                fs.writeFile(filePath, serializedContent)
            );
        } catch (error) {
            console.error(`Failed to save file ${fileName}:`, error);
        }
    }

    async function deleteFile(fileName) {
        try {
            const filePath = path.join(authInfoDir, fileName);

            return await fileLock.acquire(filePath, () => fs.unlink(filePath));
        } catch (error) {
            
        }
    }

    return {
        loadFile,
        saveFile,
        deleteFile,
    };
}

function createAuthentication(sessionId, folder) {
    const fileStorage = createFileStorage(folder);
    const KEY_MAP = {
        "pre-key": "preKeys",
        session: "sessions",
        "sender-key": "senderKeys",
        "app-state-sync-key": "appStateSyncKeys",
        "app-state-sync-version": "appStateVersions",
        "sender-key-memory": "senderKeyMemory",
    };

    const debounce = (func, wait) => {
        if (!this._debounceTimeouts) {
            this._debounceTimeouts = new Map();
        }

        return (...args) => {
            if (this._debounceTimeouts.has(func)) {
                clearTimeout(this._debounceTimeouts.get(func));
            }

            const timeout = setTimeout(() => {
                func.apply(this, args);
                this._debounceTimeouts.delete(func);
            }, wait);
            this._debounceTimeouts.set(func, timeout);
        };
    };

    async function MultiAuth() {
        if (!sessionId) throw new Error(`Provide a valid session folder`);
        const fileName = `${sessionId}.json`;

        let storedCreds = await fileStorage.loadFile(fileName);
        let creds = storedCreds?.creds || initAuthCreds();
        let keys = storedCreds?.keys || {};

        const saveCreds = async () => {
            await fileStorage.saveFile(fileName, { creds, keys });
        };

        const debouncedSaveState = debounce(saveCreds, 1000);

        const clearState = async () => {
            await fileStorage.deleteFile(fileName);
        };

        return {
            state: {
                creds,
                keys: {
                    get: (type, ids) => {
                        const key = KEY_MAP[type];
                        return ids.reduce((dict, id) => {
                            const value = keys[key]?.[id];
                            if (value) {
                                if (type === "app-state-sync-key") {
                                    dict[id] =
                                        proto.AppStateSyncKeyData.fromObject(
                                            value
                                        );
                                } else {
                                    dict[id] = value;
                                }
                            }
                            return dict;
                        }, {});
                    },
                    set: async (data) => {
                        let shouldSave = false;
                        for (const _key in data) {
                            const key = KEY_MAP[_key];
                            keys[key] = keys[key] || {};
                            Object.assign(keys[key], data[_key]);
                            shouldSave = true;
                        }
                        if (shouldSave) {
                            debouncedSaveState();
                        }
                    },
                },
            },
            saveCreds,
            clearState,
        };
    }

    return {
        MultiAuth,
    };
}

module.exports = {
    createFileStorage,
    createAuthentication,
};
      
