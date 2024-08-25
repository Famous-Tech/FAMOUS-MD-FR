const Youtube = require('youtubei.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');
const youtube = new Youtube();

async function searchAndDownload(query, outputPath, type = 'video') {
  try {
    const results = await youtube.search(query, { type: 'video' });
    if (!results || results.length === 0) throw new Error('No results found');
    const str_result = results[0];
    const video_url = str_result.url;
    if (type === 'video') {
      await downloadYouTubeVideo(video_url, outputPath);
    } else if (type === 'audio') {
      await downloadYouTubeAudio(video_url, outputPath);
    } else {
      throw new Error('Type_: usage "video" or "audio".');
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function downloadYouTubeVideo(url, outputPath) {
  try {
    const video = await youtube.getVideo(url);
    if (!video) throw new Error('Video not found');
    const videoFormat = video.formats
      .filter(f => f.mimeType.includes('video/mp4'))
      .sort((a, b) => b.qualityLabel.localeCompare(a.qualityLabel))[0];

    if (!videoFormat || !videoFormat.url) throw new Error('No video_format found');
    const response = await fetch(videoFormat.url);
    if (!response.ok) throw new Error('error_');
    const totalSize = parseInt(response.headers.get('content-length'), 10);
    if (!totalSize) throw new Error('content length_error');
    const fileStream = fs.createWriteStream(outputPath);
    let downloaded = 0;
    response.body.on('data', chunk => {
      downloaded += chunk.length;
      const percent = ((downloaded / totalSize) * 100).toFixed(2);
      process.stdout.write(`Downloading: ${percent}%\r`);
    });
    response.body.pipe(fileStream);
    fileStream.on('finish', () => {
      console.log('\nDownload completed');
    });
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (error) {
    console.error(error.message);
  }
}

async function downloadYouTubeAudio(url, outputPath) {
  try {
    const video = await youtube.getVideo(url);
    if (!video) throw new Error('_Video not found_');
    const audioFormat = video.formats
      .filter(f => f.mimeType.includes('audio/mp4') || f.mimeType.includes('audio/webm'))
      .sort((a, b) => b.bitrate - a.bitrate)[0];
    if (!audioFormat || !audioFormat.url) throw new Error('No_audio format found');
    const response = await fetch(audioFormat.url);
    if (!response.ok) throw new Error('error_');
    const totalSize = parseInt(response.headers.get('content-length'), 10);
    if (!totalSize) throw new Error('error');
    console.log(`${url}`);
    const fileStream = fs.createWriteStream(outputPath);
    let downloaded = 0;
    response.body.on('data', chunk => {
      downloaded += chunk.length;
      const percent = ((downloaded / totalSize) * 100).toFixed(2);
      process.stdout.write(`Downloading: ${percent}%\r`);
    });
    response.body.pipe(fileStream);
    fileStream.on('finish', () => {
      console.log('\nDownload completed');
    });

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (error) {
    console.error(error.message);
  }
}

async function mixAudioAndVideo(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac', '-strict experimental'])
      .on('end', () => {
        console.log('Audio and video combined successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error(err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

async function combineYouTubeVideoAndAudio(videoQuery, audioQuery, outputPath) {
  try {
    const videoResults = await youtube.search(videoQuery, { type: 'video' });
    const audioResults = await youtube.search(audioQuery, { type: 'video' });
    if (!videoResults || videoResults.length === 0) throw new Error('No_results');
    if (!audioResults || audioResults.length === 0) throw new Error('No_results');
    const vidz_bytes = videoResults[0].url;
    const audio_bytes = audioResults[0].url;
    const video_sized = path.join(__dirname, 'temp_video.mp4');
    const audio_sized = path.join(__dirname, 'temp_audio.mp3');
    await downloadYouTubeVideo(video_bytes, video_sized);
    await downloadYouTubeAudio(audio_bytes, audio_sized);
    await mixAudioAndVideo(video_sized, audio_sized, outputPath);

    fs.unlinkSync(video_sized);
    fs.unlinkSync(audio_sized);
      } catch (error) {
    console.error(error.message);
  }
}

async function getYoutubeThumbnail(videoId) {
  try {
    const video = await youtube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
    if (!video) throw new Error('Video not found');
    const args_thumbnail = video.thumbnail.url;
    const response = await fetch(args_thumbnail);
    const buffer = await response.buffer();
    const thumbnail_str = path.join(__dirname, `${videoId}_thumbnail.jpg`);
    fs.writeFileSync(thumbnail_str, buffer);
     return thumbnail_str;
  } catch (error) {
      }
}

function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function generateId(query, url, videiQuery) {
  return crypto.createHash('md5').update(query, url, videoQuery).digest('hex').slice(0, 8);
}

module.exports = {
  searchAndDownload,
  downloadYouTubeVideo,
  downloadYouTubeAudio,
  generateId,
  combineYouTubeVideoAndAudio,
  mixAudioAndVideo,
  getYoutubeThumbnail,
  bytesToSize
}
