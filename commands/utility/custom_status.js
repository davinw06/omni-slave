const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays the custom status of a mentioned member.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member whose custom status you want to check.')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('member') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id);

        let embedColor = 0xFF0000;
        let statusDescription = '';

        const presence = member.presence;

        if (presence) {
            const customActivity = presence.activities.find(activity => activity.type === 4);

            if (customActivity && customActivity.state) {
                statusDescription = `${customActivity.emoji ? customActivity.emoji.name + ' ' : ''}${customActivity.state}`;
            } else {
                statusDescription = `**${member.user.tag}** does not have a custom status set.`;
            }
        } else {
            statusDescription = `**${member.user.tag}** is offline or their presence information is not available.`;
        }

        const statusEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${member.user.displayName}'s Custom Status`)
            .setDescription(statusDescription)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [statusEmbed] });
    },
};
