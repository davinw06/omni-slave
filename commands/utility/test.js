const { SlashCommandBuilder, Client, IntentsBitField, MessageFlags, Ephemeral } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Replies with Here!"),
    async execute(interaction) {
        await interaction.reply("Here!");
    }
}
