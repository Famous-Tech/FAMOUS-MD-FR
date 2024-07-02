const fs = require('fs');

const getContact = async (jid, sock) => {
    try {
        const contactInfo = await sock.query({
            json: ["query", "contact", jid]
        });

        return {
            id: jid,
            name: contactInfo.notify,
            pushname: contactInfo.vname || contactInfo.notify,
            phoneNumber: contactInfo.jid.split('@')[0],
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

    const Contactz = new Map(Contactz.map(contact => [contact.id, contact]));
    const updated = [];

    for (const contact of contacts) {
        const contactInfo = await getContact(contact.id, sock);
        if (contactInfo) {
            if (Contactz.has(contact.id)) {
                const existingz = Contactz.get(contact.id);
                const updated = {
                    ...existingz,
                    name: contact.notify,
                    pushname: contactInfo.pushname,
                    phoneNumber: contactInfo.phoneNumber,
                };
                updated.push(updated);
            } else {
                updated.push(contactInfo);
            }
        }
    }

    fs.writeFileSync('./contacts.json', JSON.stringify(updated, null, 2));
};

module.exports = { getContact, saveContacts };
