const axios = require('axios');
const { Meta } = require('../lib/');

Meta({
    command: 'quote',
    category: 'fun',
    handler: async (sock, message) => {
        const { from } = message;
        const res_str = await axios.get('https://api.quotable.io/random');
        const quote = res_str.data;
        await sock.sendMessage(from, { text: `"${quote.content}" - *${quote.author}*` });
    }
});
