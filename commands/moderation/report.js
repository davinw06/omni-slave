const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription(`Sends a report to moderation team`)
        .addStringOption( option =>
            option.setName('category')
            .setDescription('Select the nature of your report')
            .setRequired(true)
            .addChoices( 
                { name: 'Spamming', value: 'spamming' },
                { name: 'Harassment', value: 'harassment' },
                { name: 'Hate Speech', value: 'hate_speech' },
                { name: 'Impersonation', value: 'impersonation' },
                { name: 'NSFW Content', value: 'nsfw_content' },
                { name: 'Rule Breaking (Other)', value: 'other_rule_breaking' },
                { name: 'Bot Issues', value: 'bot_issues' },
                { name: 'Moderation Issue', value: 'mod_problems' },
                { name: 'Custom', value: 'custom' }
            )
        )
        .addStringOption( option =>
            option.setName('description')
            .setDescription('Describe the details of your report')
            .setRequired(true)
        )
        .addUserOption( option =>
            option.setName('user')
            .setDescription('The user whom you want to report (optional)')
            .setRequired(false)
        ),

        async execute(interaction) {
            const REPORTS_CHANNEL_ID = '1381543045106896936';
            const reportedUser = interaction.options.getUser('user');
            const category = interaction.options.getString('category');
            const description = interaction.options.getString('description');
            const reporterAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

            try {
                const reportsChannel = await interaction.guild.channels.fetch(REPORTS_CHANNEL_ID); // Fetch the channel

                if (!reportsChannel) {
                    return interaction.reply({ content: 'Report channel not found! Please contact an administrator.', flags: MessageFlags.Ephemeral });
                }

                // Create an embed for the report
                const reportEmbed = {
                    color: 0xFF0000, // Red color
                    title: `New Report: ${category.replace(/_/g, ' ').toUpperCase()}`, // Format category
                    description: `**Reported by:** ${interaction.user.tag} (${interaction.user.id})\n` +
                                `${reportedUser ? `**Reported user:** ${reportedUser.tag} (${reportedUser.id})\n` : ''}` +
                                `**Description:**\n${description}`,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Report ID: ${Date.now()}, Reported by: ${interaction.user.displayName}`,
                        icon_url: reporterAvatar  // Simple unique ID
                    },
                };

                    if (reportedUser) {
                    reportEmbed.thumbnail = {
                        url: reportedUser.displayAvatarURL({ format: 'png', dynamic: true, size: 256 }) // Get reported user's avatar
                    };
                }

                await reportsChannel.send({ embeds: [reportEmbed] });
                await interaction.reply({ content: `Your report has been successfully submitted!`, flags: MessageFlags.Ephemeral });

                } catch (error) {
                    console.error('Error sending report:', error);
                    await interaction.reply({ content: 'There was an error submitting your report. Please try again later.', flags: MessageFlags.Ephemeral });
                }
                
        },
};