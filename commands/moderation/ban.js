// Import necessary Discord.js classes
const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

// Export the command module
module.exports = {
    // Define the slash command
    // Use .setName() for the command name (e.g., /ban)
    // Use .setDescription() for a brief explanation of the command
    // Use .addUserOption() to add an option to select a user
    // Use .addStringOption() to add an optional reason for the ban
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true)) // This option is required
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning this user')
                .setRequired(false)) // This option is optional
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    // The execute function contains the logic for the command
    async execute(interaction) {
        // Defer the reply to give the bot more time to process, especially for API calls
        await interaction.deferReply({ ephemeral: false }); // flags: MessageFlags.Ephemeral makes the reply visible only to the user who ran the command

        const targetUser = interaction.options.getUser('target'); // Get the user object from the 'target' option
        const reason = interaction.options.getString('reason') || 'No reason provided.'; // Get the reason, default if none given

        // Check if the command executor has the BAN_MEMBERS permission
        // PermissionsBitField.Flags.BanMembers represents the 'Ban Members' permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.editReply({ content: 'You do not have permission to ban members.', flags: MessageFlags.Ephemeral });
        }

        // Get the GuildMember object for the target user
        // This is important because you ban a GuildMember, not just a User
        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        // Check if the target user is in the guild
        if (!targetMember) {
            return interaction.editReply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
        }

        // Prevent banning self
        if (targetMember.id === interaction.member.id) {
            return interaction.editReply({ content: 'You cannot ban yourself!', flags: MessageFlags.Ephemeral });
        }

        // Check if the bot has the BAN_MEMBERS permission
        // interaction.guild.members.me refers to the bot's member object in the guild
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.editReply({ content: 'I do not have permission to ban members. Please check my role permissions.', flags: MessageFlags.Ephemeral });
        }

        // Check if the bot can ban the target user (hierarchy check)
        // The bot cannot ban users with a higher or equal role in the hierarchy
        if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.editReply({ content: `I cannot ban **${targetUser.tag}** as their highest role is equal to or higher than mine.`, flags: MessageFlags.Ephemeral });
        }

        // Check if the command executor can ban the target user (hierarchy check)
        // The command executor cannot ban users with a higher or equal role in the hierarchy
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({ content: `You cannot ban **${targetUser.tag}** as their highest role is equal to or higher than yours.`, flags: MessageFlags.Ephemeral });
        }

        try {
            // Attempt to ban the member
            // .ban() method takes an object with 'reason' and 'deleteMessageSeconds' (optional)
            await targetMember.ban({ reason });

            // Send a success message
            await interaction.editReply({ content: `Successfully banned **${targetUser.tag}** for: **${reason}**`, ephemeral: false }); // ephemeral: false for a public message

            // You can also send a message to a moderation log channel if you have one
            const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'modlog');
            if (logChannel) {
                logChannel.send(`**${interaction.user.globalName}** banned **${targetUser.tag}** for: **${reason}**`);
            }

        } catch (error) {
            console.error(`Error banning user **${targetUser.tag}**:`, error);
            await interaction.editReply({ content: `There was an error trying to ban **${targetUser.tag}**. Please check my permissions or try again later.`, flags: MessageFlags.Ephemeral });
        }
    },
};
