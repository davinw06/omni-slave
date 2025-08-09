const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Shows how likely user is to gamble')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('User who you want to select.')
            .setRequired(false)
        ),
    async execute(interaction) {
        let user = interaction.options.getUser('user');
        if(!user) user = interaction.user;
        const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        const randomint = Math.floor(Math.random() * 100) + 1;
        
        const authorAvatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
        let embedDescription;
        let embedColor;

        if (randomint < 50) { // Changed '50' to 50 for numerical comparison
            embedDescription = `<@${user.id}> has a ${randomint}% chance of winning BIG... 99% of gamblers quit before they hit it big, DONT GIVE UP`;
            embedColor = '#FF0000'; // Red color for less than 50% chance
        } else { // Changed '50' to 50 for numerical comparison and combined into else
            embedDescription = `<@${user.id}> has a ${randomint}% chance of winning BIG... they should also throw in their college funds to win even bigger!`;
            embedColor = '#00A0FF'; // Green color for 50% or more chance
        }

        const gambleEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🤑 Gambling Chances 🤑')
            .setDescription(embedDescription)
            .setImage(avatarURL) // Set the user's avatar as the thumbnail
            .setTimestamp()
            .setFooter({ text: 'Gamble responsibly (or not!)', iconURL: authorAvatarURL }); // Added a footer

        await interaction.reply({ embeds: [gambleEmbed] });
    }
};
