const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whisper')
        .setDescription('Allows u to send a message without disrupting your AFK status')
        .addStringOption( option =>
            option.setName('message')
            .setDescription('The message which you want to send')
            .setRequired(true)
        ),

    async execute(interaction) {
        let User = interaction.user;
        let msg = interaction.options.get('message').value;
        let message = `**${User.displayName}:** ${msg}`;

        await interaction.reply(message);
    },
};
