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
            // (your existing emoji logic stays here unchanged)
            // ...
        }

        // --- EMOJI REMOVE ---
        else if (subcommand === 'remove') {
            // (your existing emoji remove logic)
            // ...
        }

        // --- EMOJI REMOVE ALL ---
        else if (subcommand === 'remove-all') {
            // (your existing emoji remove-all logic)
            // ...
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
