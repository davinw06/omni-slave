const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('lying') // The command name, so you'd call it with `?lying`
        .setDescription('Determines if someone (or something) is lying!')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('The user you want to find out if they`re lying')
            .setRequired(false)
        ),

    async execute(interaction, args) {
        // Define an array of possible "lying" responses
        let mentionedUser = interaction.options.getUser('user');
        if(!mentionedUser) mentionedUser = interaction.user;

        const mentionedUserAvatarURL = mentionedUser.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        let lyingembedcolor;

        const responses = [
            "Bro is DEFINITELY lying... don't trust another word.",
            "Yea this person is fucking lying.",
            "Brodie's pants is on fire😭",
        ];

        // Define an array of possible "not lying" responses (to add variety)
        const notLyingResponses = [
            "Bro is VALID asf.",
            "Vro was, in fact, not lying.",
            "He ain't lying lil bro",
        ];

        // Pick a random response from the "lying" array
        let response = respond = responses[Math.floor(Math.random() * responses.length)];

        // Optionally, make it sometimes say they're NOT lying for a twist
        const randomChance = Math.random(); // Generates a number between 0 and 1
        if (randomChance < 0.4) {
            response = notLyingResponses[Math.floor(Math.random() * notLyingResponses.length)];
            lyingembedcolor = '00EE00';
        } else {
            lyingembedcolor = 'FF0000';
        }

        const embed = new EmbedBuilder()
            .setColor(lyingembedcolor) // Red for "lying" theme
            .setTitle('Was bro really lying?')
            .setThumbnail(mentionedUserAvatarURL)
            .setDescription(`${mentionedUser}${response}`)
            .setFooter({ text: 'Is bro cooked?' })
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    },
};