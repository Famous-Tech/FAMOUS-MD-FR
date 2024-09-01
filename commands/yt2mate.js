const { commands, Meta } = require('../lib');
const config = require('../config');
const ytdl = require('ytdl-core');

function YT2MATE_AUDIO(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([^"&?\/\s]{11})|(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? (match[1] || match[2]) : null;
}

Meta({
  command: 'yt2mate',
  category: 'downloads',
  filename: __filename,
  handler: async (sock, message, args, languages) => {
    const { from } = message;
    if (!args.length) {
      await sock.sendMessage(from, { text: languages[config.LANGUAGE].URL_MSG' });
      return;
    }  const url = args[0];
    const video_str = YT2MATE_AUDIO(url);
    if (!video_str) {
      await sock.sendMessage(from, { text: languages[config.LANGUAGE].VALID_MSG});
      return;
    } try {
      const info = await ytdl.getInfo(video_str);
      const title = info.videoDetails.title;
      const formats = ytdl.filterFormats(info.formats, 'audioonly');
      const format = formats[0]; 
        await sock.sendMessage(from, { audio: { url: format.url }, mimetype: 'audio/mpeg' }, { quoted: message });
          } catch (error) {
      console.error(error);
          }
  },
});
    
