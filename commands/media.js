const { commands, Meta } = require('../lib/');
const config = require('../config.js');
const sharp = require('sharp');
const { writeFileSync } = require('fs');
const { MessageType, Mimetype } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { SpeechClient } = require('@google-cloud/speech');
const speechClient = new SpeechClient();

Meta({
    command: 'removebg',
    category: 'média',
    filename: 'removebg',
    handler: async (sock, message, author, args, quoted, languages) => {
        const { from } = message;
        if (!quoted || quoted.mtype !== 'imageMessage') {
            return await sock.sendMessage(from, { text: languages[config.LANGUAGE].IMAGE_MSG }, MessageType.text);
        }      const media_data = await sock.downloadMediaMessage(quoted);
        if (!media_data) {
        } try {
            const formData = new FormData();
            formData.append('image', media_data, 'image.png');
            const { data } = await axios.post('https://api.deepai.org/api/remove-bg', formData, {
                headers: { 'Api-Key': config.DEEPAI_KEY, ...formData.getHeaders() }
            }); if (data.output_url) {
                 const res_str = await axios.get(data.output_url, { responseType: 'arraybuffer' });
                await sock.sendMessage(from, { image: res_str.data, caption: '*Fait avec amour*' }, MessageType.image);
            } else {}
        } catch (error) {
            console.error(error);
          }
    }
});

Meta({
    command: 'video2gif',
    category: 'média',
    handler: async (sock, args, message, languages) => {
        const { from } = message;
        if (!message.message || !message.message.videoMessage) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].VIDEO_MSG}, MessageType.text);
        } const video_togif = await sock.downloadMediaMessage(message);
        const video_xv = path.join(__dirname, 'input.mp4');
        const gif_naxor = path.join(__dirname, 'output.gif');
        fs.writeFileSync(video_xv, video_togif);
        ffmpeg(video_xv)
            .setStartTime('00:00:05')
            .setDuration(5) 
            .toFormat('gif')
            .save(gif_naxor)
            .on('end', async () => {
                const gif_naxors = fs.readFileSync(gif_naxor);
                await sock.sendMessage(from, { video: gif_naxors, caption: '*MADE WITH 🤍 BY FAMOUS-TECH*', gifPlayback: true }, MessageType.video);
         fs.unlinkSync(video_);
                fs.unlinkSync(gif_naxor);
            })
            .on('error', async (err) => {
                console.error(err);
                });
    }
});

Meta({
    command: 'resize',
    category: 'média',
    handler: async (sock, args, message, languages) => {
      const { from } = message;
        const [width, height] = args;
        if (!width || !height || isNaN(width) || isNaN(height)) {
            return sock.sendMessage(from, { text: 'Veuillez spécifier une largeur et une hauteur valides. Utilisation: /resize 300 300' }, MessageType.text);
        }     if (!message.message || !message.message.imageMessage) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].IMAGE_MSG }, MessageType.text);
        }      const image_imgz = await sock.downloadMediaMessage(message);
        try {
            const to_harzad = await sharp(image_imgz)
                .resize(parseInt(width), parseInt(height))
                .toBuffer();
            await sock.sendMessage(from, { image: to_harzad, caption: '*Fait avec amour*' }, MessageType.image);
        } catch (err) {
            console.error(err);
            }
    }
});
            
Meta({
  command: 'sticker',
  category: 'média',
  handler: async (sock, message, args, languages) => {
    const { from, message: msg } = message;
    const media = msg.imageMessage || msg.videoMessage || msg.stickerMessage;
    if (!media) {
      return await sock.sendMessage(from, { 
        text: languages[config.LANGUAGE].IMAGE_MSG}, { quoted: message });
    } const buffer = await sock.downloadMediaMessage(media);
    const packName = config.PACKNAME;
    const cropp = await sharp(buffer)
      .resize(512, 512, {
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      })
      .webp({ quality: 70 })
      .toBuffer();

    const st_Data = {
      mimetype: 'image/webp',
      data: cropp,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: 'FAMOUS-MD,
          body: packName,
          sourceUrl: '',
        }
      }
    };
    await sock.sendMessage(from, { sticker: st_Data }, { quoted: message });
  }
});

