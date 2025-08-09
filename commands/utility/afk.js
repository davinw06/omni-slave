const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const afkSchema = require('../../Schemas.js/afkSchema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Sets your AFK status')
    .addSubcommand(command =>
        command.setName('set')
        .setDescription('Go AFK')
        .addStringOption(option =>
            option.setName('message')
            .setDescription('Reason for being AFK')
            .setRequired(false)
        )
    )
    .addSubcommand(command =>
        command.setName('remove')
        .setDescription('Remove your AFK status')
    ),

    async execute(interaction) {
        const { options } = interaction;
        const sub = options.getSubcommand();

        const Data = await afkSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });

        switch (sub) {
            case "set":
                if (Data) {
                    return await interaction.reply({
                        content: 'You are already AFK!!',
                        ephemeral: true
                    });
                } else {
                    const message = options.getString('message') || "I'm busy lil bro. Go touch some grass while I'm touching your mom";
                    await afkSchema.create({
                        Guild: interaction.guild.id,
                        User: interaction.user.id,
                        Message: message
                    });

                    const embed = new EmbedBuilder()
                        .setColor('#C70039')
                        .setDescription(`You are now AFK. Reason: **${message}**`);

                    await interaction.reply({ embeds: [embed] });
                }
                break;
            case "remove":
                if (!Data) {
                    return await interaction.reply({
                        content: 'You are not AFK!!',
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await afkSchema.deleteMany({ Guild: interaction.guild.id, User: interaction.user.id });

                    const embed = new EmbedBuilder()
                        .setColor('#C70039')
                        .setDescription('You are no longer AFK.');

                    await interaction.reply({ embeds: [embed] });
                }
                break;
            case "removeall":
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    return await interaction.reply({
                        content: 'You do not have permission to use this command. This command is for moderators only.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                try {
                    const deletedCount = await afkSchema.deleteMany({ Guild: interaction.guild.id });
                    const embed = new EmbedBuilder()
                        .setColor('#C70039')
                        .setDescription(`Successfully cleared **${deletedCount.deletedCount}** AFK statuses from this server.`);

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error clearing all AFK statuses:', error);
                    await interaction.reply({
                        content: 'There was an error trying to clear all AFK statuses.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                break;
        }
    },
};
