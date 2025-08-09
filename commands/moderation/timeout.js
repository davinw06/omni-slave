const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Times out a user for a specified duration.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration of the timeout in minutes (e.g., 60 for 1 hour)')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for timing out this user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('target');
        const durationMinutes = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({ content: 'You do not have permission to timeout members.', flags: MessageFlags.Ephemeral });
        }

        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
            return interaction.editReply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
        }

        if (targetMember.id === interaction.member.id) {
            return interaction.editReply({ content: 'You cannot timeout yourself!', flags: MessageFlags.Ephemeral });
        }

        if (targetMember.id === interaction.client.user.id) {
            return interaction.editReply({ content: 'I cannot timeout myself!', flags: MessageFlags.Ephemeral });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply({ content: 'I do not have permission to timeout members. Please check my role permissions.', flags: MessageFlags.Ephemeral });
        }

        if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.editReply({ content: `I cannot timeout **${targetUser.tag}** as their highest role is equal to or higher than mine.`, flags: MessageFlags.Ephemeral });
        }

        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ content: `You cannot timeout **${targetUser.tag}** as their highest role is equal to or higher than yours.`, flags: MessageFlags.Ephemeral });
        }

        const durationMs = durationMinutes * 60 * 1000;

        try {
            await targetMember.timeout(durationMs, reason);

            await interaction.editReply({ content: `Successfully timed out **${targetUser.tag}** for **${durationMinutes} minutes** for: **${reason}**`, ephemeral: false });

            const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'modlog');
            if (logChannel) {
                logChannel.send(`**${interaction.user.globalName}** timed out **${targetUser.tag}** for **${durationMinutes} minutes** for: **${reason}**`);
            }

        } catch (error) {
            console.error(`Error timing out user ${targetUser.tag}:`, error);
            await interaction.editReply({ content: `There was an error trying to timeout **${targetUser.tag}**. Please check my permissions or try again later.`, flags: MessageFlags.Ephemeral });
        }
    },
};
