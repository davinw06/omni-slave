const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

function getAllCommands(commandsDir) {
  const commandsList = [];
  const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const category of categories) {
    const categoryDir = path.join(commandsDir, category);
    const commandFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const commandName = path.basename(file, '.js');
      commandsList.push({ name: commandName, category });
    }
  }
  return commandsList;
}

module.exports = (client => {
  const commandsDir = path.join(__dirname, '..');

  return {
    data: new SlashCommandBuilder()
      .setName('commands')
      .setDescription('Lists all available commands or shows details for one.')
      .addStringOption(option =>
        option
          .setName('details')
          .setDescription('Type a command name to view its description')
          .setAutocomplete(true)
      ),

    // Handle the main command execution
    async execute(interaction) {
      const details = interaction.options.getString('details');

      if (details) {
        // Show just that command's description
        const allCommands = getAllCommands(commandsDir);
        const foundCommand = allCommands.find(c => c.name.toLowerCase() === details.toLowerCase());

        if (!foundCommand) {
          await interaction.reply({ content: `Command \`${details}\` not found.`, ephemeral: true });
          return;
        }

        const commandPath = path.join(commandsDir, foundCommand.category, `${foundCommand.name}.js`);
        delete require.cache[require.resolve(commandPath)];
        const commandModule = require(commandPath);

        const dataRaw = commandModule?.data
          ? (typeof commandModule.data.toJSON === 'function' ? commandModule.data.toJSON() : commandModule.data)
          : null;

        const description = dataRaw?.description || 'No description provided.';
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00ff99')
              .setTitle(`/${foundCommand.name}`)
              .setDescription(description)
          ]
        });
        return;
      }

      // Otherwise, show full list
      const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      const commandsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Available Commands')
        .setDescription('Here is a list of all commands, organized by category.');

      for (const category of categories) {
        const categoryDir = path.join(commandsDir, category);
        const commandFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.js'));

        const commandsListLines = [];

        for (const file of commandFiles) {
          const commandName = path.basename(file, '.js');
          const commandPath = path.join(categoryDir, file);

          try { delete require.cache[require.resolve(commandPath)]; } catch {}
          let commandModule;
          try { commandModule = require(commandPath); } catch {
            commandsListLines.push(`- /${commandName} (failed to load)`);
            continue;
          }

          const dataRaw = commandModule?.data
            ? (typeof commandModule.data.toJSON === 'function' ? commandModule.data.toJSON() : commandModule.data)
            : null;

          const options = Array.isArray(dataRaw?.options) ? dataRaw.options : [];

          if (options.length === 0) {
            commandsListLines.push(`- /${commandName}`);
            continue;
          }

          const topSubcommands = options.filter(opt =>
            opt.type === ApplicationCommandOptionType.Subcommand
          );
          const groups = options.filter(opt =>
            opt.type === ApplicationCommandOptionType.SubcommandGroup
          );

          if (topSubcommands.length === 0 && groups.length === 0) {
            commandsListLines.push(`- /${commandName}`);
            continue;
          }

          commandsListLines.push(`- /${commandName}`);
          for (const sub of topSubcommands) {
            commandsListLines.push(`  - /${commandName} ${sub.name}`);
          }
          for (const group of groups) {
            commandsListLines.push(`  - ${group.name}`);
            const groupOptions = Array.isArray(group.options) ? group.options : [];
            for (const sub of groupOptions) {
              commandsListLines.push(`    - /${commandName} ${group.name} ${sub.name}`);
            }
          }
        }

        const value = commandsListLines.length > 0 ? commandsListLines.join('\n') : 'No commands found';
        commandsEmbed.addFields({
          name: `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          value,
          inline: true,
        });
      }

      await interaction.reply({ embeds: [commandsEmbed] });
    },

    // Handle autocomplete suggestions
    async autocomplete(interaction) {
      const focusedValue = interaction.options.getFocused();
      const allCommands = getAllCommands(commandsDir);

      const filtered = allCommands
        .filter(c => c.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25) // Discord limit
        .map(c => ({
          name: `/${c.name} (${c.category})`,
          value: c.name
        }));

      await interaction.respond(filtered);
    }
  };
})();
