const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Gets the avatar of a user')
        .addUserOption(option =>
            option.setName('user')
            .setDescription('User whose avatar you want to see')
            .setRequired(false)
        )
        .addBooleanOption( option =>
            option.setName('decoration')
            .setDescription('Check true if you want to see the user\'s decoration(if they have one)')
            .setRequired(false)
        ),
    async execute(interaction) {
        let user = interaction.options.getUser('user');
        if (!user) user = interaction.user;

        let decorBoolean = interaction.options.getBoolean('decoration');
        if(decorBoolean === null) decorBoolean = false;

        const avatar = user.displayAvatarURL({ extension: 'png', size: 1024 });
        const authorAvatarURL = interaction.user.displayAvatarURL({ extension: 'png', size: 1024 });
        const decoration = user.avatarDecorationURL ? user.avatarDecorationURL({ extension: 'png', size: 1024 }) : null ;

        let userAvatar = avatar;
        let attachments = [];
        const canvasSize = 1024;
        const avCanvasSize = 896;
        const avPosition = (canvasSize - avCanvasSize)/2;
        const avCtxArc = 456;

        if(decorBoolean === true) {
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
                const attachment = new AttachmentBuilder(buffer, {name: 'profile.png'});
                attachments.push(attachment);

                userAvatar = 'attachment://profile.png';

                const embed = new EmbedBuilder()
                    .setColor('#C70039')
                    .setTitle(`**${user.displayName}'s** Avatar`)
                    .setImage(userAvatar)
                    .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: authorAvatarURL })
                    .setTimestamp();

                try {
                    await interaction.reply({ embeds: [embed], files: attachments });
                } catch (error) {
                    console.error('Error replying to interaction:', error);
                    await interaction.followUp({ content: 'There was an error trying to fetch the avatar.', flags: MessageFlags.Ephemeral });
                }
            } else {
                userAvatar = avatar;

                const embed = new EmbedBuilder()
                    .setColor('#C70039')
                    .setTitle(`**${user.displayName}'s** Avatar`)
                    .setImage(userAvatar)
                    .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: authorAvatarURL })
                    .setTimestamp();
                try {
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error replying to interaction:', error);
                    await interaction.followUp({ content: 'There was an error trying to fetch the avatar.', flags: MessageFlags.Ephemeral });
                }
            }
        } else {
            userAvatar = avatar;

            const embed = new EmbedBuilder()
                .setColor('#C70039')
                .setTitle(`**${user.displayName}'s** Avatar`)
                .setImage(userAvatar)
                .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: authorAvatarURL })
                .setTimestamp();
            try {
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error replying to interaction:', error);
                await interaction.followUp({ content: 'There was an error trying to fetch the avatar.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};
