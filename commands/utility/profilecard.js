const { EmbedBuilder, SlashCommandBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

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
            // Fetch the user's basic info
            await user.fetch();

            const bannerUrl = user.bannerURL({ size: 1024, format: 'png' });
            const accentColor = user.hexAccentColor || '#000000'; // Default black if no accent

            const avatar = user.displayAvatarURL({ extension: 'png', size: 512 });
            const decoration = user.avatarDecorationURL ? user.avatarDecorationURL({ extension: 'png', size: 512 }) : null;

            let userAvatar = avatar;
            let attachments = [];
            const canvasSize = 512;
            const avCanvasSize = 456;
            const avPosition = (canvasSize - avCanvasSize)/2;
            const avCtxArc = 200;

            if (decoration) {
                const canvas = createCanvas(canvasSize, canvasSize);
                const context = canvas.getContext('2d');

                const avCanvas = createCanvas(avCanvasSize, avCanvasSize);
                const avContext = avCanvas.getContext('2d');

                avContext.beginPath();
                avContext.arc(avCtxArc, avCtxArc, avCtxArc, 0, Math.PI * 2, true);
                avContext.closePath();
                avContext.clip();

                const av = await loadImage(avatar);
                avContext.drawImage(av, 0, 0, avCanvasSize, avCanvasSize);

                context.drawImage(avCanvas, avPosition, avPosition, avCanvasSize, avCanvasSize);

                const decor = await loadImage(decoration);
                context.drawImage(decor, 0, 0, canvasSize, canvasSize);

                const buffer = canvas.toBuffer();
                const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
                attachments.push(attachment);

                userAvatar = 'attachment://profile.png';
            }

            const profileEmbed = new EmbedBuilder()
                .setColor(accentColor)
                .setTitle(`Profile Card for ${user.username}`) // user.displayName doesn't exist on User, use username
                .setThumbnail(userAvatar)
                .addFields(
                    { name: 'User ID', value: user.id, inline: true },
                    { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`, inline: false }
                )
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            if (bannerUrl) {
                profileEmbed.setImage(bannerUrl);
            } else {
                profileEmbed.addFields({ name: 'Banner', value: 'No custom banner set.', inline: false });
            }

            await interaction.reply({ embeds: [profileEmbed], files: attachments });
        } catch (error) {
            console.error(`Failed to fetch user ${user.tag}:`, error);
            return interaction.reply({ content: `Could not retrieve full profile for ${user.tag}. They might not exist or there was an API error.`, flags: MessageFlags.Ephemeral });
        }
    },
};
