const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Builds an embed for testing')
        .addStringOption( option =>
            option.setName('title')
            .setDescription('Sets the title of the embed')
            .setRequired(false)
        )
        .addStringOption( option =>
            option.setName('description')
            .setDescription('Sets the description of the embed')
            .setRequired(false)
        )
        .addAttachmentOption( option =>
            option.setName('image')
            .setDescription('fills the ".setimage" portion of embed')
            .setRequired(false)
        )
        .addAttachmentOption( option =>
            option.setName('thumbnail')
            .setDescription('Sets the thumbnail for the embed')
            .setRequired(false)
        )
        .addStringOption( option =>
            option.setName('footer')
            .setDescription('Sets the footer for the embed')
            .setRequired(false)
        )
        .addBooleanOption( option =>
            option.setName('timestamp')
            .setDescription('Sets whether you want a timestamp to show up at the bottom of the embed')
            .setRequired(false)
        )
        .addAttachmentOption( option =>
            option.setName('footer-picture')
            .setDescription('sets footer icon if footer-icon is set to true')
            .setRequired(false)
        )
        .addUserOption( option =>
            option.setName('author')
            .setDescription('Sets user as author')
            .setRequired(false)
        )
        .addAttachmentOption( option =>
            option.setName('author-image')
            .setDescription('Sets author icon')
            .setRequired(false)
        )
        .addStringOption( option =>
            option.setName('color')
            .setDescription('Sets the color of the embed')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const image = interaction.options.getAttachment('image');
        const thumbnail = interaction.options.getAttachment('thumbnail');
        const footer = interaction.options.getString('footer');
        const timestampBOOL = interaction.options.getBoolean('timestamp');
        const footerPic = interaction.options.getAttachment('footer-picture');
        const author = interaction.options.getMember('author');
        const authorIcon = interaction.options.getAttachment('author-image');
        const color = interaction.options.getString('color')

        let embed = new EmbedBuilder();

        if(title) embed.setTitle(title);
        if(description) embed.setDescription(description);
        if(image) embed.setImage(image.url);
        if(thumbnail) embed.setThumbnail(thumbnail.url);
        if(footer) embed.setFooter({ text: footer, iconURL: footerPic ? footerPic.url : null });
        if(author) {
            const authorName = author.displayName;
            embed.setAuthor({ name: authorName, iconURL: authorIcon ? authorIcon.url : null });
        }
        if(color) embed.setColor(color);
        if(timestampBOOL === true) embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
    }
}