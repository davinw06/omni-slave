const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

function getCommandsByCategory(commandsDir) {
  const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const categoryCommands = {};

  for (const category of categories) {
    const categoryDir = path.join(commandsDir, category);
    const commandFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.js'));

    categoryCommands[category] = commandFiles.map(file => path.basename(file, '.js'));
  }

  return categoryCommands;
}

module.exports = (client => {
  const commandsDir = path.join(__dirname, '..');
  const categoryCommands = getCommandsByCategory(commandsDir);

  // Prepare choices for categories
  const categoryChoices = Object.keys(categoryCommands).map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
  }));

  // Flatten all commands into one list with category prefix for the command choices
  const allCommands = [];
  for (const [category, commands] of Object.entries(categoryCommands)) {
    for (const cmd of commands) {
      allCommands.push({
        name: `${category.charAt(0).toUpperCase() + category.slice(1)}: ${cmd}`,
        value: `${category}|${cmd}`, // combine category and command for easy splitting later
      });
    }
  }

  // Limit commands to 25 because of Discord limit
  const limitedCommands = allCommands.slice(0, 25);

  return {
    data: new SlashCommandBuilder()
      .setName('commands')
      .setDescription('Show commands by category and command name')
      .addStringOption(option =>
        option
          .setName('category')
          .setDescription('Select a command category')
          .setRequired(true)
          .addChoices(...categoryChoices)
      )
      .addStringOption(option =>
        option
          .setName('command')
          .setDescription('Select a command (optional)')
          .setRequired(false)
          .addChoices(...limitedCommands)
      ),

    async execute(interaction) {
      const category = interaction.options.getString('category');
      const commandValue = interaction.options.getString('command');

      if (!category) {
        await interaction.reply({ content: 'Please select a category.', ephemeral: true });
        return;
      }

      if (!commandValue) {
        // List all commands in the category
        const commandsInCategory = categoryCommands[category] || [];

        if (commandsInCategory.length === 0) {
          await interaction.reply({ content: `No commands found in category **${category}**.`, ephemeral: true });
          return;
        }

        const commandsList = commandsInCategory.map(cmd => `- /${cmd}`).join('\n');

        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`Commands in category: ${category.charAt(0).toUpperCase() + category.slice(1)}`)
          .setDescription(commandsList);

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // commandValue is like "category|command"
      const [cmdCategory, commandName] = commandValue.split('|');

      if (cmdCategory !== category) {
        await interaction.reply({ content: `Selected command does not belong to selected category. Please choose matching category and command.`, ephemeral: true });
        return;
      }

      const commandPath = path.join(commandsDir, cmdCategory, `${commandName}.js`);

      try {
        delete require.cache[require.resolve(commandPath)];
      } catch {}

      let commandModule;
      try {
        commandModule = require(commandPath);
      } catch (err) {
        await interaction.reply({ content: `Failed to load /${commandName} command.`, ephemeral: true });
        return;
      }

      const dataRaw = commandModule?.data
        ? (typeof commandModule.data.toJSON === 'function' ? commandModule.data.toJSON() : commandModule.data)
        : null;

      const mainDescription = dataRaw?.description || 'No description provided.';
      const options = Array.isArray(dataRaw?.options) ? dataRaw.options : [];

      const lines = [`**/${commandName}** — ${mainDescription}`];

      // Top-level subcommands with descriptions
      const subcommands = options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand);
      for (const sub of subcommands) {
        lines.push(`• /${commandName} ${sub.name} — ${sub.description || 'No description provided.'}`);
      }

      // Subcommand groups with descriptions
      const groups = options.filter(opt => opt.type === ApplicationCommandOptionType.SubcommandGroup);
      for (const group of groups) {
        lines.push(`**${group.name}** — ${group.description || 'No description provided.'}`);
        for (const sub of (group.options || [])) {
          lines.push(`    • /${commandName} ${group.name} ${sub.name} — ${sub.description || 'No description provided.'}`);
        }
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle(`Command Details: /${commandName}`)
            .setDescription(lines.join('\n'))
        ]
      });
    },

    // Removed autocomplete entirely as requested
  };
})();
