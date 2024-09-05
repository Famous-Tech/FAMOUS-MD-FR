const { commands, Meta } = require('../lib');
const config = require('../config');
const ytdl = require('ytdl-core');
const { searchAndDownload, getYoutubeThumbnail } = require('../lib/youtubei.js');
const fs = require('fs');
const path = require('path');


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
                           
Meta({
  command: 'search',
  category: 'downloads',
  filename: __filename,
  handler: async (sock, message, args, reacts) => {
    const { from } = message;
    const query = args.join(' ');
    if (!query) {
      return await sock.sendMessage(from, { text: 'Please: !search [song or video title]' });
    }   const results = await searchAndDownload(query, null, 'search');
    if (!results || results.length === 0) return await sock.sendMessage(from, { text: '*_Not found_*' });
    const match_args = results[0];
    const match_video = match_args.id; 
    const reg_url = `https://www.youtube.com/watch?v=${match_video}`; 
    const str_image = await getYoutubeThumbnail(match_video); 
    const res = `*🎥 Title:* *${match_args.title}*\n*👁 Views:* ${match_args.views.toLocaleString()} views\n*👍 Likes:* ${match_args.likes.toLocaleString()} likes\n*⏳ Duration:* _${match_args.duration}_\n\nChoose a format:\n1️⃣ *Video*\n2️⃣ *Audio*\n\n*Reply with the number (1 or 2)*`;
    await sock.sendMessage(from, {
      image: { url: str_image },
      caption: res
    });
    sock.ev.on('messages.upsert', async (Msg) => {
      const ID_NUM = Msg.messages[0].message.conversation;
      if (ID_NUM === '1') {
        const video_num = path.join(__dirname, `${match_args.title}.mp4`);
        await sock.sendMessage(from, { text: `*Downloading video: ${match_args.title}*` });
        await searchAndDownload(reg_url, video_num, 'video');
        await sock.sendMessage(from, {
          video: { url: video_num },
          caption: `*${match_args.title}*\n*Views:* ${match_args.views.toLocaleString()}`
        });
      } else if (ID_NUM === '2') {
        const audio_path = path.join(__dirname, `${match_args.title}.mp3`);
        await sock.sendMessage(from, { text: `Downloading audio...` });
        await searchAndDownload(reg_url, audio_num, 'audio');
        await sock.sendMessage(from, {
          text: `*X-ASTRAL*`,
          contextInfo: {
            externalAdReply: {
              title: match_args.title,
              body: '_Complete_',
              thumbnailUrl: str_image,
              mediaUrl: reg_url, 
              sourceUrl: reg_url,
            }
          }
        });
      } else {
        await sock.sendMessage(from, { text: '_Invalid_*ID*' });
      }
    });
  }
});
