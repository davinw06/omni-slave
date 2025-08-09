const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Gets the avatar of a user')
        .addUserOption(option =>
            option.setName('user')
            .setDescription('User whose avatar you want to see')
            .setRequired(false)
        ),
    async execute(interaction) {
        let user = interaction.options.getUser('user');
        if (!user) user = interaction.user;

        const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const authorAvatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

        const embed = new EmbedBuilder()
            .setColor('#C70039')
            .setTitle(`**${user.displayName}'s** Avatar`)
            .setImage(avatarURL)
            .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: authorAvatarURL })
            .setTimestamp();

        try {
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error replying to interaction:', error);
            await interaction.followUp({ content: 'There was an error trying to fetch the avatar.', flags: MessageFlags.Ephemeral });
        }
    }
};
