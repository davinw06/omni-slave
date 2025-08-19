const { 
    SlashCommandBuilder, 
    PermissionsBitField, 
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    Client,
    GatewayIntentBits,
    Partials
} = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Reaction,
    ],
});

// Schema for storing reaction/dropdown roles
const ReactionRole = mongoose.models.ReactionRole || mongoose.model('ReactionRole', new mongoose.Schema({
    guildId: { type: String, required: true },
    messageId: { type: String, required: true },
    emoji: { type: String }, // optional for dropdown
    roleId: { type: String, required: true },
    type: { type: String, default: 'emoji' } // "emoji" or "dropdown"
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Manages reaction roles.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false)

        // --- EMOJI REACTIONS ---
        .addSubcommand(subcommand => {
            subcommand
                .setName('set-multiple')
                .setDescription('Sets up multiple reaction roles for a single message.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The ID of the message to add the reaction roles to.')
                        .setRequired(true)
                );

            for (let i = 1; i <= 12; i++) { // max 12 pairs (24 options < 25 limit)
                subcommand
                    .addStringOption(option =>
                        option.setName(`emoji${i}`)
                            .setDescription(`Emoji ${i}`)
                            .setRequired(i === 1)
                    )
                    .addRoleOption(option =>
                        option.setName(`role${i}`)
                            .setDescription(`Role ${i}`)
                            .setRequired(i === 1)
                    );
            }

            return subcommand;
        })
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
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-all')
                .setDescription('Removes all reaction roles and reactions from a specified message.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The ID of the message to clear.')
                        .setRequired(true))
        )

        // --- DROPDOWN MENU ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('dropdown')
                .setDescription('Create a dropdown menu for role selection.')
                .addStringOption(option =>
                    option.setName('role_ids')
                        .setDescription('Comma-separated list of role IDs (max 50).')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-dropdown')
                .setDescription('Remove a dropdown role menu by message ID.')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The ID of the message containing the dropdown.')
                        .setRequired(true))
        ),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        // --- EMOJI SETUP ---
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

                // Collect emoji/role pairs
                const reactionRolesToSet = [];
                for (let i = 1; i <= 20; i++) {
                    const emoji = interaction.options.getString(`emoji${i}`);
                    const role = interaction.options.getRole(`role${i}`);
                    if (emoji && role) {
                        // Check if role is assignable
                        if (role.position >= interaction.guild.members.me.roles.highest.position) {
                            await interaction.followUp({
                                content: `I cannot assign the role **${role.name}** because it is higher or equal to my highest role. Skipping this role.`,
                                ephemeral: true
                            });
                            continue;
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
                        // Handle custom vs unicode emoji
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
                const message = await interaction.channel.messages.fetch(messageId);

                const deletedDbEntries = await ReactionRole.deleteMany({
                    guildId: interaction.guildId,
                    messageId
                });

                const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);
                if (!botPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    await interaction.editReply({ 
                        content: `I need the "Manage Messages" permission to remove reactions. I have, however, deleted ${deletedDbEntries.deletedCount} database entries for this message.`,
                        ephemeral: true
                    });
                    return;
                }

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

        // --- DROPDOWN CREATE ---
        else if (subcommand === 'dropdown') {
            const roleInput = interaction.options.getString('role_ids');
            const roleIds = roleInput.split(',').map(r => r.trim()).slice(0, 50);

            if (roleIds.length === 0) {
                return interaction.reply({ content: '❌ You must provide at least one role ID.', ephemeral: true });
            }

            const chunkSize = 25;
            const rows = [];

            for (let i = 0; i < roleIds.length; i += chunkSize) {
                const chunk = roleIds.slice(i, i + chunkSize);

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`role_select_${i / chunkSize}`)
                    .setPlaceholder('Choose your role(s)...')
                    .setMinValues(0)
                    .setMaxValues(chunk.length)
                    .addOptions(
                        chunk.map((id, index) => {
                            const role = interaction.guild.roles.cache.get(id);
                            return {
                                label: role ? role.name : `Unknown Role (${id})`,
                                value: id
                            };
                        })
                    );

                rows.push(new ActionRowBuilder().addComponents(selectMenu));
            }

            const replyMessage = await interaction.reply({
                content: '🎭 Pick your roles below:',
                components: rows,
                fetchReply: true
            });

            for (const roleId of roleIds) {
                await ReactionRole.findOneAndUpdate(
                    { guildId: interaction.guildId, messageId: replyMessage.id, roleId },
                    { guildId: interaction.guildId, messageId: replyMessage.id, roleId, type: 'dropdown' },
                    { upsert: true, new: true }
                );
            }
        }

        // --- DROPDOWN REMOVE ---
        else if (subcommand === 'remove-dropdown') {
            const messageId = interaction.options.getString('message_id');

            try {
                const deletedDbEntries = await ReactionRole.deleteMany({
                    guildId: interaction.guildId,
                    messageId,
                    type: 'dropdown'
                });

                const message = await interaction.channel.messages.fetch(messageId).catch(() => null);

                if (message) {
                    await message.edit({ content: '❌ This dropdown menu has been disabled.', components: [] });
                }

                await interaction.reply({
                    content: `✅ Removed dropdown roles for message ID \`${messageId}\`. Deleted ${deletedDbEntries.deletedCount} entries from the database.`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Error removing dropdown:', error);
                await interaction.reply({ content: '❌ Failed to remove dropdown menu. Please check the message ID and try again.', ephemeral: true });
            }
        }
    }
};

// Handle dropdown selections (in main bot file)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('role_select_')) return;

    const member = interaction.member;
    const selected = interaction.values;

    const entries = await ReactionRole.find({ 
        guildId: interaction.guildId, 
        messageId: interaction.message.id, 
        type: 'dropdown' 
    });

    const allRoleIds = entries.map(e => e.roleId);

    await member.roles.remove(allRoleIds);
    if (selected.length > 0) {
        await member.roles.add(selected);
    }

    await interaction.reply({ 
        content: `✅ Your roles have been updated: ${selected.map(id => `<@&${id}>`).join(', ') || 'none'}`, 
        ephemeral: true 
    });
});
