const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    // Define the slash command data
    data: new SlashCommandBuilder()
        .setName('deletemessages')
        .setDescription('Deletes messages sent by a specific user in the current channel.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user whose messages you want to delete.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    // The execute function for the command
    async execute(interaction) {
        // Check if the user executing the command has permission to manage messages
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'You do not have permission to delete messages.', flags: MessageFlags.Ephemeral });
        }

        // Get the target user from the command options
        const targetUser = interaction.options.getUser('target');

        // Define a limit for messages to fetch to avoid fetching too many
        const messageFetchLimit = 100; // Fetch the last 100 messages

        try {
            // Fetch messages from the channel where the command was used
            const messages = await interaction.channel.messages.fetch({ limit: messageFetchLimit });

            // Filter messages sent by the target user
            const userMessages = messages.filter(msg => msg.author.id === targetUser.id);

            if (userMessages.size === 0) {
                return interaction.reply({ content: `No messages found from ${targetUser.tag} in the last ${messageFetchLimit} messages.`, flags: MessageFlags.Ephemeral });
            }

            // Delete the collected messages
            // bulkDelete can delete up to 100 messages at once, and they must be less than 14 days old.
            const deletedCount = await interaction.channel.bulkDelete(userMessages, true); // `true` deletes pinned messages too if they are within the age limit.

            // Send a confirmation message
            await interaction.reply({ content: `Successfully deleted ${deletedCount.size} messages from ${targetUser.tag}.`, flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({ content: 'There was an error trying to delete messages in this channel.', flags: MessageFlags.Ephemeral });
        }
    },
};
