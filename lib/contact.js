const fs = require('fs');

const saveContacts = async (contacts, sock) => {
    const contactList = [];

    for (const contact of contacts) {
        const contactInfo = await sock.fetchContactInfo(contact.id);
        contactList.push({
            id: contact.id,
            name: contact.notify,
            pushname: contactInfo.name,
            phoneNumber: contactInfo.phoneNumber,
        });
    }

    fs.writeFileSync('./contacts.json', JSON.stringify(contactList, null, 2));
    console.log(contactList.length);
};

module.exports = { saveContacts };
