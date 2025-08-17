const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const Relationship = require('./Schemas.js/relationshipSchema');

// ---- CONFIG ----
require('dotenv').config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const MONGO_URI = process.env.MONGO_URI; // change to your DB connection string

// ---- MAIN ----
async function cleanup() {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

    client.once('ready', async () => {
        console.log(`✅ Logged in as ${client.user.tag}`);
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch(); // fetch all members so cache is full

        const allRels = await Relationship.find({});
        let fixed = 0, deleted = 0;

        for (const rel of allRels) {
            const initiatorId = rel.initiatorId;
            const targetId = rel.targetId;

            const initiator = initiatorId ? guild.members.cache.get(initiatorId) : null;
            const target = targetId ? guild.members.cache.get(targetId) : null;

            // If either side is missing or null
            if (!initiator || !target) {
                if (rel.type === "marriage") {
                    rel.status = "divorced";
                    await rel.save();
                    fixed++;
                } else if (rel.type === "adoption") {
                    rel.status = "terminated";
                    await rel.save();
                    fixed++;
                } else if (["proposal", "adoption-request"].includes(rel.type)) {
                    await rel.deleteOne();
                    deleted++;
                } else {
                    // fallback: just delete broken junk
                    await rel.deleteOne();
                    deleted++;
                }
            }
        }

        console.log(`🧹 Cleanup finished. Updated ${fixed} relationships, deleted ${deleted} broken entries.`);
        await mongoose.disconnect();
        client.destroy();
    });

    client.login(DISCORD_TOKEN);
}

cleanup().catch(err => console.error("❌ Error during cleanup:", err));