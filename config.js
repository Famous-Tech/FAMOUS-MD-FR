const config = {
  API_BASE_URL: "https://api.astrid.com",
  mongodb: process.env.MONGODB_URL || '',
  prefix: process.env.PREFIX || '.',
  session: process.env.SESSION || 'Diegoson',
  
};

module.exports = config;

