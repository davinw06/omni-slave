const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('throw')
        .setDescription('Throws an object at a user')
        .addUserOption( option => 
            option.setName('user')
            .setDescription('The user you want to throw an object at')
            .setRequired(true)
        )
        .addStringOption( option =>
            option.setName('custom-object')
            .setDescription('Type your own object to throw')
        )
        .addStringOption( option => 
            option.setName('object')
            .setDescription('The object you want to throw')
            .addChoices(
                {name: 'Shit', value:'a big piece of shit'}, 
                { name: 'Tampon' ,value:'a used tampon'}, 
                { name: 'Condom' ,value:'a used condom'}, 
                { name: 'Wet toilet paper' ,value:'a wet toilet paper from the trash'}, 
                { name: 'Stained Underwear' ,value:'a pair of shit-stained underwear(mens)'}, 
                { name: 'Cum sock' ,value:'an unusually sticky sock'}, 
                { name: 'Vomit' ,value: 'a bag of vomit'}, 
                { name: 'Dirty diaper' ,value: 'a diaper full of shit'},
                { name: 'Dildo', value: 'a gay man`s dildo' },
                { name: 'Dead Rat', value: 'a very smelly rat corpse' }
            )
        ),

        async execute(interaction) {
            let mentionedUser = interaction.options.getUser('user');
            const selectedObject = interaction.options.getString('object') || interaction.options.getString('custom-object');

            await interaction.reply ({
                content: `<@${interaction.user.id}> threw **${selectedObject.charAt(0) + selectedObject.slice(1)}** at <@${mentionedUser.id}>`
            });
        }
}