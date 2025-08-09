const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const afkSchema = require('../../Schemas.js/afkSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afkremoveall')
        .setDescription('Removes all AFK statuses from the server (Moderator Only).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.editReply({
                content: 'You do not have permission to use this command. This command is for moderators only.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const deletedResult = await afkSchema.deleteMany({ Guild: interaction.guild.id });

            const embed = new EmbedBuilder()
                .setColor('#C70039')
                .setDescription(`Successfully cleared **${deletedResult.deletedCount}** AFK statuses from this server.`);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error clearing all AFK statuses:', error);
            await interaction.editReply({
                content: 'There was an error trying to clear all AFK statuses. Please check the bot\'s permissions and database connection.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
