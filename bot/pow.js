// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
 
// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on('message', message => {
    if (message.content === 'pow') {
        message.reply('pow ready');
    }
});


// Log in to Discord with your client's token
client.login('MTE4NjY4NTQ0MDE1ODMzOTE4Mg.GYIQ6h.M3r-NLzTjBqqUBGOs1wGWplfl4wnUbSlyGYmaA');