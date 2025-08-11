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

  // Prepare command choices per category for the 'command' option (flattened commands from all categories, max 25)
  // Since we want commands per category, we'll only add commands from all categories, but can't do dynamic filtering here
  const allCommands = [];
  for (const [category, commands] of Object.entries(categoryCommands)) {
    for (const cmd of commands) {
      allCommands.push({
        name: `${category.charAt(0).toUpperCase() + category.slice(1)}: ${cmd}`,
        value: `${category}|${cmd}`, // store category and command for parsing later
      });
    }
  }

  // Limit to 25 to obey Discord API limits
  const limitedCommands = allCommands.slice(0, 25);

  return {
    data: new SlashCommandBuilder()
      .setName('commands')
      .setDescription('Show commands by category or list all commands')
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

      // If user did not pick a command, list ALL commands from ALL categories
      if (!commandValue) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('All Available Commands')
          .setDescription('Here is a list of all commands, organized by category.');

        for (const [cat, cmds] of Object.entries(categoryCommands)) {
          const cmdsText = cmds.length > 0 ? cmds.map(c => `- /${c}`).join('\n') : 'No commands found.';
          embed.addFields({
            name: `Category: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
            value: cmdsText,
            inline: true,
          });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // User selected a command; parse category and command from value
      const [cmdCategory, commandName] = commandValue.split('|');

      if (cmdCategory !== category) {
        await interaction.reply({
          content: 'The selected command does not belong to the selected category. Please choose matching category and command.',
          ephemeral: true,
        });
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

      // Show subcommands if any
      const subcommands = options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand);
      for (const sub of subcommands) {
        lines.push(`• /${commandName} ${sub.name} — ${sub.description || 'No description provided.'}`);
      }

      // Show subcommand groups if any
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
            .setDescription(lines.join('\n')),
        ],
      });
    },

    // No autocomplete since you want static choices
  };
})();
