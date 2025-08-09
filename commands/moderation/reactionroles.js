const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const mongoose = require('mongoose');

// Assuming the ReactionRole schema is defined in a shared or accessible way.
const ReactionRole = mongoose.models.ReactionRole || mongoose.model('ReactionRole', new mongoose.Schema({
    guildId: { type: String, required: true },
    messageId: { type: String, required: true },
    emoji: { type: String, required: true },
    roleId: { type: String, required: true },
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Manages reaction roles.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-multiple')
                .setDescription('Sets up multiple reaction roles for a single message.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The ID of the message to add the reaction roles to.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji1')
                        .setDescription('The first emoji to react with.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role1')
                        .setDescription('The first role to assign.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji2')
                        .setDescription('The second emoji to react with (optional).')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role2')
                        .setDescription('The second role to assign (optional).')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('emoji3')
                        .setDescription('The third emoji to react with (optional).')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role3')
                        .setDescription('The third role to assign (optional).')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a specific reaction role by message ID and emoji.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The ID of the message to remove the reaction role from.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji to remove.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-all')
                .setDescription('Removes all reaction roles and reactions from a specified message.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The ID of the message to clear.')
                        .setRequired(true))),
    
    async execute(interaction) {
        if (!interaction.inGuild()) {
            return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set-multiple') {
            const messageId = interaction.options.getString('message_id');

            await interaction.deferReply({ ephemeral: true });

            try {
                const channel = interaction.channel;
                const message = await channel.messages.fetch(messageId);

                const botPermissions = interaction.guild.members.me.permissionsIn(channel);
                if (!botPermissions.has(PermissionsBitField.Flags.AddReactions)) {
                    return interaction.editReply({ content: 'I need the "Add Reactions" permission to set this up.' });
                }
                if (!botPermissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    return interaction.editReply({ content: 'I need the "Manage Roles" permission to assign roles.' });
                }

                const reactionRolesToSet = [];
                const emojis = [interaction.options.getString('emoji1'), interaction.options.getString('emoji2'), interaction.options.getString('emoji3')];
                const roles = [interaction.options.getRole('role1'), interaction.options.getRole('role2'), interaction.options.getRole('role3')];

                for (let i = 0; i < emojis.length; i++) {
                    const emoji = emojis[i];
                    const role = roles[i];

                    if (emoji && role) {
                         if (role.position >= interaction.guild.members.me.roles.highest.position) {
                            await interaction.followUp({ content: `I cannot assign the role **${role.name}** because it is higher or equal to my highest role. Skipping this role.`, ephemeral: true });
                            continue; // Skip this pair and continue with the next
                        }

                        reactionRolesToSet.push({ emoji, role });
                    }
                }

                if (reactionRolesToSet.length === 0) {
                    return interaction.editReply({ content: 'You must provide at least one emoji and role pair.', ephemeral: true });
                }
                
                let successMessages = [];
                let failedMessages = [];

                for (const { emoji, role } of reactionRolesToSet) {
                    try {
                        const customEmojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
                        const emojiToReact = customEmojiMatch ? customEmojiMatch[2] : emoji;
                        await message.react(emojiToReact);

                        await ReactionRole.findOneAndUpdate(
                            { guildId: interaction.guildId, messageId, emoji },
                            { guildId: interaction.guildId, messageId, emoji, roleId: role.id },
                            { upsert: true, new: true }
                        );
                        successMessages.push(`React with ${emoji} to get the **${role.name}** role.`);
                    } catch (error) {
                        console.error(`Error setting reaction role for emoji ${emoji} and role ${role.name}:`, error);
                        failedMessages.push(`Failed to set up reaction role for emoji ${emoji} and role **${role.name}**. Make sure the emoji is valid.`);
                    }
                }
                
                const replyContent = [
                    `Successfully updated reaction roles for [this message](${message.url}):`,
                    ...successMessages,
                    ...failedMessages
                ].join('\n');

                await interaction.editReply({ content: replyContent, ephemeral: true });

            } catch (error) {
                console.error('Error setting reaction role:', error);
                if (error.code === 10008) {
                    await interaction.editReply({ content: 'I could not find a message with that ID in this channel.' });
                } else if (error.code === 50001) {
                    await interaction.editReply({ content: 'I do not have the required permissions to perform this action.' });
                } else {
                    await interaction.editReply({ content: 'There was an error while setting the reaction role. Please check the message ID and emojis, and ensure I have the necessary permissions (Manage Roles, Add Reactions).' });
                }
            }

        } else if (subcommand === 'remove') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');

            await interaction.deferReply({ ephemeral: true });

            try {
                const deleted = await ReactionRole.deleteOne({
                    guildId: interaction.guildId,
                    messageId,
                    emoji
                });

                if (deleted.deletedCount > 0) {
                    await interaction.editReply({ content: `Successfully removed the reaction role for message ID \`${messageId}\` with emoji ${emoji}.` });
                } else {
                    await interaction.editReply({ content: `No reaction role found for message ID \`${messageId}\` with emoji ${emoji}.` });
                }

            } catch (error) {
                console.error('Error removing reaction role:', error);
                await interaction.editReply({ content: 'There was an error removing the reaction role. Please try again later.' });
            }
        } else if (subcommand === 'remove-all') {
            const messageId = interaction.options.getString('message_id');
            await interaction.deferReply({ ephemeral: true });

            try {
                // Find the message in the channel
                const message = await interaction.channel.messages.fetch(messageId);

                // Delete all reaction roles from the database for this message
                const deletedDbEntries = await ReactionRole.deleteMany({
                    guildId: interaction.guildId,
                    messageId
                });

                // Check bot permissions to manage messages (for removing reactions)
                const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);
                if (!botPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    await interaction.editReply({ 
                        content: `I need the "Manage Messages" permission to remove reactions. I have, however, deleted ${deletedDbEntries.deletedCount} database entries for this message.`,
                        ephemeral: true
                    });
                    return;
                }

                // Remove all reactions from the message
                await message.reactions.removeAll();

                await interaction.editReply({
                    content: `Successfully removed all reaction roles from the database and cleared all reactions from the message with ID \`${messageId}\`. A total of ${deletedDbEntries.deletedCount} database entries were removed.`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Error removing all reaction roles:', error);
                if (error.code === 10008) {
                    await interaction.editReply({ content: 'I could not find a message with that ID in this channel.' });
                } else {
                    await interaction.editReply({ content: 'There was an error while trying to remove all reaction roles. Please check the message ID and my permissions.' });
                }
            }
        }
    }
};
