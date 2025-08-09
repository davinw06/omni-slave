const { SlashCommandBuilder, EmbedBuilder, GuildMember } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('Displays the stats of the server'),

    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner().catch(() => null);

        const serverName = guild.name;
        const serverId = guild.id;
        const memberCount = guild.memberCount;
        const createdAt = guild.createdAt.toDateString();
        const iconURL = guild.iconURL({ dynamic: true, size: 256 });

        const roleCount = guild.roles.cache.size;
        const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
        const categoryChannels = guild.channels.cache.filter(channel => channel.type === 4).size;

        const embed = new EmbedBuilder()
            .setColor('2ABDFD')
            .setTitle(`**${serverName}**`)
            .setImage(iconURL || 'https://discord.com/assets/default_avatar.png')
            .addFields(
                { name: '🪪 Server ID', value: serverId, inline: true },
                { name: '👑 Owner', value: owner ? owner.user.globalName : 'Unknown', inline: false },
                { name: '👥 Members', value: memberCount.toString(), inline: false },
                { name: '🗓️ Created On', value: createdAt, inline: false },
                { name: '🎭 Roles', value: roleCount.toString(), inline: false },
                { name: '💬 Text Channels', value: textChannels.toString(), inline: true },
                { name: '🔊 Voice Channels', value: voiceChannels.toString(), inline: true },
                { name: '🗃️ Categories', value: categoryChannels.toString(), inline: true },
                { name: '⭐ Boosts', value: guild.premiumSubscriptionCount.toString(), inline: true },
                { name: '✅ Verification Level', value: guild.verificationLevel.toString(), inline: true },
            )
            .setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });

        await interaction.reply({ embeds: [embed] });
    },
};
