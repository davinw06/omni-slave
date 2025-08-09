const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears a specified number of messages from the channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    // The execute function is called when the slash command is used.
    async execute(interaction) {
        // Defer the reply to ensure the bot responds quickly,
        // as clearing messages can take a moment. This prevents "This interaction failed" error.
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // flags: MessageFlags.Ephemeral means only the user sees this reply.

        const amount = interaction.options.getInteger('amount'); // Get the 'amount' value from the command options.

        // Check if the bot has the MANAGE_MESSAGES permission.
        // This is crucial for the bot to be able to delete messages.
        if (!interaction.channel.permissionsFor(interaction.client.user).has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.editReply({ content: 'I do not have permission to delete messages in this channel. Please grant me "Manage Messages" permission.', flags: MessageFlags.Ephemeral });
        }

        // Check if the user executing the command has the MANAGE_MESSAGES permission.
        // This is a good practice to prevent unauthorized users from clearing chat.
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.editReply({ content: 'You do not have permission to clear messages in this channel.', flags: MessageFlags.Ephemeral });
        }

        try {
            // Fetch messages to delete.
            // .bulkDelete() can delete up to 100 messages at once that are less than 14 days old.
            // Messages older than 14 days cannot be bulk deleted and must be deleted individually (not covered here for simplicity).
            const fetched = await interaction.channel.messages.fetch({ limit: amount });
            const deletedMessages = await interaction.channel.bulkDelete(fetched, true); // true = filterPinned: Whether to filter out pinned messages.

            // Send a confirmation message after deletion.
            // We use editReply since we deferred the reply earlier.
            // flags: MessageFlags.Ephemeral means only the user who used the command sees this.
            await interaction.editReply({ content: `Successfully deleted ${deletedMessages.size} messages.`, flags: MessageFlags.Ephemeral });

            // Optional: Log to console for debugging/monitoring
            console.log(`[Clear Command] ${deletedMessages.size} messages cleared by ${interaction.user.tag} in #${interaction.channel.name} (${interaction.guild.name})`);

        } catch (error) {
            console.error('Error clearing messages:', error);

            // Handle specific errors, e.g., messages too old for bulk delete.
            if (error.code === 10008 || error.message.includes('You can only bulk delete messages that are under 14 days old.')) {
                await interaction.editReply({ content: 'I encountered an error while trying to delete messages. Messages older than 14 days cannot be bulk deleted. Please try deleting fewer messages or only recent ones.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply({ content: 'There was an error trying to clear messages in this channel!', flags: MessageFlags.Ephemeral });
            }
        }
    },
};
