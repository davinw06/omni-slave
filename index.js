const { REST, Routes, Client, IntentsBitField, Collection, Events, SlashCommandBuilder, ClientApplication, MessageFlags, AttachmentBuilder, PermissionsBitField, GatewayIntentBits, Message, userMention, MessageEmbed, ActivityType, Partials, Guild, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, AuditLogEvent, ChannelType } = require('discord.js');
require('dotenv').config();
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

const express = require('express');
const app = express();
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const fetch = require('node-fetch');


const mongoURI = process.env.MONGO_URI;

app.listen(process.env.PORT || 3000, () => {
    console.log(`Web server is listening on port ${process.env.PORT || 3000}`);
});

app.get('/', (req, res) => {
    res.send("The Discord bot is alive!");
});

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
    family: 4
})
.then(() => console.log('MongoDB Connected via Mongoose...'))
.catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open to ' + mongoURI);
});

mongoose.connection.on('error', (err) => {
    console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});

process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

const ReactionRole = mongoose.models.ReactionRole || mongoose.model('ReactionRole', new mongoose.Schema({
    guildId: { type: String, required: true },
    messageId: { type: String, required: true },
    emoji: { type: String, required: true },
    roleId: { type: String, required: true },
}));
const StickyMessage = require('./Schemas.js/stickyMessageSchema');
const MessageModel = require('./Schemas.js/messageSchema');
const afkSchema = require('./Schemas.js/afkSchema');
const userSchema = require('./Schemas.js/userSchema');

const WELCOME_CHANNEL_ID = '1379585527992291348';
const GENERAL_CHANNEL_ID = '1379562445248659538';
const INTRODUCTION_CHANNEL_ID = '1379680357082988554';
const REACTION_ROLES_CHANNEL_ID = '1379585673446817852';
const CHAT_CLIPS_CHANNEL_ID = '1381885335675469955';
const FAREWELL_CHANNEL_ID = '1380682881994723428';
const LOGGING_CHANNEL_ID = '1381905624522031114';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Reaction,
    ],
});

client.commands = new Collection();
client.activeBumpIntervals = new Map();

const commandsForRegistration = [];

function getFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let commandFiles = [];

    for (const file of files) {
        if (file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(path.join(dir, file.name))
            ];
        } else if (file.name.endsWith('.js')) {
            commandFiles.push(path.join(dir, file.name));
        }
    }
    return commandFiles;
}

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = getFiles(commandsPath);

for (const filePath of commandFiles) {
    // Clear the require cache to ensure the latest file version is loaded
    if (require.cache[filePath]) {
        delete require.cache[filePath];
    }
    
    try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsForRegistration.push(command.data.toJSON());
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to load command from file ${filePath}:`, error);
    }
}

client.on('ready', async c => {
    client.user.setPresence({
        activities: [{
            name: 'WHY DID YOU MAKE ME DO THIS!?',
            type: ActivityType.Custom
        }],
        status: 'online'
    });

    const rest = new REST().setToken(token);

    try {
        console.log(`Started refreshing ${commandsForRegistration.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsForRegistration },
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }

    console.log('Attempting to re-establish existing reaction roles...');
    try {
        const existingReactionRoles = await ReactionRole.find({});
        console.log(`Found ${existingReactionRoles.length} existing reaction role configurations.`);

        for (const rrConfig of existingReactionRoles) {
            try {
                const channel = await client.channels.fetch(rrConfig.channelId);
                if (!channel || !channel.isTextBased()) {
                    console.warn(`[Startup] Channel ${rrConfig.channelId} for reaction role ${rrConfig.messageId} not found or not text-based. Skipping.`);
                    continue;
                }

                const message = await channel.messages.fetch(rrConfig.messageId);
                console.log(`[Startup] Fetched reaction role message ${message.id} in #${channel.name}.`);

                const hasEmoji = message.reactions.cache.has(rrConfig.emoji);
                if (!hasEmoji) {
                    try {
                        await message.react(rrConfig.emoji);
                        console.log(`[Startup] Re-added emoji ${rrConfig.emoji} to message ${message.id}.`);
                    } catch (reactError) {
                        console.warn(`[Startup] Failed to re-add emoji ${rrConfig.emoji} to message ${message.id}:`, reactError.message);
                    }
                }

            } catch (error) {
                console.error(`[Startup] Error re-establishing reaction role for message ID ${rrConfig.messageId} in channel ${rrConfig.channelId}:`, error);
                if (error.code === 10003 || error.code === 50001 || error.code === 10008) {
                    console.warn(`[Startup] Removing invalid reaction role config from DB: ${rrConfig._id}`);
                    await ReactionRole.deleteOne({ _id: rrConfig._id });
                }
            }
        }
        console.log('Finished re-establishing existing reaction roles.');
    } catch (dbError) {
        console.error('Error fetching existing reaction roles from database:', dbError);
    }
    console.log('Omni Slave is now online');
});

