const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// This command reads the /commands folder structure and builds an embed
// showing commands, subcommands, and subcommand-groups with proper indentation.

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Lists all available commands.'),

  async execute(interaction) {
    // Adjust this if your commands directory is in a different place
    const commandsDir = path.join(__dirname, '..');

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

      // We'll build the category value as lines, then join with newlines
      const commandsListLines = [];

      for (const file of commandFiles) {
        const commandName = path.basename(file, '.js');
        const commandPath = path.join(categoryDir, file);

        // Try to reload the module in case it changed while the bot is running
        try {
          delete require.cache[require.resolve(commandPath)];
        } catch (e) {
          // ignore
        }

        let commandModule;
        try {
          commandModule = require(commandPath);
        } catch (err) {
          // If a command file has a runtime error, skip it but keep listing the filename
          commandsListLines.push(`- /${commandName} (failed to load)`);
          continue;
        }

        // Extract the raw data object. SlashCommandBuilder instances have toJSON().
        const dataRaw = commandModule?.data
          ? (typeof commandModule.data.toJSON === 'function' ? commandModule.data.toJSON() : commandModule.data)
          : null;

        const options = Array.isArray(dataRaw?.options) ? dataRaw.options : [];

        // If no options at all, treat it as a simple command
        if (options.length === 0) {
          commandsListLines.push(`- /${commandName}`);
          continue;
        }

        // Identify top-level subcommands and subcommand-groups
        const topSubcommands = options.filter(opt =>
          opt.type === ApplicationCommandOptionType.Subcommand || String(opt.type) === String(ApplicationCommandOptionType.Subcommand)
        );

        const groups = options.filter(opt =>
          opt.type === ApplicationCommandOptionType.SubcommandGroup || String(opt.type) === String(ApplicationCommandOptionType.SubcommandGroup)
        );

        // If there are no subcommands/groups (options are flags/args), list as a normal command
        if (topSubcommands.length === 0 && groups.length === 0) {
          commandsListLines.push(`- /${commandName}`);
          continue;
        }

        // Add main command header
        commandsListLines.push(`- /${commandName}`);

        // Add top-level subcommands (indented by two spaces)
        for (const sub of topSubcommands) {
          // Some builders may omit `type` on nested objects, but `name` should exist
          commandsListLines.push(`  - /${commandName} ${sub.name}`);
        }

        // Add groups and their subcommands (group name, then subcommands indented further)
        for (const group of groups) {
          commandsListLines.push(`  - ${group.name}`);
          const groupOptions = Array.isArray(group.options) ? group.options : [];

          for (const sub of groupOptions) {
            // Treat any option under a group as a subcommand
            commandsListLines.push(`    - /${commandName} ${group.name} ${sub.name}`);
          }
        }
      }

      const value = commandsListLines.length > 0 ? commandsListLines.join('\n') : 'No commands found';

      // Add the category field. Keep inline: true to keep a compact embed (same as original).
      commandsEmbed.addFields({
        name: `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        value,
        inline: true,
      });
    }

    await interaction.reply({ embeds: [commandsEmbed] });
  },
};