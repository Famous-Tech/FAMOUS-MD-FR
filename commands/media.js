const { commands, Meta } = require('../lib/');
const config = require('../config.js');
const sharp = require('sharp');
const { writeFileSync } = require('fs');

Meta({
  command: 'sticker',
  category: 'media',
  handler: async (sock, message, matched) => {
    const { from, message: msg } = message[0];
    const media = msg.imageMessage || msg.videoMessage || msg.stickerMessage;
    if (!media) {
      return await sock.sendMessage(from, { 
        text: 'Please reply to an image or video to create a sticker' }, { quoted: message[0] });
    }

    const buffer = await sock.downloadMediaMessage(media);
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
    await sock.sendMessage(from, { sticker: st_Data }, { quoted: message[0] });
  }
});

let polls = {};

Meta({
  command: 'vote',
  category: 'group',
  handler: async (sock, message, matched) => {
    const { key, from, isGroup, message: msg } = message[0];
    const input = matched.input.trim().split(' ').slice(1).join(' ');

    if (!isGroup) {
      return await sock.sendMessage(from, {
        text: 'This command can only be used in a group' }, { quoted: message[0] });
    }

    if (!input) {
      return await sock.sendMessage(from, { 
        text: 'Usage: !vote <topic> to create a poll, !vote <option> to vote' }, { quoted: message[0] });
    }

    if (!polls[from]) {
      polls[from] = {
        topic: input,
        options: {},
        voters: []
      };
      await sock.sendMessage(from, { text: `Poll created: ${input}\n\nTo vote, use: !vote <option>` }, { quoted: message[0] });
    } else {
      const poll = polls[from];
      if (poll.voters.includes(key.participant)) {
        return await sock.sendMessage(from, { text: 'You have already voted in this poll' }, { quoted: message[0] });
      }

      poll.options[input] = (poll.options[input] || 0) + 1;
      poll.voters.push(key.participant);
      let result = `*Poll:* ${poll.topic}\n\n`;
      for (let option in poll.options) {
        result += `*${option}:* ${poll.options[option]} votes\n`;
      }
      await sock.sendMessage(from, { text: result }, { quoted: message[0] });
    }
  }
});
        
      
