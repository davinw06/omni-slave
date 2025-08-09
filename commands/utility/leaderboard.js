const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MessageModel = require('../../Schemas.js/messageSchema'); // Adjust this path if necessary
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top 3 users and your own rank by total messages sent.'),

    async execute(interaction) {
        // Defer the reply to give the bot time to run the database query.
        await interaction.deferReply();

        // Check if Mongoose is connected before trying to query the database.
        if (mongoose.connection.readyState !== 1) {
            return interaction.editReply({
                content: 'The database is not ready. Please try again later.',
                ephemeral: true
            });
        }

        try {
            // Aggregation pipeline to get the top 3 users.
            const topUsers = await MessageModel.aggregate([
                { $match: { guildId: interaction.guild.id } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 3 },
            ]);

            // Aggregation pipeline to get the rank of all users for ranking purposes.
            const allUsers = await MessageModel.aggregate([
                { $match: { guildId: interaction.guild.id } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);

            // Find the current user's rank and message count.
            let userRank = 'N/A';
            let userMessageCount = 0;
            const currentUserData = allUsers.find(user => user._id === interaction.user.id);
            if (currentUserData) {
                userRank = allUsers.indexOf(currentUserData) + 1;
                userMessageCount = currentUserData.count.toLocaleString();
            }

            const authorAvatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

            // Create a new embed to display the leaderboard.
            const leaderboardEmbed = new EmbedBuilder()
                .setColor(0x00CD45)
                .setTitle(`🏆 Server Message Leaderboard🏆`)
                .setDescription('The top 3 Grand Master Baiters🔥🔥')
                .setImage('https://i.imgur.com/UziA3fD.png')
                .setTimestamp()
                .setFooter({ text: `Requested by: ${interaction.user.displayName}`, iconURL: authorAvatarURL });

            // Populate the embed fields with the top users.
            if (topUsers.length > 0) {
                for (const [index, userData] of topUsers.entries()) {
                    try {
                        const user = await interaction.client.users.fetch(userData._id);
                        leaderboardEmbed.addFields({
                            name: `#${index + 1}. ${user.displayName}`,
                            value: `${userData.count.toLocaleString()} messages`,
                            inline: false
                        });
                    } catch (error) {
                        console.error(`Could not fetch user with ID ${userData._id}:`, error);
                        leaderboardEmbed.addFields({
                            name: `${index + 1}. Unknown User`,
                            value: `${userData.count.toLocaleString()} messages`,
                            inline: false
                        });
                    }
                }
            } else {
                leaderboardEmbed.setDescription('No messages found in the database for this server.');
            }
            
            // Add a new field for the current user's rank, even if they aren't in the top 3.
            leaderboardEmbed.addFields({
                name: '\u200b', // Zero-width space for a clean separator
                value: `Your Rank: **#${userRank}** with **${userMessageCount}** messages.`,
                inline: false
            });

            // Send the leaderboard embed as the final reply.
            await interaction.editReply({ embeds: [leaderboardEmbed] });

        } catch (error) {
            console.error('Error fetching leaderboard data from MongoDB:', error);
            await interaction.editReply({ content: 'An error occurred while trying to create the leaderboard.', ephemeral: true });
        }
    },
};