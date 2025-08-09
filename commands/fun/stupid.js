const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stupid')
        .setDescription('Shows how stupid someone is')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('User who u think might be stupid')
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
            embedDescription = `<@${user.id}> is ${randomint}% stupid. You're probably happy that the number is low... That's how stupid you are.`;
        } else if (randomint < 60) {
            embedDescription = `<@${user.id}> is ${randomint}% stupid. Cheer up.. if there's one thing you're not, it's smart.`;
        } else if (randomint < 90) { // Changed '50' to 50 for numerical comparison and combined into else
            embedDescription = `<@${user.id}> is ${randomint}% stupid. Pfft.. I've seen retards less challenged than you.. Mentally.`;
        } else {
            embedDescription = `<@${user.id}> is ${randomint}% stupid. You could walk into an empty room and you'd still be the dumbest one there.`;
        }
            
        const authorAvatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

        const stupidEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`💩 **${user.displayName}'s** Stupidity Levels 💩`)
            .setDescription(embedDescription)
            .setImage(avatarURL) // Set the user's avatar as the thumbnail
            .setTimestamp()
            .setFooter({ text: 'What an idiot.', iconURL: authorAvatarURL }); // Added a footer

        await interaction.reply({ embeds: [stupidEmbed] });
    }
};
