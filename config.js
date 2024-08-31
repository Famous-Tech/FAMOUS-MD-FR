require('dotenv').config(); 

module.exports = {
    API_BASE_URL: 'https://api.astrid.com',
    VERSION: require('./package.json').version,
    OWNER: process.env.OWNER ||'Its You😂',
    DEEPAI_KEY: '7f831cb9-aa30-4270-bfa6-0a5d4d03afac',
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://z:z@cluster0.sy21r5d.mongodb.net/?retryWrites=true&w=majority',
    PREFIX: process.env.PREFIX || '!',
    PER_ANTI: process.env.PER_ANTI || 'true', // false
    SESSION_ID: process.env.SESSION_ID || 'session_key',
    BRAINSHOP_PRIVATE: process.env.BRAINSHOP_PRIVATE || 'false', //true
    MODE: process.env.MODE || 'private', // public
    MODS: process.env.MODS ? JSON.parse(process.env.MODS) : ['27686881509@s.whatsapp.net']
};