// New event listener to log messages
client.on(Events.MessageCreate, async message => {
    // Ignore messages from bots or direct messages
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;

    try {
        // Find the user and increment their messageCount.
        // `upsert: true` will create a new user document if one doesn't exist.
        await userSchema.findOneAndUpdate(
            { userId: userId },
            { $inc: { messageCount: 1 } },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating message count:', error);
    }
    const stickyData = await StickyMessage.findOne({ guildId: message.guild.id, channelId: message.channel.id });
    
    // Only proceed if there is a sticky message configured for this channel.
    if (stickyData) {
        // Fetch the last 6 messages in the channel to check if the sticky message is still visible.
        const messages = await message.channel.messages.fetch({ limit: 1 });
        
        // Use a more robust check to see if the sticky message is in the fetched messages.
        // The sticky message is "far enough away" if it's not among the most recent 6 messages.
        const isStickyFarEnough = !messages.has(stickyData.messageId);

        if (isStickyFarEnough) {
            try {
                // Delete the old sticky message if it exists.
                // Using a try/catch block here is good practice as the message might have been deleted manually.
                const oldStickyMsg = await message.channel.messages.fetch(stickyData.messageId).catch(err => {
                    // Log the error but don't stop the process, as the message may just not exist.
                    console.error('Error fetching old sticky message for deletion, it may have been deleted already:', err);
                    return null;
                });
                
                if (oldStickyMsg) {
                    await oldStickyMsg.delete();
                }
            } catch (err) {
                console.error('Error deleting old sticky message:', err);
            }
            
            // Send the new sticky message.
            const newStickyMsg = await message.channel.send({ content: stickyData.content });
            
            // Update the sticky message ID in the database.
            stickyData.messageId = newStickyMsg.id;
            await stickyData.save();
        }
    }

    const checkAfk = await afkSchema.findOne({ Guild: message.guild.id, User: message.author.id });
    if (checkAfk) {
        await afkSchema.deleteMany({ Guild: message.guild.id, User: message.author.id });
        await message.reply({ content: `Welcome back <@${message.author.id}>! You are no longer AFK.` });
    } else {
        const members = message.mentions.users.first();
        if (members) {
            const afkData = await afkSchema.findOne({ Guild: message.guild.id, User: members.id });
            if (afkData) {
                const reason = afkData.Message || "I'm busy right now.";
                await message.reply({ content: `${members.tag} is AFK. Reason: **${reason}**` });
            }
        }
    }
});

// New event listeners to handle reaction roles
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message is partial, fetch it
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }
    }

    // Ignore reactions from bots
    if (user.bot) return;

    // Check if the reaction is on a message we're tracking for reaction roles
    const reactionRole = await ReactionRole.findOne({
        guildId: reaction.message.guildId,
        messageId: reaction.message.id,
        emoji: reaction.emoji.name
    });

    if (reactionRole) {
        try {
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(reactionRole.roleId);
            if (role && member) {
                await member.roles.add(role, 'Reaction role assigned.');
                console.log(`Assigned role ${role.name} to ${member.user.tag} via reaction.`);
            }
        } catch (error) {
            console.error(`Failed to add role for ${user.tag}:`, error);
        }
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message is partial, fetch it
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }
    }

    // Ignore reactions from bots
    if (user.bot) return;

    // Check if the reaction is on a message we're tracking for reaction roles
    const reactionRole = await ReactionRole.findOne({
        guildId: reaction.message.guildId,
        messageId: reaction.message.id,
        emoji: reaction.emoji.name
    });

    if (reactionRole) {
        try {
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(reactionRole.roleId);
            if (role && member) {
                await member.roles.remove(role, 'Reaction role removed.');
                console.log(`Removed role ${role.name} from ${member.user.tag} via reaction.`);
            }
        } catch (error) {
            console.error(`Failed to remove role for ${user.tag}:`, error);
        }
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        let command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        try {
            if (interaction.replied || interaction.deferred) return;
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'setStickyModal') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const { guildId, channelId } = interaction;
            const newContent = interaction.fields.getTextInputValue('stickyContentInput');
            const botPermissions = interaction.channel.permissionsFor(interaction.client.user);
            if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) || !botPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.editReply({ content: 'I need "Send Messages" and "Manage Messages" permissions in this channel to set a sticky message.', flags: MessageFlags.Ephemeral });
            }
            try {
                let stickyData = await StickyMessage.findOne({ guildId, channelId });
                if (stickyData && stickyData.messageId) {
                    try {
                        const oldMessage = await interaction.channel.messages.fetch(stickyData.messageId);
                        if (oldMessage) await oldMessage.delete();
                    } catch (err) {
                        console.error('Could not find existing sticky message to delete. It may have already been deleted.', err);
                    }
                }
                const newStickyMsg = await interaction.channel.send({ content: newContent });
                if (stickyData) {
                    stickyData.content = newContent;
                    stickyData.messageId = newStickyMsg.id;
                    await stickyData.save();
                } else {
                    const newStickyData = new StickyMessage({
                        guildId,
                        channelId,
                        content: newContent,
                        messageId: newStickyMsg.id,
                        lastUpdated: new Date()
                    });
                    await newStickyData.save();
                }
                await interaction.editReply({ content: 'Sticky message has been set!', ephemeral: true });
            } catch (error) {
                console.error('Error setting sticky message:', error);
                await interaction.editReply({ content: 'There was an error setting the sticky message.', ephemeral: true });
            }
        }
    }
});