let polls = {};
Meta({
  command: 'vote',
  category: 'groupe',
  handler: async (sock, message, isGroup, args, languages) => {
    const { key, from, message: msg } = message;
    const input = args;
    if (!isGroup) {
      return await sock.sendMessage(from, {
        text: languages[config.LANGUAGE].GROUP_MSG }, { quoted: message });
    }if (!input) {
      return await sock.sendMessage(from, { 
        text: 'Utilisation: !vote <sujet> pour créer un sondage, !vote <option> pour voter' }, { quoted: message });
    } if (!polls[from]) {
      polls[from] = {
        topic: input,
        options: {},
        voters: []
      };
      await sock.sendMessage(from, { text: `Sondage créé: ${input}\n\nPour voter, utilisez: !vote <option>` }, { quoted: message });
    } else {
      const poll = polls[from];
      if (poll.voters.includes(key.participant)) {
        return await sock.sendMessage(from, { text: 'Vous avez déjà voté dans ce sondage' }, { quoted: message });
      }
      poll.options[input] = (poll.options[input] || 0) + 1;
      poll.voters.push(key.participant);
      let result = `*Sondage:* ${poll.topic}\n\n`;
      for (let option in poll.options) {
        result += `*${option}:* ${poll.options[option]} votes\n`;
      }
      await sock.sendMessage(from, { text: result }, { quoted: message });
    }
  }
});
  
Meta({
    command: 'animsticker',
    category: 'média',
    handler: async (sock, args, message, languages) => {
      const { from } = message;
        if (!message.message || (!message.message.videoMessage && !message.message.imageMessage)) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].VIDEO_MSG}, MessageType.text);
        }
        const isVideo = message.message.videoMessage !== undefined;
        const media_msg = isVideo ? message.message.videoMessage : message.message.imageMessage;
        const mime = media_msg.mimetype;
      if (!/video|gif/.test(mime)) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].VALID_MSG}, MessageType.text);
        }
        const media_fire = await sock.downloadMediaMessage(message);
        const tempFile = `./temp_media_${Date.now()}.${isVideo ? 'mp4' : 'gif'}`;
        const output = `./temp_sticker_${Date.now()}.webp`;
        fs.writeFileSync(tempFile, media_fire);

        try {
             await new Promise((resolve, reject) => {
                ffmpeg(tempFile)
                    .inputFormat(isVideo ? 'mp4' : 'gif')
                    .toFormat('webp')
                    .videoFilters('scale=512:512')
                    .outputOptions(['-vcodec', 'libwebp', '-lossless', '1', '-qscale', '0', '-preset', 'default', '-loop', '0', '-an', '-vsync', '0'])
                    .save(output)
                    .on('end', resolve)
                    .on('error', reject);
            });
             const sticker_str = fs.readFileSync(output);
            await sock.sendMessage(from, { sticker: sticker_str }, MessageType.sticker);
        } catch (err) {
            console.error(err);
         } finally {
        await unlinkAsync(tempFile);
            await unlinkAsync(output);
        }
    }
});

Meta({
    command: 'transcribe',
    category: 'média',
    handler: async (sock, args, message, languages) => {
      const { from } = message;
        if (!message.message || !message.message.audioMessage) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].AUDIOS_MSG }, MessageType.text);
        }
        const audio_str = await sock.downloadMediaMessage(message);
        const audio_cn = path.join(__dirname, 'audio.ogg');
        fs.writeFileSync(audio_cn, audio_str);
        const audio = fs.readFileSync(audio_cn);
        const request = {
            audio: {
                content: audio.toString('base64'),
            },
            config: {
                encoding: 'OGG_OPUS',
                sampleRateHertz: 16000,
                languageCode: 'fr-FR',
            },
        };
        try {
            const [response] = await speechClient.recognize(request);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
            await sock.sendMessage(from, { text: `*X*\n${transcription}` }, MessageType.text);
        } catch (err) {
            console.error(err);
            } fs.unlinkSync(audio_cn);
    }
});
