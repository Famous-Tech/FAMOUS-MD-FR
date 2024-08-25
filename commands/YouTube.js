const { commands, Meta } = require('../lib/');
const { YT_SEARCH } = require('../lib/YOUTUBE.js');

Meta({
  command: 'yts',
  category: 'youtube',
  handler: async (sock, message, args) => {
    const { from } = message;
      if (!args) {
      return await sock.sendMessage(from, { text: 'Usage: !youtube [search query]' }, { quoted: message });
    }
    try {
      const results = await YT_SEARCH(args);
      if (results.length === 0) {
        return await sock.sendMessage(from, { text: 'No results found' }, { quoted: message });
      } const res = results.map((video, index) => 
        `${index + 1}. ${video.title}\n${video.url}\n${video.description}\n*Duration*: ${video.duration}\n`
      ).join('\n');
      await sock.sendMessage(from, { text: `**YouTube Search:**\n\n${res}` }, { quoted: message });
    } catch (error) {
        }
  }
});
        
