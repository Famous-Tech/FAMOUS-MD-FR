require('dotenv').config(); 

module.exports = {
    API_BASE_URL: "https://api.astrid.com",
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://z:z@cluster0.sy21r5d.mongodb.net/?retryWrites=true&w=majority',
    PREFIX: process.env.PREFIX || '!',
    SESSION: process.env.SESSION || 'session_key',
    MODS: process.env.MODS ? JSON.parse(process.env.MODS) : ['27686881509@s.whatsapp.net']
};
