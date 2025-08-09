const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const MessageModel = require('../../Schemas.js/messageSchema');
const mongoose = require('mongoose');

module.exports = {
    // Command data for Discord's API
    data: new SlashCommandBuilder()
        .setName('backfill')
        .setDescription('Fetches and logs past messages from a specified channel or all channels to the database.')
        // The channel option is now optional
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The specific channel to backfill messages from.')
                .setRequired(false) // This is now optional
                .addChannelTypes(ChannelType.GuildText)
        )
        // New option to backfill all channels
        .addBooleanOption(option =>
            option.setName('allchannels')
                .setDescription('Set to true to backfill messages from all text channels in the server.')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    // The main execution logic of the command
    async execute(interaction) {
        // Defer the initial reply to let the user know the bot is working on the request.
        await interaction.deferReply({ ephemeral: true });

        // Get the options from the user
        const specificChannel = interaction.options.getChannel('channel');
        const allChannels = interaction.options.getBoolean('allchannels');

        let channelsToBackfill = [];

        // Determine which channels to backfill based on the user's input
        if (allChannels) {
            // If the user selected a specific channel AND the allchannels option, send an error.
            if (specificChannel) {
                return interaction.editReply({
                    content: 'You cannot select both a specific channel and the "allchannels" option. Please choose one.',
                    ephemeral: true,
                });
            }
            // Get all text channels in the guild
            channelsToBackfill = interaction.guild.channels.cache.filter(
                channel => channel.type === ChannelType.GuildText
            );
        } else if (specificChannel) {
            // If a specific channel was selected, add it to the list to process
            channelsToBackfill.push(specificChannel);
        } else {
            // If neither option was selected, prompt the user for input.
            return interaction.editReply({
                content: 'Please specify a channel or use the "allchannels" option.',
                ephemeral: true,
            });
        }
        
        // Check for a ready database connection
        if (mongoose.connection.readyState !== 1) {
            return interaction.editReply({
                content: 'The database is not ready. Please try again later.',
                ephemeral: true,
            });
        }

        let totalMessagesAdded = 0;

        // Loop through the list of channels to backfill
        for (const channel of channelsToBackfill.values()) {
            const botPermissions = channel.permissionsFor(interaction.client.user);

            // Check if the bot has the required permissions for the current channel
            if (!botPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
                await interaction.followUp({
                    content: `Skipping channel **#${channel.name}**: I need the "Read Message History" permission to read messages.`,
                    ephemeral: true,
                });
                continue; // Move to the next channel
            }
            if (!botPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
                 await interaction.followUp({
                    content: `Skipping channel **#${channel.name}**: I need the "Manage Messages" permission to check for duplicate entries.`,
                    ephemeral: true
                });
                continue; // Move to the next channel
            }


            // Inform the user that the backfill for this channel has started
            await interaction.followUp({ content: `Starting backfill for **#${channel.name}**...`, ephemeral: true });

            let lastMessageId = null;
            let running = true;
            const maxMessages = 10000; // Limit to prevent hitting API rate limits or taking too long
            let channelMessagesAdded = 0;
            
            // Loop to fetch messages in batches of 100
            while (running && channelMessagesAdded < maxMessages) {
                const fetchOptions = { limit: 100 };
                if (lastMessageId) {
                    fetchOptions.before = lastMessageId;
                }

                try {
                    const fetchedMessages = await channel.messages.fetch(fetchOptions);

                    if (fetchedMessages.size === 0) {
                        running = false;
                        break;
                    }

                    // Filter out bot messages and prepare them for insertion
                    const newMessages = fetchedMessages.filter(message => !message.author.bot);
                    
                    if (newMessages.size > 0) {
                        const messageObjects = newMessages.map(message => ({
                            userId: message.author.id,
                            guildId: message.guild.id,
                            channelId: message.channel.id,
                            messageId: message.id,
                        }));

                        try {
                            // Insert the new messages into the database.
                            // The `ordered: false` option allows the insertion to continue if a duplicate key is found.
                            const result = await MessageModel.insertMany(messageObjects, { ordered: false });
                            channelMessagesAdded += result.length;
                        } catch (error) {
                            // Mongoose's insertMany can throw an error if there's a duplicate key, even with ordered: false
                            if (error.writeErrors) {
                                // Count the messages that were successfully inserted
                                channelMessagesAdded += messageObjects.length - error.writeErrors.length;
                                console.warn(`Inserted ${messageObjects.length - error.writeErrors.length} messages into **#${channel.name}**. ${error.writeErrors.length} duplicates were skipped.`);
                            } else {
                                console.error('Error inserting new messages:', error);
                                await interaction.followUp({ content: `An unexpected error occurred during message insertion for **#${channel.name}**. Aborting backfill for this channel.`, ephemeral: true });
                                break;
                            }
                        }
                    }
                    // Update the lastMessageId for the next fetch
                    lastMessageId = fetchedMessages.last().id;
                } catch (error) {
                    console.error(`Error fetching messages for **#${channel.name}**:`, error);
                    await interaction.followUp({ content: `An error occurred while fetching messages for **#${channel.name}**. Aborting backfill for this channel.`, ephemeral: true });
                    break;
                }
            }

            await interaction.followUp({ content: `Successfully backfilled **${channelMessagesAdded}** messages from **#${channel.name}**.`, ephemeral: true });
            totalMessagesAdded += channelMessagesAdded;
        }
        
        // Final summary message after all channels have been processed
        await interaction.followUp({
            content: `Backfill process complete for ${allChannels ? 'all channels' : 'the specified channel'}. Total messages added: **${totalMessagesAdded}**.`,
            ephemeral: true,
        });
    },
};
