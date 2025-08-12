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

        const avatar = user.displayAvatarURL({ extension: 'png', size: 512 });
        const decoration = user.avatarDecorationURL ? user.avatarDecorationURL({ extension: 'png', size: 512 }) : null ;

        let userAvatar = avatar;
        let attachments = [];

        if(decoration) {
            const canvas = createCanvas(512, 512);
            const context = canvas.getContext('2d');

            const avCanvas = createCanvas(400, 400);
            const avContext = avCanvas.getContext('2d');

            avContext.beginPath();
            avContext.arc(200, 200, 200, 0, Math.PI * 2, true); // center (256,256), radius 256
            avContext.closePath();
            avContext.clip();

            const av = await loadImage(avatar);
            avContext.drawImage(av, 0, 0, 400, 400);

            context.drawImage(avCanvas, 56, 56, 400, 400);

            const decor = await loadImage(decoration);
            context.drawImage(decor, 0, 0, 512, 512);

            const buffer = canvas.toBuffer();
            const attachment = new AttachmentBuilder(buffer, {name: 'profile.png'});
            attachments.push(attachment);

            userAvatar = 'attachment://profile.png';
        }

        const profileEmbed = new EmbedBuilder()
            .setColor(accentColor) // Set the embed color to the user's accent color
            .setTitle(`Profile Card for ${user.displayName}`) // Use displayName for a cleaner look
            .setThumbnail(userAvatar) // User's avatar as thumbnail
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
        interaction.reply({ embeds: [profileEmbed], files: attachments });
    },
};
