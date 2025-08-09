const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profilecard')
        .setDescription('Displays a user\'s profile card with banner, accent color, and bio.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to display the profile card for (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        try {
            // Fetch the user's full profile to get banner, accent color, and bio
            await user.fetch();
            // Log the user's bio to the console for debugging
            console.log(`[ProfileCard] Fetched bio for ${user.tag}: "${user.bio}"`);
        } catch (error) {
            console.error(`Failed to fetch user ${user.tag}:`, error);
            return interaction.reply({ content: `Could not retrieve full profile for ${user.tag}. They might not exist or there was an API error.`, flags: MessageFlags.Ephemeral });
        }

        const bannerUrl = user.bannerURL({ size: 1024, format: 'png' });
        const accentColor = user.hexAccentColor || '#000000'; // Default to black if no accent color

        const profileEmbed = new EmbedBuilder()
            .setColor(accentColor) // Set the embed color to the user's accent color
            .setTitle(`Profile Card for ${user.displayName}`) // Use displayName for a cleaner look
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 })) // User's avatar as thumbnail
            .addFields(
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Created At', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        // Add the user's bio if it exists
        if (user.bio) { // The 'bio' property contains the user's About Me text
            profileEmbed.addFields({ name: 'About Me', value: user.bio, inline: false });
        } else {
            profileEmbed.addFields({ name: 'About Me', value: 'No bio set.', inline: false });
        }

        // Add the banner image if it exists
        if (bannerUrl) {
            profileEmbed.setImage(bannerUrl); // Set the embed image to the user's banner
        } else {
            profileEmbed.addFields({ name: 'Banner', value: 'No custom banner set.', inline: false });
        }

        // Reply to the interaction
        interaction.reply({ embeds: [profileEmbed] });
    },
};
