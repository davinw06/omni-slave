const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gooning')
        .setDescription('Shows how likely it is for this user to be gooning')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('User who you want to find out if they are gooning')
            .setRequired(false)
        ),
    async execute(interaction) {
        let user = interaction.options.getUser('user');
        if(!user) user = interaction.user;
        const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        const randomint = Math.floor(Math.random() * 100) + 1;
        
        let embedDescription;
        let embedColor = 'FF0000';

        if (randomint < 30) {
            embedDescription = `There is a ${randomint}% chance that <@${user.id}> is gooning right now. We might be safe... for now.`;
        } else if (randomint < 60) {
            embedDescription = `There is a ${randomint}% chance that <@${user.id}> is probably gooning right now. Don't leave this person near kids or computers`;
        } else if (randomint < 90) { // Changed '50' to 50 for numerical comparison and combined into else
            embedDescription = `There is a ${randomint}% chance that <@${user.id}> is FOR SURE gooning right now. It's a lifestyle atp...`;
        } else {
            embedDescription = `There is a ${randomint}% chance that <@${user.id}> is DEFINITELY gooning right now. DO NOT SHAKE VRO'S HAND`;
        }
            
        const authorAvatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

        const gambleEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`💦 **${user.displayName}'s** Gooning Habits 💦`)
            .setDescription(embedDescription)
            .setImage(avatarURL) // Set the user's avatar as the thumbnail
            .setTimestamp()
            .setFooter({ text: 'Do they need help?', iconURL: authorAvatarURL }); // Added a footer

        await interaction.reply({ embeds: [gambleEmbed] });
    }
};
