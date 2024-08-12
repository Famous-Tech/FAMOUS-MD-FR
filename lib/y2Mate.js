const ytdl = require('ytdl-core');

async function y2Mate_Audio(url) {
  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
    if (!format) {
      throw new Error('No_audio found');
    }
    return {
      title: info.videoDetails.title,
      audioUrl: format.url,
    };
  } catch (error) {
    console.error(error);
    throw new Error('error');
  }
}
module.exports = { y2Mate_Audio };
              
