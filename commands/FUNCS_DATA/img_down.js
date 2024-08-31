const gis = require('async-g-i-s');
/**
 * @x-astral_by_Diegoson(naxor_ser)
 * @param {string} query
 * @returns {Promise<string[]>} - An array of images
 */
async function IMAGE_DOWN(query) {
  try {
    const results = await gis(query);
    return results.map(result => result.url);
  } catch (error) {
    console.error(error);
    throw new Error('err3');
  }
}

module.exports = {IMAGE_DOWN};
