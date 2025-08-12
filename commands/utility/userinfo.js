const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const UserModel = require('../../Schemas.js/userSchema'); // Correctly import the User model
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Provides simplified information about a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get information about (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;

        await targetUser.fetch();

        const bannerUrl = targetUser.bannerURL({ size: 1024, format: 'png' });
        const accentColor = targetUser.hexAccentColor || '#2F3136';


        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id);
        } catch (error) {
            console.error(`Could not fetch member for user ${targetUser.id}:`, error);
        }

        let messageCount = 'Not available (DB not ready or logging not set up)';
        if (UserModel && mongoose.connection.readyState === 1) {
            try {
                // Find the user's document and get their messageCount
                const userDoc = await UserModel.findOne({ userId: targetUser.id });
                if (userDoc) {
                    messageCount = userDoc.messageCount;
                } else {
                    messageCount = 0; // User has no messages in the database
                }
            } catch (error) {
                console.error("Error fetching message count from MongoDB:", error);
                messageCount = 'Error fetching data';
            }
        } else {
             console.warn("UserModel not loaded or Mongoose not connected. Cannot fetch message count.");
        }

        const fields = [
            {
                name: 'ID',
                value: targetUser.id,
                inline: true,
            },
            {
                name: 'Display Name',
                value: targetMember ? targetMember.displayName : targetUser.username,
                inline: true,
            },
            {
                name: 'Username',
                value: targetUser.username,
                inline: true,
            },
            {
                name: 'Bot Account',
                value: targetUser.bot ? 'Yes' : 'No',
                inline: true,
            },
            {
                name: 'Total Messages Sent (Server)',
                value: messageCount.toString(),
                inline: true,
            },
        ];

        if (targetMember) {
            fields.push(
                {
                    name: 'Joined Server',
                    value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
                    inline: false,
                },
                { 
                    name: 'Created At', 
                    value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:F>`, 
                    inline: false 
                },
                {
                    name: 'Roles',
                    value: targetMember.roles.cache
                        .filter(role => role.id !== interaction.guild.id)
                        .map(role => `<@&${role.id}>`)
                        .join(', ') || 'None',
                    inline: false,
                }
            );
        }

        const avatar = targetUser.displayAvatarURL({ extension: 'png', size: 512 });
        const decoration = targetUser.avatarDecorationURL ? targetUser.avatarDecorationURL({ extension: 'png', size: 512 }) : null ;

        let userAvatar = avatar;
        let attachments = [];

        if(decoration) {
            const canvas = createCanvas(512, 512);
            const context = canvas.getContext('2d');

            const avCanvas = createCanvas(496, 496);
            const avContext = canvas.getContext('2d');

            avContext.beginPath();
            avContext.arc(256, 256, 256, 0, Math.PI * 2, true); // center (256,256), radius 256
            avContext.closePath();
            avContext.clip();

            const av = await loadImage(avatar);
            avContext.drawImage(av, 0, 0, 512, 512);

            context.drawImage(avCanvas, 0, 0, 512, 512);

            const decor = await loadImage(decoration);
            context.drawImage(decor, 0, 0, 512, 512);

            const buffer = canvas.toBuffer();
            const attachment = new AttachmentBuilder(buffer, {name: 'profile.png'});
            attachments.push(attachment);

            userAvatar = 'attachment://profile.png';
        }

        let userEmbed = new EmbedBuilder()
            .setColor(accentColor)
            .setTitle(`Information for ${targetUser.displayName}`)
            .setThumbnail(userAvatar)
            .setFields(fields)
            .setTimestamp(new Date())
            .setFooter({text: `Requested by ${interaction.user.displayName}`, icon_url: interaction.user.displayAvatarURL({ dynamic: true })})

        if (bannerUrl) {
            userEmbed.setImage(bannerUrl);
        } else {
            userEmbed.addFields({ name: 'Banner', value: 'No custom banner set.', inline: false });
        }

        await interaction.reply({embeds: [userEmbed], files: attachments});
    },
};
