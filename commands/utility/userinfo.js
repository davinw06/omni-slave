const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MessageModel = require('../../Schemas.js/messageSchema');
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
        if (MessageModel && mongoose.connection.readyState === 1) {
            try {
                const count = await MessageModel.countDocuments({
                    userId: targetUser.id,
                    guildId: interaction.guild.id
                });
                messageCount = count;
            } catch (error) {
                console.error("Error fetching message count from MongoDB:", error);
                messageCount = 'Error fetching data';
            }
        } else {
             console.warn("MessageModel not loaded or Mongoose not connected. Cannot fetch message count.");
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

        let userEmbed = new EmbedBuilder()
            .setColor(accentColor)
            .setTitle(`Information for ${targetUser.displayName}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFields(fields)
            .setTimestamp(new Date())
            .setFooter({text: `Requested by ${interaction.user.displayName}`, icon_url: interaction.user.displayAvatarURL({ dynamic: true })})

        if (bannerUrl) {
            userEmbed.setImage(bannerUrl);
        } else {
            userEmbed.addFields({ name: 'Banner', value: 'No custom banner set.', inline: false });
        }

        await interaction.reply({embeds: [userEmbed]});
    },
};
