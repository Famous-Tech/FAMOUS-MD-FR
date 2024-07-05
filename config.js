const config = {
  API_BASE_URL: "https://api.astrid.com",
  mongodb: process.env.MONGODB_URL || 'mongodb+srv://z:z@cluster0.sy21r5d.mongodb.net/?retryWrites=true&w=majority',
  prefix: process.env.PREFIX || '.',
  session: process.env.SESSION || 'Diegoson',
  
};

module.exports = config;

