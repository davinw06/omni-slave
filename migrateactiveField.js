const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const UserModel = require('./Schemas.js/userSchema');

require('dotenv').config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const MONGO_URI = process.env.MONGO_URI;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch(); // fetch all members

        const users = await UserModel.find({});
        console.log(`Found ${users.length} users in DB`);

        for (const user of users) {
            const isInGuild = guild.members.cache.has(user.userId);
            user.active = isInGuild; // true if still in server, false if not
            await user.save();
            console.log(`Updated ${user.userId}: active = ${isInGuild}`);
        }

        console.log('🎉 Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        client.destroy();
        process.exit(0);
    }
});

client.login(DISCORD_TOKEN);
