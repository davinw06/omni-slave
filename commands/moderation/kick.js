const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true)) // This option is required
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking this user')
                .setRequired(false)) // This option is optional
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    // The execute function contains the logic for the command
    async execute(interaction) {
        // Defer the reply to give the bot more time to process, especially for API calls
        await interaction.deferReply({ ephemeral: false }); // ephemeral: false for a public reply

        const targetUser = interaction.options.getUser('target'); // Get the user object from the 'target' option
        const reason = interaction.options.getString('reason') || 'No reason provided.'; // Get the reason, default if none given


        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.editReply({ content: 'You do not have permission to kick members.', flags: MessageFlags.Ephemeral });
        }

        // Get the GuildMember object for the target user
        // This is important because you kick a GuildMember, not just a User
        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        // Check if the target user is in the guild
        if (!targetMember) {
            return interaction.editReply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
        }

        // Prevent kicking self
        if (targetMember.id === interaction.member.id) {
            return interaction.editReply({ content: 'You cannot kick yourself!', flags: MessageFlags.Ephemeral });
        }

        // Check if the bot has the KICK_MEMBERS permission
        // interaction.guild.members.me refers to the bot's member object in the guild
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.editReply({ content: 'I do not have permission to kick members. Please check my role permissions.', flags: MessageFlags.Ephemeral });
        }

        // Check if the bot can kick the target user (hierarchy check)
        // The bot cannot kick users with a higher or equal role in the hierarchy
        if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.editReply({ content: `I cannot kick **${targetUser.tag}** as their highest role is equal to or higher than mine.`, flags: MessageFlags.Ephemeral });
        }

        // Check if the command executor can kick the target user (hierarchy check)
        // The command executor cannot kick users with a higher or equal role in the hierarchy
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ content: `You cannot kick **${targetUser.tag}** as their highest role is equal to or higher than yours.`, flags: MessageFlags.Ephemeral });
        }

        try {
            // Attempt to kick the member
            // .kick() method takes an object with 'reason'
            await targetMember.kick(reason);

            // Send a success message
            await interaction.editReply({ content: `Successfully kicked **${targetUser.tag}** for: **${reason}**`, ephemeral: false }); // ephemeral: false for a public message

            // You can also send a message to a moderation log channel if you have one
            const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'modlog');
            if (logChannel) {
                logChannel.send(`**${interaction.user.globalName}** kicked **${targetUser.tag}** for: **${reason}**`);
            }

        } catch (error) {
            console.error(`Error kicking user ${targetUser.tag}:`, error);
            await interaction.editReply({ content: `There was an error trying to kick **${targetUser.tag}**. Please check my permissions or try again later.`, flags: MessageFlags.Ephemeral });
        }
    },
};