client.on('guildMemberAdd', async member => {
    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    const loggingChannel = member.guild.channels.cache.get(LOGGING_CHANNEL_ID);
    if (!welcomeChannel) return;
    let welcomeEmbed = new EmbedBuilder()
        .setImage('https://i.imgur.com/KQxfKhA.png');
    await welcomeChannel.send({embeds: [welcomeEmbed]});
    await welcomeChannel.send({content: `Welcome <@${member.id}> to **${member.guild.name}**, we hope you enjoy your stay! Go to <#${GENERAL_CHANNEL_ID}> to chat with others or <#${INTRODUCTION_CHANNEL_ID}> to introduce yourself to everyone. Read up on <#${CHAT_CLIPS_CHANNEL_ID}> to learn more about our server. Check out <#${REACTION_ROLES_CHANNEL_ID}> to change your colors or change your roles.`});
    if (!loggingChannel) return;
    const welcomeLoggingEmbed = new EmbedBuilder()
        .setTitle(`New Member Joined`)
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 1024 }))
        .setColor('#59ffa9')
        .addFields(
            { name: 'User', value: member.user.tag, inline: false },
            { name: 'DisplayName', value: member.displayName, inline: false },
        )
        .setTimestamp();
    loggingChannel.send({ embeds: [welcomeLoggingEmbed] });
});

