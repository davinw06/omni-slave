const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { applyRainbowFilter } = require('../../rainbow.js'); // Assuming rainbow.js is in the same directory

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription('Shows how gay someone is')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('User who you want to find out how gay they are')
            .setRequired(false)
        ),
    async execute(interaction) {
        // Defer the reply so the user knows the bot is working
        await interaction.deferReply();

        // Get the user from the command, defaulting to the interaction user if none is provided
        let user = interaction.options.getUser('user');
        if (!user) {
            user = interaction.user;
        }

        // Get the user's avatar URL and ensure it's a PNG
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });
        
        // Apply the rainbow filter to the avatar and get the new URL
        const filteredAvatarURL = await applyRainbowFilter(avatarURL);

        // Generate a random percentage
        const randomint = Math.floor(Math.random() * 100) + 1;
        
        let embedDescription;
        let embedColor = '#ff44b2'; // A vibrant pink color

        if (randomint < 30) {
            embedDescription = `<@${user.id}> is ${randomint}% gay. They're a lil fruity.`;
        } else if (randomint < 60) {
            embedDescription = `<@${user.id}> is ${randomint}% gay. They definitely clap and cry when the plane lands.`;
        } else if (randomint < 90) {
            embedDescription = `<@${user.id}> is ${randomint}% gay. Bro is definitely HOMOSEXUAL`;
        } else {
            embedDescription = `<@${user.id}> is ${randomint}% gay. They DEFINITELY think of veiny ahh dihs in their free time.`;
        }
            
        // Create the embed message
        const gayEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`🌈 **${user.displayName}'s** Fruitiness 🌈`)
            .setDescription(embedDescription)
            .setImage(filteredAvatarURL) // Set the filtered avatar URL
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

        // Send the final embed as a reply
        await interaction.editReply({ embeds: [gayEmbed] });
    }
};
