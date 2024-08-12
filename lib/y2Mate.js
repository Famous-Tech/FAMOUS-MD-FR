const yts = require('yt-search');

async function YT_SEARCH(query) {
  try {
    const result = await yts(query);
    const videos = result.videos.slice(0, 5).map(video => ({
      title: video.title,
      url: video.url,
      description: video.description,
      duration: video.timestamp,
      thumbnail: video.thumbnail
    }));
    return videos;
  } catch (error) {
    console.error(error);
    throw new Error('error');
  }
}

module.exports = { YT_SEARCH } ;
