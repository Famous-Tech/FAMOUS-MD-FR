const { commands, Meta } = require('../lib/');
const { YT_SEARCH } = require('../lib/YOUTUBE.js');

Meta({
  command: 'yts',
  category: 'youtube',
  handler: async (sock, message, matched) => {
    const { from } = message[0];
    const query = matched.slice(8).trim();
    if (!query) {
      return await sock.sendMessage(from, { text: 'Usage: !youtube [search query]' }, { quoted: message[0] });
    }
    try {
      const results = await YT_SEARCH(query);
      if (results.length === 0) {
        return await sock.sendMessage(from, { text: 'No results found' }, { quoted: message[0] });
      } const res = results.map((video, index) => 
        `${index + 1}. ${video.title}\n${video.url}\n${video.description}\n*Duration*: ${video.duration}\n`
      ).join('\n');
      await sock.sendMessage(from, { text: `**YouTube Search Results:**\n\n${response}` }, { quoted: message[0] });
    } catch (error) {
        }
  }
});
        
