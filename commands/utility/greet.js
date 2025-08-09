const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("greet")
        .setDescription("Bot greets User")
        .addUserOption( option =>
            option
                .setName('user')
                .setDescription('The user to greet')
                .setRequired(false)
        ),
    async execute(interaction) {
        let user = interaction.options.getUser('user');
        if(!user) user = interaction.user;
        interaction.reply(`Yoo what's good <@${user.id}>? Bend over real quick.`);
    }
}
