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

  const categoryChoices = Object.keys(categoryCommands).map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
  }));

  // Flatten all commands with category prefix for the command choices
  const allCommands = [];
  for (const [category, commands] of Object.entries(categoryCommands)) {
    for (const cmd of commands) {
      allCommands.push({
        name: `${category.charAt(0).toUpperCase() + category.slice(1)}: ${cmd}`,
        value: `${category}|${cmd}`,
      });
    }
  }
  const limitedCommands = allCommands.slice(0, 25);

  return {
    data: new SlashCommandBuilder()
      .setName('commands')
      .setDescription('Show commands by category or list all commands')
      .addStringOption(option =>
        option
          .setName('category')
          .setDescription('Select a command category (optional)')
          .setRequired(false)
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

      // Helper to load command module and get dataRaw safely
      function loadCommandData(cat, cmd) {
        try {
          const cmdPath = path.join(commandsDir, cat, `${cmd}.js`);
          delete require.cache[require.resolve(cmdPath)];
          const mod = require(cmdPath);
          if (!mod?.data) return null;
          return typeof mod.data.toJSON === 'function' ? mod.data.toJSON() : mod.data;
        } catch {
          return null;
        }
      }

      // If no category and no command: show full list with subcommands/groups
      if (!category && !commandValue) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('All Available Commands')
          .setDescription('Here is a list of all commands, organized by category with subcommands.');

        for (const [cat, cmds] of Object.entries(categoryCommands)) {
          const lines = [];

          for (const cmd of cmds) {
            const dataRaw = loadCommandData(cat, cmd);
            const options = Array.isArray(dataRaw?.options) ? dataRaw.options : [];

            const topSubcommands = options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand);
            const groups = options.filter(opt => opt.type === ApplicationCommandOptionType.SubcommandGroup);

            if (topSubcommands.length === 0 && groups.length === 0) {
              lines.push(`- /${cmd}`);
            } else {
              lines.push(`- /${cmd}`);
              for (const sub of topSubcommands) {
                lines.push(`  - /${cmd} ${sub.name}`);
              }
              for (const group of groups) {
                lines.push(`  - ${group.name}`);
                for (const sub of (group.options || [])) {
                  lines.push(`    - /${cmd} ${group.name} ${sub.name}`);
                }
              }
            }
          }

          embed.addFields({
            name: `Category: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
            value: lines.length > 0 ? lines.join('\n') : 'No commands found.',
            inline: true,
          });
        }

        await interaction.reply({ embeds: [embed], ephemeral: false });
        return;
      }

      // If category specified but no command, list commands in that category with subcommands/groups
      if (category && !commandValue) {
        const cmds = categoryCommands[category] || [];
        if (cmds.length === 0) {
          await interaction.reply({ content: `No commands found in category **${category}**.`, ephemeral: false });
          return;
        }

        const lines = [];
        for (const cmd of cmds) {
          const dataRaw = loadCommandData(category, cmd);
          const options = Array.isArray(dataRaw?.options) ? dataRaw.options : [];

          const topSubcommands = options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand);
          const groups = options.filter(opt => opt.type === ApplicationCommandOptionType.SubcommandGroup);

          if (topSubcommands.length === 0 && groups.length === 0) {
            lines.push(`- /${cmd}`);
          } else {
            lines.push(`- /${cmd}`);
            for (const sub of topSubcommands) {
              lines.push(`  - /${cmd} ${sub.name}`);
            }
            for (const group of groups) {
              lines.push(`  - ${group.name}`);
              for (const sub of (group.options || [])) {
                lines.push(`    - /${cmd} ${group.name} ${sub.name}`);
              }
            }
          }
        }

        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`Commands in category: ${category.charAt(0).toUpperCase() + category.slice(1)}`)
          .setDescription(lines.join('\n'));

        await interaction.reply({ embeds: [embed], ephemeral: false });
        return;
      }

      // If command specified, show detailed info (validate category match)
      if (commandValue) {
        const [cmdCategory, commandName] = commandValue.split('|');

        if (category && cmdCategory !== category) {
          await interaction.reply({
            content: 'The selected command does not belong to the selected category. Please choose matching category and command.',
            ephemeral: true,
          });
          return;
        }

        const dataRaw = loadCommandData(cmdCategory, commandName);
        if (!dataRaw) {
          await interaction.reply({ content: `Failed to load /${commandName} command.`, ephemeral: true });
          return;
        }

        const mainDescription = dataRaw.description || 'No description provided.';
        const options = Array.isArray(dataRaw.options) ? dataRaw.options : [];

        const lines = [`**/${commandName}** — ${mainDescription}`];

        const subcommands = options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand);
        for (const sub of subcommands) {
          lines.push(`• /${commandName} ${sub.name} — ${sub.description || 'No description provided.'}`);
        }

        const groups = options.filter(opt => opt.type === ApplicationCommandOptionType.SubcommandGroup);
        for (const group of groups) {
          lines.push(`**${group.name}** — ${group.description || 'No description provided.'}`);
          for (const sub of (group.options || [])) {
            lines.push(`    • /${commandName} ${group.name} ${sub.name} — ${sub.description || 'No description provided.'}`);
          }
        }

        const embed = new EmbedBuilder()
          .setColor('#00ff99')
          .setTitle(`Command Details: /${commandName}`)
          .setDescription(lines.join('\n'));

        await interaction.reply({ embeds: [embed], ephemeral: false });
        return;
      }

      // Fallback reply (should not be hit)
      await interaction.reply({ content: 'Invalid options.', ephemeral: true });
    },

    // No autocomplete since static choices
  };
})();
