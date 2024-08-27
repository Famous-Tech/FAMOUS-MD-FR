const { commands, Meta } = require('../lib/');
const fetch = require('node-fetch');
const canvafy = require('canvafy');

Meta({
  command: 'ship',
  category: 'fun',
  filename: 'funn.js',
  handler: async (sock, args, message, author) => {
    
    const { from } = message;
    const mentioned = message.mentioned || [];
    if (mentioned.length === 0) {
      return sock.sendMessage(from, { text: "Please mention at least one user to ship" });
    }
    let profilePicUrl;
    try {
      profilePicUrl = await sock.profilePictureUrl(from);
    } catch (error) {
        }
    const percentage = Math.floor(Math.random() * 101);
    const ratings = [
      'Sweet',
       'Awful',
       'Very Bad',
        'Poor',
         'Average',
           'Good',
             'Great',
               'Amazing',
                  'XAstral',
                     'Virgin',
                       'looser'
      
    ];
    const str_rate = ratings[Math.floor(percentage / 15)];
    let image_str;
    try {
      const response = await fetch(profilePicUrl);
      image_str = await response.buffer();
    } catch (error) {
      console.error(error);
          }

    try {
      const image = await canvafy.createImage()
        .setAvatar(image_str)
        .setText(`${percentage}%`, {
          fontSize: 40,
          color: 'white',
          position: { x: 'center', y: 'center' },
          stroke: 'black',
          strokeWidth: 5
        })
        .build();
      const mention_str = mentioned.length > 1 
        ? mentioned.map(id => `@${id.split('@')[0]}`).join(' and ')
        : `@${mentioned[0].split('@')[0]}`;
      const caption = `*CAP_MATE TYRE*\n${percentage}%\n${mention_str}\n*Rating*: *${rating}*`;
      await sock.sendMessage(from, {
        image,
        caption,
        mentions: mentioned
      });
    } catch (e) {
      console.error(e);
          }
    }
});
  
