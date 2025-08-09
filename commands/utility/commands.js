const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// This is the commands command itself. It will read the file system and
// generate an embed with a list of all available commands.

module.exports = {
  // Command definition using SlashCommandBuilder
  // This is a common pattern for creating slash commands with Discord.js
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Lists all available commands.'),

  /**
   * The execute function is called when the user runs the /commands command.
   * @param {Interaction} interaction The interaction object from the Discord API.
   */
  async execute(interaction) {
    // Navigate up two directories to reach the /commands folder
    const commandsDir = path.join(__dirname, '..');

    // Dynamically get the command categories (subdirectories of /commands)
    const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Create a new EmbedBuilder
    const commandsEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Available Commands')
      .setDescription('Here is a list of all commands, organized by category.');

    // Loop through each category and build the embed fields
    for (const category of categories) {
      const categoryDir = path.join(commandsDir, category);
      const commandFiles = fs.readdirSync(categoryDir).filter(file => file.endsWith('.js'));

      let commandsList = '';
      
      for (const file of commandFiles) {
        const commandName = path.basename(file, '.js');
        const commandPath = path.join(categoryDir, file);
        const commandModule = require(commandPath);
        
        // Check if the command has subcommands
        if (commandModule.data && commandModule.data.options) {
            // Find the subcommands
            const subcommands = commandModule.data.options.filter(option => option.type === ApplicationCommandOptionType.Subcommand);
            
            if (subcommands.length > 0) {
                // Add the main command and then the indented subcommands
                commandsList += `\n- /${commandName}`;
                for (const subcommand of subcommands) {
                    commandsList += `\n  - ${subcommand.name}`;
                }
            } else {
                // If there are no subcommands, just list the command
                commandsList += `\n- /${commandName}`;
            }
        } else {
            // For all other commands, just add the file name as a list item
            commandsList += `\n- /${commandName}`;
        }
      }

      // Add a field for each category
      commandsEmbed.addFields({ 
        name: `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`, 
        value: commandsList.trim(), 
        inline: true 
      });
    }

    // Send the completed embed
    await interaction.reply({ embeds: [commandsEmbed] });
  },
};
