const { commands, Meta } = require('../lib/');
const { YT_SEARCH } = require('../lib/YOUTUBE.js');
const { searchAndDownload, getYoutubeThumbnail, bytesToSize, generateId } = require('../lib/youtubei.js');
const fs = require('fs');
const path = require('path');

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

Meta({
  command: 'song',
  category: 'youtube',
  handler: async (sock, message, args) => {
    const { from } = message;
    const query_url = args.join(' ').trim();
    if(query_url) {
    return await sock.sendMessage(from, { text: 'Provide YouTube url/song mame' });
        }
    const outP_kg = path.join(__dirname, 'temp_audio.mp3');
    try {
      if (query_url.startsWith('http')) {
        await downloadYouTubeAudio(query_url, outP_kg);
      } else {
        await searchAndDownload(query_url, outP_kg 'audio');
        }
      if (fs.existsSync(outP_kg)) {
        const stats = fs.statSync(outP_kg);
        const fileSize = bytesToSize(stats.size);
        const audioId = generateId(query_url);
        const thumbnail_id = await getYoutubeThumbnail(audioId);
        await sock.sendMessage(from, {
          audio: { url: outP_kg },
          mimetype: 'audio/mp4',
          caption: `*_Name_*: ${path.basename(outP_kg)}\n*_Size*_: ${fileSize}\n*_Bytes_*: ${stats.size}\n*_ID_*: ${audioId}`,
          externalAdReply: {
            title: 'Mp3_Down',
            body: 'Downloaded',
            thumbnail: { url: thumbnail_id }
          }
        });

        fs.unlinkSync(outP_kg);
      } else {
        } catch (error) {
      await sock.sendMessage(from, { text: `${error.message}` });
    }
  }
});
    
