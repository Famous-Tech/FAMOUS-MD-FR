const fs = require('fs');

const getContact = async (jid, sock) => {
    try {
        const contactInfo = await sock.fetchContactInfo(jid);
        return {
            id: jid,
            name: contactInfo.notify,
            pushname: contactInfo.name,
            phoneNumber: contactInfo.phoneNumber,
        };
    } catch (error) {
        console.error(error);
        return null;
    }
};

const saveContacts = async (contacts, sock) => {
    let existing = [];
   if (fs.existsSync('./contacts.json')) {
        existing = JSON.parse(fs.readFileSync('./contacts.json', 'utf8'));
    }

    const Maps = new Map(existing.map(contact => [contact.id, contact]));
    const updated = [];

    for (const contact of contacts) {
        const contactInfo = await getContact(contact.id, sock);
        if (contactInfo) {
            if (Maps.has(contact.id)) {
                const existing = Maps.get(contact.id);
                const updatedi = {
                    ...existing,
                    name: contact.notify,
                    pushname: contactInfo.pushname,
                    phoneNumber: contactInfo.phoneNumber,
                };
                updated.push(updatedi);
            } else {
                updated.push(contactInfo);
            }
        }
    } fs.writeFileSync('./contacts.json', JSON.stringify(updated, null, 2));
};

module.exports = { getContact, saveContacts };
