const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDescription('Sends a notice to users')
        .addStringOption( option =>
            option.setName('title')
            .setDescription('Sets the title of the notice')
            .setRequired(true)
        )
        .addStringOption( option =>
            option.setName('message')
            .setDescription('Notice you want to send')
            .setRequired(true)
        )
        .addAttachmentOption( option => 
            option.setName('attachment')
            .setDescription('Image or file you want to attach to this notice')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        let noticeMessage = interaction.options.get('message').value;
        let noticeTitle = interaction.options.get('title').value;
        let noticeAttachment = interaction.options.getAttachment('attachment');

        const userAvatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        const noticeEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`***__${noticeTitle}__***`)
            .setDescription(noticeMessage)
            .setTimestamp()
            .setFooter({ text: `Notice by ${interaction.member.user.displayName} `, iconURL: userAvatarURL });

        if (noticeAttachment) {
            noticeEmbed.setImage(noticeAttachment.url);
        }

        await interaction.reply({embeds : [noticeEmbed] });

    },
};
