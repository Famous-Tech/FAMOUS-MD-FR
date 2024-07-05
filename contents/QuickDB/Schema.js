const Authentication = (sessionId, database, WASocket) => {
    let credentials = null;
    let keys = {};

    const getKeyMap = (type) => {
        const keyMap = {
            'pre-key': 'preKeys',
            session: 'sessions',
            'sender-key': 'senderKeys',
            'app-state-sync-key': 'appStateSyncKeys',
            'app-state-sync-version': 'appStateVersions',
            'sender-key-memory': 'senderKeyMemory'
        };
        return keyMap[type];
    };

    const DatabaseMulti = async () => {
        const sessionData = await database.getSession(sessionId);

        if (sessionData && sessionData.session) {
            const { credentials: storedCredentials, keys: storedKeys } = JSON.parse(sessionData.session, WASocket.BufferJSON.reviver);
            credentials = storedCredentials;
            keys = storedKeys;
        } else {
            credentials = initCredentials();
            keys = {};
        }

        const saveState = async () => {
            const session = JSON.stringify({ credentials, keys }, WASocket.BufferJSON.replacer, 2);
            await database.setSession(sessionId, { session });
        };

        const clearState = async () => {
            await database.deleteSession(sessionId);
            credentials = null;
            keys = {};
        };

        const getKeys = (type, ids) => {
            const key = getKeyMap(type);
            return keys[key] ? ids.reduce((result, id) => {
                if (keys[key][id]) result[id] = keys[key][id];
                return result;
            }, {}) : {};
        };

        const setKeys = (type, data) => {
            const key = getKeyMap(type);
            keys[key] = { ...(keys[key] || {}), ...data };
            saveState();
        };

        return {
            state: {
                credentials,
                keys: {
                    get: getKeys,
                    set: setKeys,
                },
            },
            saveState,
            clearState,
        };
    };

    const initCredentials = () => ({ username: '', token: '' });

    return {
        DatabaseMulti,
    };
};

module.exports = Authentication;
