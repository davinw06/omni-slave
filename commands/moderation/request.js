const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription(`Sends a request to moderation team`)
        .addStringOption( option =>
            option.setName('category')
            .setDescription('Select the nature of your request')
            .setRequired(true)
            .addChoices( 
                { name: 'Add Bot', value: 'bot_adding' },
                { name: 'Emojis & Stickers', value: 'vanity' },
                { name: 'Add Command/Change Command', value: 'commands' },
                { name: 'Custom', value: 'custom' }
            )
        )
        .addStringOption( option =>
            option.setName('description')
            .setDescription('Describe the details of your request')
            .setRequired(true)
        ),

        async execute(interaction) {
            const REQUESTS_CHANNEL_ID = '1402172678118572062';
            const category = interaction.options.getString('category');
            const description = interaction.options.getString('description');
            const requesterAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

            try {
                const requestsChannel = await interaction.guild.channels.fetch(REQUESTS_CHANNEL_ID); // Fetch the channel

                if (!requestsChannel) {
                    return interaction.reply({ content: 'Request channel not found! Please contact an administrator.', flags: MessageFlags.Ephemeral });
                }

                // Create an embed for the report
                const requestEmbed = {
                    color: 0x0065BC,
                    title: `New Request: ${category.replace(/_/g, ' ').toUpperCase()}`, // Format category
                    description: `**Requested by:** ${interaction.user.tag} (${interaction.user.id})\n` +
                                `**Description:**\n${description}`,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Request ID: ${Date.now()}, Requested by: ${interaction.user.displayName}`,
                        icon_url: requesterAvatar  // Simple unique ID
                    },
                };

                await requestsChannel.send({ embeds: [requestEmbed] });
                await interaction.reply({ content: `Your request has been successfully submitted!`, flags: MessageFlags.Ephemeral });

                } catch (error) {
                    console.error('Error sending report:', error);
                    await interaction.reply({ content: 'There was an error submitting your request. Please try again later.', flags: MessageFlags.Ephemeral });
                }
                
        },
};