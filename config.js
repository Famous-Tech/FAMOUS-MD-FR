const global = {
  API_BASE_URL: "https://api.astrid.com",
  mongodb: process.env.MONGODB_URL || '',
  prefix: process.env.PREFIX || '.',
  
};

module.exports = global;