client.on('guildMemberRemove', async member => {
    const farewellChannel = member.guild.channels.cache.get(FAREWELL_CHANNEL_ID);
    const loggingChannel = member.guild.channels.cache.get(LOGGING_CHANNEL_ID);
    if (!farewellChannel) return;
    try {
        const auditLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberKick,
        });
        const kickedLog = auditLogs.entries.first();
        if (kickedLog && kickedLog.target.id === member.id) {
            const { executor, reason } = kickedLog;

            farewellChannel.send(`**${member.displayName}** was kicked from the server! Goodbye and good riddance!🍻`);
            if (!loggingChannel) return;
            const kickEmbed = new EmbedBuilder()
                .setTitle('Member Kicked')
                .addFields(
                    { name: 'Kicked by', value: executor ? executor.tag : 'Unknown', inline: false },
                    { name: 'Reason', value: reason || 'No reason provided.', inline: false },
                )
                .setColor('#ff0000')
                .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 1024 }))
                .setTimestamp();
            loggingChannel.send({ embeds: [kickEmbed] });
        } else {
            farewellChannel.send(`Goodbye **${member.displayName}**! We hope you had a good time in our server!👋`);
            if (!loggingChannel) return;
            const leaveLoggingEmbed = new EmbedBuilder()
                .setTitle(`Member Left`)
                .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 1024 }))
                .setColor('#ff0000')
                .addFields(
                    { name: 'User', value: member.user.tag, inline: false },
                    { name: 'DisplayName', value: member.displayName, inline: false },
                )
                .setTimestamp();
            loggingChannel.send({ embeds: [leaveLoggingEmbed] });
        }
    } catch (error) {
        if (!loggingChannel) return;
        farewellChannel.send(`Goodbye **${member.displayName}**! We hope you had a good time in our server!👋`);
        const leaveLoggingEmbed = new EmbedBuilder()
            .setTitle(`Member Left`)
            .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 1024 }))
            .setColor('#ff0000')
            .addFields(
                { name: 'User', value: member.user.tag, inline: false },
                { name: 'DisplayName', value: member.displayName, inline: false },
            )
            .setTimestamp();
        loggingChannel.send({ embeds: [leaveLoggingEmbed] });
    }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
        const logChannel = newMember.guild.channels.cache.get(LOGGING_CHANNEL_ID);
        if (!logChannel) return;

        if (newMember.communicationDisabledUntilTimestamp) {
            const embed = new EmbedBuilder()
                .setTitle('Member Timed Out')
                .setDescription(`${newMember.user.tag} has been timed out.`)
                .addFields(
                    { name: 'User', value: newMember.displayName+`(${newMember.tag})`  },
                    { name: 'Until', value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>`}
                )
                .setThumbnail(newMember.user.displayAvatarURL({ size: 1024 }))
                .setColor('Orange')
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('Timeout Removed')
                .setDescription(`Timeout removed for ${newMember.user.tag}.`)
                .setThumbnail(newMember.user.displayAvatarURL({ size: 1024 }))
                .setColor('Green')
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const voiceChannel = newState.channel;
    if (!voiceChannel) return; // user left channel

    const member = newState.member;
    const VC_ID = voiceChannel.id;

    // Map of VC_ID -> Activity ID
    const activityMap = {
        '1403509385589948518': '832012774040141894', // Chess
        '1404027141456269372': '832025144389533716', // Blazing 8
        '1403547834262749194': '1315883196151238657', // Pool
        '1404027984180023477': '755827207812677713', // Poker
        '1404029888574394418': '879863686565621790', // Scrabble
        '1403503076522070197': '1300612940486934591', // Blackjack
        '1405568425685680259': '902271654783242291', // Sketchheads
    };

    // Map of channel names -> Activity ID (for non-ID specific ones)
    const nameActivityMap = {
        'Putt Party⛳': '945737671223947305',
        'SUDOKU': '1273616940451102832',
    };

    let ACTIVITY_ID = activityMap[VC_ID] || nameActivityMap[voiceChannel.name];
    if (!ACTIVITY_ID) return; // not a tracked activity channel

    const activityUrl = `discord://activities/${ACTIVITY_ID}?channel_id=${VC_ID}`;

    // Find matching text channel in the category
    const voiceTextChannel = voiceChannel.guild.channels.cache.get(voiceChannel.id);

    if (!voiceTextChannel) return; // no matching text channel

    // Only send if first member in the channel
    if (newState.channel.members.size <= 1) {
        voiceTextChannel.send(`Welcome <@${member.id}>! Join <${activityUrl}>`);
    }
});



client.login(token);

