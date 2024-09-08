# WaveBot

> [!NOTE]
> wave bot made using whiskeysockets baileys

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Diegoson/X-Astral)

# *Installation*
To get started with X-ASTRAL, follow these simple steps:

```Clone the Repository```:

bash
Copy code
git clone https://github.com/Diegoson/X-Astral.git
cd x-astral
Install Dependencies:

bash
Copy code
npm install
Configure the Bot:

bash
Copy code
mv config.sample.js config.js
Start the Bot:

bash
Copy code
node Socket.js
# *Usage*
Once your bot is running, you can start using its commands in your group chat.

# *CODE_EXAMPLE*:

```sock.sendMessage(groupId, { text: 'Hello, group' });```

# *PING*
```Meta({
    command: 'ping',
    category: 'utility',
    handler: async (sock, args, message) => {
        const { from } = message;
        await sock.sendMessage(from, { text: 'Pong' });
    }
});
```

# *📄 License*
X-ASTRAL is open-source and licensed under the MIT License.
