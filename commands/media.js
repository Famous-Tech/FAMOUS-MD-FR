const { commands, Meta } = require('../lib/');
const config = require('../config.js');
const sharp = require('sharp');
const { writeFileSync } = require('fs');
const { MessageType, Mimetype } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { SpeechClient } = require('@google-cloud/speech');
const speechClient = new SpeechClient();

Meta({
    command: 'resize',
    category: 'media',
    handler: async (sock, args, message) => {
      const { from } = message;
        const [width, height] = args;
        if (!width || !height || isNaN(width) || isNaN(height)) {
            return sock.sendMessage(from, { text: 'Please specify valid width and height Usage: /resize 300 300' }, MessageType.text);
        }     if (!message.message || !message.message.imageMessage) {
            return sock.sendMessage(from, { text: 'Please send an image to resize' }, MessageType.text);
        }      const image_imgz = await sock.downloadMediaMessage(message);
        try {
            const to_harzad = await sharp(image_imgz)
                .resize(parseInt(width), parseInt(height))
                .toBuffer();
            await sock.sendMessage(from, { image: to_harzad, caption: '*Made with love*' }, MessageType.image);
        } catch (err) {
            console.error(err);
            }
    }
});
            
Meta({
  command: 'sticker',
  category: 'media',
  handler: async (sock, message, args) => {
    const { from, message: msg } = message;
    const media = msg.imageMessage || msg.videoMessage || msg.stickerMessage;
    if (!media) {
      return await sock.sendMessage(from, { 
        text: 'Please reply to an image or video to create a sticker' }, { quoted: message });
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
          title: '🤓 X-Astral',
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
  category: 'group',
  handler: async (sock, message, isGroup, args) => {
    const { key, from, message: msg } = message;
    const input = args;
    if (!isGroup) {
      return await sock.sendMessage(from, {
        text: 'This command can only be used in a group' }, { quoted: message });
    }if (!input) {
      return await sock.sendMessage(from, { 
        text: 'Usage: !vote <topic> to create a poll, !vote <option> to vote' }, { quoted: message });
    } if (!polls[from]) {
      polls[from] = {
        topic: input,
        options: {},
        voters: []
      };
      await sock.sendMessage(from, { text: `Poll created: ${input}\n\nTo vote, use: !vote <option>` }, { quoted: message });
    } else {
      const poll = polls[from];
      if (poll.voters.includes(key.participant)) {
        return await sock.sendMessage(from, { text: 'You have already voted in this poll' }, { quoted: message });
      }
      poll.options[input] = (poll.options[input] || 0) + 1;
      poll.voters.push(key.participant);
      let result = `*Poll:* ${poll.topic}\n\n`;
      for (let option in poll.options) {
        result += `*${option}:* ${poll.options[option]} votes\n`;
      }
      await sock.sendMessage(from, { text: result }, { quoted: message });
    }
  }
});
  
Meta({
    command: 'animsticker',
    category: 'media',
    handler: async (sock, args, message) => {
      const { from } = message;
        if (!message.message || (!message.message.videoMessage && !message.message.imageMessage)) {
            return sock.sendMessage(from, { text: 'Please send a video or GIF' }, MessageType.text);
        }
        const isVideo = message.message.videoMessage !== undefined;
        const media_msg = isVideo ? message.message.videoMessage : message.message.imageMessage;
        const mime = media_msg.mimetype;
      if (!/video|gif/.test(mime)) {
            return sock.sendMessage(from, { text: 'Not valid' }, MessageType.text);
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
    category: 'media',
    handler: async (sock, args, message) => {
      const { from } = message;
        if (!message.message || !message.message.audioMessage) {
            return sock.sendMessage(from, { text: 'Please send an audio message' }, MessageType.text);
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
                languageCode: 'en-US',
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
                                    
      
