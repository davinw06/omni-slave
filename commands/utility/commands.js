const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Dynamically load command choices for the details option
function getCommandChoices(commandsDir) {
  const choices = [];
  const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const category of categories) {
    const categoryDir = path.join(commandsDir, category);
    const commandFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const commandName = path.basename(file, '.js');
      choices.push({ name: `/${commandName}`, value: commandName });
    }
  }
  return choices;
}

module.exports = (client => {
  const commandsDir = path.join(__dirname, '..');
  const commandChoices = getCommandChoices(commandsDir);

  return {
    data: new SlashCommandBuilder()
      .setName('commands')
      .setDescription('Lists all available commands or shows details for one.')
      .addStringOption(option =>
        option
          .setName('details')
          .setDescription('Select a command to view its description')
          .addChoices(...commandChoices)
      ),

    async execute(interaction) {
      const details = interaction.options.getString('details');

      // If user asked for a specific command's details
      if (details) {
        let found = false;

        const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        for (const category of categories) {
          const categoryDir = path.join(commandsDir, category);
          const commandFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.js'));

          for (const file of commandFiles) {
            const commandName = path.basename(file, '.js');
            if (commandName === details) {
              const commandPath = path.join(categoryDir, file);
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
                    .setTitle(`/${commandName}`)
                    .setDescription(description)
                ]
              });
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          await interaction.reply({ content: `No description found for /${details}.`, ephemeral: true });
        }
        return;
      }

      // Otherwise, run your existing list-all behavior
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
  };
})();
