const { SlashCommandBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const StickyMessage = require('../../Schemas.js/stickyMessageSchema');

module.exports = {
    // Define the slash command using SlashCommandBuilder.
    data: new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Manages sticky messages in the channel.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Sets or updates a sticky message for the current channel using a modal.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes the sticky message from the current channel.')
        ),

    // The execute function is called when the slash command is invoked.
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            // Create the modal to collect the multi-line sticky message content.
            const modal = new ModalBuilder()
                .setCustomId('setStickyModal')
                .setTitle('Set Sticky Message Content');

            // Create the text input field for the sticky message content.
            const stickyContentInput = new TextInputBuilder()
                .setCustomId('stickyContentInput')
                .setLabel('Sticky Message Content')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Enter your multi-line sticky message here...')
                .setRequired(true);

            // Add the text input to an action row. Modals require at least one action row.
            const firstActionRow = new ActionRowBuilder().addComponents(stickyContentInput);

            // Add the action row to the modal.
            modal.addComponents(firstActionRow);

            // Show the modal to the user who ran the command.
            try {
                await interaction.showModal(modal);
            } catch (error) {
                console.error('Error showing sticky message modal:', error);
                await interaction.reply({
                    content: 'Failed to show the sticky message input form. Please try again or check bot permissions.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } else if (subcommand === 'remove') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const { guildId, channelId } = interaction;

            try {
                // Find and delete the sticky message data from the database.
                const stickyData = await StickyMessage.findOneAndDelete({ guildId, channelId });

                if (!stickyData) {
                    return await interaction.editReply({ content: 'There is no sticky message to remove in this channel.', flags: MessageFlags.Ephemeral });
                }

                // If a message ID exists in the database, try to delete the message from the channel.
                if (stickyData.messageId) {
                    try {
                        const oldMessage = await interaction.channel.messages.fetch(stickyData.messageId);
                        if (oldMessage) {
                            await oldMessage.delete();
                            console.log(`[RemoveSticky] Deleted sticky message ${stickyData.messageId} in #${interaction.channel.name}`);
                        }
                    } catch (fetchError) {
                        console.warn(`[RemoveSticky] Could not fetch/delete old sticky message ${stickyData.messageId} (might be already deleted or too old):`, fetchError.message);
                    }
                }

                await interaction.editReply({ content: 'Sticky message successfully removed from this channel.', flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error removing sticky message:', error);
                await interaction.editReply({ content: 'There was an error trying to remove the sticky message. Please try again.', flags: MessageFlags.Ephemeral });
            }
        }
    },
};
