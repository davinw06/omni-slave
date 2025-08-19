const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const { execute } = require("../fun/relationships");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('The bot sends a message in the current chat (used for testing)')
        .addStringOption( option =>
            option.setName('string')
            .setDescription('Adds string to send in message')
            .setRequired(true)
        )
        .addUserOption( option =>
            option.setName('user')
            .setDescription('Grabs user for action')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        const message = interaction.options.getString('string');
        let user = interaction.options.getUser('user');

        let returnedMsg = message + `${user}`;

        if(!user) {
            returnedMsg = message;
        }
        
        await interaction.reply(returnedMsg);
    }
}