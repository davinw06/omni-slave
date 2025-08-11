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

  // Build SlashCommandBuilder with subcommand groups and subcommands properly
  const commandBuilder = new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Lists all available commands or shows details for one.');

  for (const [category, commands] of Object.entries(categoryCommands)) {
    commandBuilder.addSubcommandGroup(group => {
      group
        .setName(category.toLowerCase())
        .setDescription(`Commands in the ${category} category`);

      for (const cmd of commands) {
        group.addSubcommand(sub =>
          sub
            .setName(cmd.toLowerCase())
            .setDescription(`Show details for /${cmd}`)
        );
      }

      return group;
    });
  }

  return {
    data: commandBuilder,

    async execute(interaction) {
      // Extract selected subcommand group and subcommand
      const category = interaction.options.getSubcommandGroup(false);
      const commandName = interaction.options.getSubcommand(false);

      if (!category || !commandName) {
        // Fallback: list all commands grouped by category
        const categories = Object.keys(categoryCommands);

        const commandsEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Available Commands')
          .setDescription('Here is a list of all commands, organized by category.');

        for (const cat of categories) {
          const cmds = categoryCommands[cat];
          const lines = cmds.map(cmd => `- /${cmd}`).join('\n') || 'No commands found';

          commandsEmbed.addFields({
            name: `Category: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
            value: lines,
            inline: true,
          });
        }

        await interaction.reply({ embeds: [commandsEmbed], ephemeral: true });
        return;
      }

      // Load command module dynamically
      const commandPath = path.join(commandsDir, category, `${commandName}.js`);

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

    // Autocomplete removed since not needed with this structure
  };
})();
