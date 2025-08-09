// commands/relationships.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Embed, MessageFlags, ComponentType, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const Relationship = require('../../Schemas.js/relationshipSchema'); // Adjust the path to your Relationship model
const mongoose = require('mongoose'); // Used to check MongoDB connection status
const { createCanvas, loadImage, registerFont } = require('canvas'); // Import canvas library for image manipulation

// Register a font with wide Unicode support to handle more characters.
// This is an optional step but can improve rendering for some special characters.
// It's still not a full solution for all custom fonts.
try {
    registerFont('./fonts/Arial-Regular.ttf', { family: 'Arial' });
} catch (e) {
    // This might fail if the font file isn't present, so we'll just continue.
    console.error("Could not register Noto Sans font. Proceeding with default font.");
}


// Function to sanitize text by replacing custom font characters with standard ones
const sanitizeText = (text) => {
    // This is a simple but effective way to handle some common custom font styles.
    // It maps characters from various Unicode ranges back to their ASCII equivalents.
    // We'll focus on a few common styles for now.
    let sanitizedText = text;

    // Bold, Italic, and other stylistic letters
    sanitizedText = sanitizedText.replace(/[\u{1D400}-\u{1D7FF}]/gu, (char) => {
        const codePoint = char.codePointAt(0);
        // A, B, C...
        if (codePoint >= 0x1d434 && codePoint <= 0x1d467) return String.fromCodePoint(codePoint - 0x1d434 + 65);
        // a, b, c...
        if (codePoint >= 0x1d468 && codePoint <= 0x1d49B) return String.fromCodePoint(codePoint - 0x1d468 + 97);
        // A, B, C... (italic)
        if (codePoint >= 0x1d49c && codePoint <= 0x1d4cf) return String.fromCodePoint(codePoint - 0x1d49c + 65);
        // a, b, c... (italic)
        if (codePoint >= 0x1d4d0 && codePoint <= 0x1d503) return String.fromCodePoint(codePoint - 0x1d4d0 + 97);
        // and so on for other styles...
        return char;
    });

    // Cursive/Gothic fonts like 𝕮𝖔𝖈𝖆𝖎𝖓𝖊 𝖕𝖆𝖕𝖎
    const gothicMap = {
        '𝕬': 'A', '𝕭': 'B', '𝕮': 'C', '𝕯': 'D', '𝕰': 'E', '𝕱': 'F', '𝕲': 'G', '𝕳': 'H', '𝕴': 'I', '𝕵': 'J', '𝕶': 'K', '𝕷': 'L', '𝕸': 'M', '𝕹': 'N', '𝕺': 'O', '𝕻': 'P', '𝕼': 'Q', '𝕽': 'R', '𝕾': 'S', '𝕿': 'T', '𝖀': 'U', '𝖁': 'V', '𝖂': 'W', '𝖃': 'X', '𝖄': 'Y', '𝖅': 'Z',
        '𝖆': 'a', '𝖇': 'b', '𝖈': 'c', '𝖉': 'd', '𝖊': 'e', '𝖋': 'f', '𝖌': 'g', '𝖍': 'h', '𝖎': 'i', '𝖏': 'j', '𝖐': 'k', '𝖑': 'l', '𝖒': 'm', '𝖓': 'n', '𝖔': 'o', '𝖕': 'p', '𝖖': 'q', '𝖗': 'r', '𝖘': 's', '𝖙': 't', '𝖚': 'u', '𝖛': 'v', '𝖜': 'w', '𝖝': 'x', '𝖞': 'y', '𝖟': 'z'
    };
    for (const [key, value] of Object.entries(gothicMap)) {
        sanitizedText = sanitizedText.replaceAll(key, value);
    }

    return sanitizedText;
};


module.exports = {
    // Define the slash command using SlashCommandBuilder
    data: new SlashCommandBuilder()
        .setName('relationships')
        .setDescription('Manage your relationships in the server')
        // Propose subcommand: Allows a user to propose marriage to another user
        .addSubcommand(subcommand =>
            subcommand
                .setName('propose')
                .setDescription('Propose marriage to another user. 💍')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user you want to propose to.')
                        .setRequired(true)))
        // Divorce subcommand: Allows a user to divorce a specific partner
        .addSubcommand(subcommand =>
            subcommand
                .setName('divorce')
                .setDescription('Divorce your current partner. 🥀�')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The partner you want to divorce.')
                        .setRequired(true)))
        // Divorceall subcommand: Allows a user to divorce all partners
        .addSubcommand(subcommand =>
            subcommand
                .setName('divorceall')
                .setDescription('Divorce all your partners. 🥀💔💔'))
        // Adopt subcommand: Allows a user to adopt another user
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopt')
                .setDescription('Adopt another user as your child. 👶')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user you want to adopt.')
                        .setRequired(true)))
        // Disown subcommand: Allows a user to disown an adopted child
        .addSubcommand(subcommand =>
            subcommand
                .setName('disown')
                .setDescription('Disown one of your adopted children. 🚶‍♀️')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The child you want to disown.')
                        .setRequired(true)))
        // Disownall subcommand: Allows a user to disown all adopted children
        .addSubcommand(subcommand =>
            subcommand
                .setName('disownall')
                .setDescription('Disown all your adopted children. 🚶‍♀️🚶‍♂️'))
        // Hug subcommand: Simple interaction
        .addSubcommand(subcommand =>
            subcommand
                .setName('hug')
                .setDescription('Give another user a hug! 🤗... you fucking weirdo..')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user you want to hug.')
                        .setRequired(true)))
        // Kiss subcommand: Simple interaction
        .addSubcommand(subcommand =>
            subcommand
                .setName('kiss')
                .setDescription('Give another user a kiss! 💋... wow... you really are desparate')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user you want to kiss.')
                        .setRequired(true)))
        // Slap subcommand: Simple interaction
        .addSubcommand(subcommand =>
            subcommand
                .setName('slap')
                .setDescription('Slap another user! 👋.. they deserve it.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user you want to slap.')
                        .setRequired(true)))
        
        .addSubcommand( subcommand =>
            subcommand.setName('touch')
            .setDescription('Touches another user... inappropriately.😈')
            .addUserOption( option =>
                option.setName('target')
                .setDescription('User you want to touch.')
                .setRequired(true)
            )
        )
        .addSubcommand( subcommand =>
            subcommand.setName('cuddle')
            .setDescription('Cuddles another user... while fully erect ofc😌')
            .addUserOption( option =>
                option.setName('target')
                .setDescription('User you want to cuddle with.')
                .setRequired(true)
            )
        )
        // New user commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('runaway')
                .setDescription('Abandon all your spouses, children, and parents. 🏃‍♀️'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ask-to-be-parent')
                .setDescription('Ask another user to adopt you. 🥺')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user you want to ask to adopt you.')
                        .setRequired(true)))
        // Family Tree subcommand: Visualize the family tree
        .addSubcommand(subcommand =>
            subcommand
                .setName('familytree')
                .setDescription('Generate a visual family tree for yourself or another user. 👨‍👩‍👧‍👦')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to view the family tree for.')
                        .setRequired(false)))
        // Admin-only subcommands group
        .addSubcommandGroup(group =>
            group
                .setName('admin')
                .setDescription('Admin-only relationship management commands.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('force-marry')
                        .setDescription('[ADMIN] Force a marriage between two users.')
                        .addUserOption(option =>
                            option.setName('user1')
                                .setDescription('The first user.')
                                .setRequired(true))
                        .addUserOption(option =>
                            option.setName('user2')
                                .setDescription('The second user.')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('force-divorce')
                        .setDescription('[ADMIN] Force a divorce between two users.')
                        .addUserOption(option =>
                            option.setName('user1')
                                .setDescription('The first user.')
                                .setRequired(true))
                        .addUserOption(option =>
                            option.setName('user2')
                                .setDescription('The second user.')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('force-adopt')
                        .setDescription('[ADMIN] Force a user to adopt another.')
                        .addUserOption(option =>
                            option.setName('parent')
                                .setDescription('The user who will be the parent.')
                                .setRequired(true))
                        .addUserOption(option =>
                            option.setName('child')
                                .setDescription('The user who will be the child.')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('force-disown')
                        .setDescription('[ADMIN] Force a user to disown a child.')
                        .addUserOption(option =>
                            option.setName('parent')
                                .setDescription('The user who will disown the child.')
                                .setRequired(true))
                        .addUserOption(option =>
                            option.setName('child')
                                .setDescription('The user who will be disowned.')
                                .setRequired(true))))
    ,
    // The execute function runs when the command is called
    async execute(interaction) {
        // Check if MongoDB is connected before proceeding
        if (mongoose.connection.readyState !== 1) {
            await interaction.reply({ content: '❌ Database is not connected. Please try again later.', flags: MessageFlags.Ephemeral });
            return;
        }

        const RoleID = '1380459360207114341';
        const AgeRoleID = '1379700883398332497';
        const MaleRoleId = '1379632668689563678';
        const FemaleRoleId = '1379632424962621511';
        const subcommand = interaction.options.getSubcommand();
        const initiator = interaction.member; // The user who ran the command
        const target = interaction.options.getMember('target'); // The target user for the subcommand
        let targetAvatar = target?.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 });
        let initiatorAvatar = initiator.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

        // Prevent users from targeting themselves for relationship actions
        if (target && initiator.id === target.id) {
            return interaction.reply({ content: 'I dont think this is what they meant by love yourself...', flags: MessageFlags.Ephemeral });
        }

        // Helper function to check if two users are currently married
        const areMarried = async (user1Id, user2Id) => {
            const marriage = await Relationship.findOne({
                type: 'marriage',
                status: 'accepted',
                $or: [
                    { initiatorId: user1Id, targetId: user2Id },
                    { initiatorId: user2Id, targetId: user1Id }
                ]
            });
            return !!marriage;
        };

        // Helper function to check if a user is a parent of another (adoption)
        const isParentOf = async (parentId, childId) => {
            const adoption = await Relationship.findOne({
                type: 'adoption',
                status: 'accepted',
                initiatorId: parentId,
                targetId: childId
            });
            return !!adoption;
        };

        // Handle different subcommands
        switch (subcommand) {
            case 'propose':
                {
                    // Check for existing pending proposals between the two users
                    const existingProposal = await Relationship.findOne({
                        type: 'proposal',
                        status: 'pending',
                        $or: [
                            { initiatorId: initiator.id, targetId: target.id },
                            { initiatorId: target.id, targetId: initiator.id }
                        ]
                    });

                    if (existingProposal) {
                        return interaction.reply({ content: `⏳ ${target.displayName} already has a pending proposal from you, or you have one from them!`, flags: MessageFlags.Ephemeral });
                    }

                    // Check if either user is already married to the target
                    if (await areMarried(initiator.id, target.id)) {
                        return interaction.reply({ content: `🚫 You are already married to ${target.displayName}!`, flags: MessageFlags.Ephemeral });
                    }

                    // Check if the initiator is already married to anyone else
                    const initiatorMarriages = await Relationship.find({
                        type: 'marriage',
                        status: 'accepted',
                        $or: [{ initiatorId: initiator.id }, { targetId: initiator.id }]
                    });
                    if (initiatorMarriages.length > 0) {
                        return interaction.reply({ content: `🚫 You are already married to someone else. You must divorce them first to propose!`, flags: MessageFlags.Ephemeral });
                    }

                    // Check if the target is already married to anyone else
                    const targetMarriages = await Relationship.find({
                        type: 'marriage',
                        status: 'accepted',
                        $or: [{ initiatorId: target.id }, { targetId: target.id }]
                    });
                    if (targetMarriages.length > 0) {
                        return interaction.reply({ content: `🚫 ${target.displayName} is already married to someone else.`, flags: MessageFlags.Ephemeral });
                    }

                    // Create a new pending marriage proposal
                    const proposal = new Relationship({
                        initiatorId: initiator.id,
                        targetId: target.id,
                        type: 'proposal',
                        status: 'pending'
                    });
                    await proposal.save();

                    // Create buttons for accepting or declining the proposal
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`accept_proposal_${proposal._id}`) // Custom ID for button interaction
                                .setLabel('Accept')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`decline_proposal_${proposal._id}`) // Custom ID for button interaction
                                .setLabel('Decline')
                                .setStyle(ButtonStyle.Danger),
                        );

                    const proposeEmbed = new EmbedBuilder()
                        .setTitle(`***💍 Proposal 💍***`)
                        .setThumbnail(initiatorAvatar)
                        .setDescription(`*${target.displayName}, ${initiator.displayName} has proposed to you! Do you accept?🥹*`)
                        .setColor('#e048ff');
                        
                    // Send the proposal message with buttons
                    const reply = await interaction.reply({
                        embeds: [proposeEmbed],
                        components: [row]
                    });

                    // Set up a collector to listen for button interactions
                    const filter = i => i.customId.startsWith('accept_proposal_') || i.customId.startsWith('decline_proposal_');
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const [action, , proposalId] = i.customId.split('_');

                        // Check if the interaction is from the target user
                        if (i.user.id !== target.id) {
                            return i.reply({ content: 'This is not your proposal to respond to!', ephemeral: true });
                        }

                        // Check if the proposal ID matches
                        if (proposalId !== proposal._id.toString()) {
                            return i.reply({ content: 'This is not the correct proposal!', ephemeral: true });
                        }

                        if (action === 'accept') {
                            // Find the proposal and update its status
                            const acceptedProposal = await Relationship.findById(proposalId);
                            if (acceptedProposal) {
                                acceptedProposal.type = 'marriage';
                                acceptedProposal.status = 'accepted';
                                await acceptedProposal.save();
                                
                                // Create a new canvas to draw the image
                                const canvas = createCanvas(600, 200);
                                const context = canvas.getContext('2d');
                                
                                // Set background color
                                context.fillStyle = '#2f3136';
                                context.fillRect(0, 0, canvas.width, canvas.height);
                                
                                // Load images concurrently
                                const [initiatorPFP, targetPFP, ring] = await Promise.all([
                                    loadImage(initiator.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                                    loadImage(target.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                                    loadImage('https://images.emojiterra.com/google/noto-emoji/unicode-15/color/512px/1f48d.png') // This is a placeholder, you can change the image with any other ring png.
                                ]);
                                
                                // Draw the avatars
                                context.drawImage(initiatorPFP, 50, 25, 150, 150);
                                context.drawImage(targetPFP, 400, 25, 150, 150);
                                
                                // Draw the ring in the middle, centered and as a square
                                context.drawImage(ring, 250, 50, 100, 100);
                                
                                // Create a buffer from the canvas
                                const buffer = canvas.toBuffer('image/png');
                                
                                // Create the attachment and embed
                                const attachment = new AttachmentBuilder(buffer, { name: 'marriage-certificate.png' });
                                
                                const marriageEmbed = new EmbedBuilder()
                                    .setColor('#ff69b4')
                                    .setTitle(`**💐 Congratulations! You're Married! 💐**`)
                                    .setDescription(`*${initiator.displayName} and ${target.displayName} are now officially married! 🥂*`)
                                    .setImage('attachment://marriage-certificate.png')
                                    .setTimestamp();
                                
                                await i.update({ content: `**${target.displayName}** has accepted the proposal!`, embeds: [marriageEmbed], files: [attachment], components: [] });
                            }
                        } else if (action === 'decline') {
                            // Find and remove the proposal
                            await Relationship.findByIdAndDelete(proposalId);
                            await i.update({ content: `**${target.displayName}** has rejected you.🥀💔`, components: [] });
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            // Find and remove the proposal from the database if it timed out
                            const timedOutProposal = await Relationship.findById(proposal._id);
                            if (timedOutProposal) {
                                await Relationship.findByIdAndDelete(proposal._id);
                            }
                            await interaction.editReply({ content: '**❌ The proposal timed out.**', components: [] });
                        }
                    });

                    break;
                }

            case 'divorce':
                {
                    // Find the marriage relationship
                    const marriage = await Relationship.findOne({
                        type: 'marriage',
                        status: 'accepted',
                        $or: [
                            { initiatorId: initiator.id, targetId: target.id },
                            { initiatorId: target.id, targetId: initiator.id }
                        ]
                    });

                    if (!marriage) {
                        return interaction.reply({ content: `**🚫 You are not married to ${target.displayName}.**` });
                    }

                    // Update the marriage status to 'divorced'
                    marriage.status = 'divorced';
                    await marriage.save();
                    
                    // Create a new canvas to draw the image for divorce
                    const canvas = createCanvas(600, 200);
                    const context = canvas.getContext('2d');
                    
                    // Set background color
                    context.fillStyle = '#2f3136';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Load images concurrently
                    const [initiatorPFP, targetPFP, brokenHeart] = await Promise.all([
                        loadImage(initiator.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                        loadImage(target.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                        loadImage('https://images.emojiterra.com/google/noto-emoji/unicode-15/color/512px/1f494.png') // Broken heart emoji
                    ]);
                    
                    // Draw the avatars
                    context.drawImage(initiatorPFP, 50, 25, 150, 150);
                    context.drawImage(targetPFP, 400, 25, 150, 150);
                    
                    // Draw the broken heart in the middle, centered and as a square
                    context.drawImage(brokenHeart, 250, 50, 100, 100);
                    
                    // Create a buffer from the canvas
                    const buffer = canvas.toBuffer('image/png');
                    
                    // Create the attachment and embed
                    const attachment = new AttachmentBuilder(buffer, { name: 'divorce-notice.png' });
                    
                    const divorceEmbed = new EmbedBuilder()
                        .setColor('#ff0a00')
                        .setTitle(`***💔 Divorce is Finalized 💔***`)
                        .setDescription(`*${initiator.displayName} and ${target.displayName} are no longer married.*`)
                        .setImage('attachment://divorce-notice.png')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [divorceEmbed], files: [attachment] });
                    break;
                }

            case 'divorceall':
                {
                    // Find all accepted marriages where the initiator or target is the current user
                    const marriages = await Relationship.find({
                        type: 'marriage',
                        status: 'accepted',
                        $or: [{ initiatorId: initiator.id }, { targetId: initiator.id }]
                    });

                    if (marriages.length === 0) {
                        return interaction.reply({ content: 'You are not married to anyone.', flags: MessageFlags.Ephemeral });
                    }

                    // Update all found marriages to 'divorced' status
                    await Relationship.updateMany(
                        {
                            type: 'marriage',
                            status: 'accepted',
                            $or: [{ initiatorId: initiator.id }, { targetId: initiator.id }]
                        },
                        { $set: { status: 'divorced' } }
                    );

                    const divorceallEmbed = new EmbedBuilder()
                        .setTitle(`***🥀💔💔 Divorced All Partners!***`)
                        .setDescription(`*You have successfully divorced all your partners.*`)
                        .setColor('#ff0a00')
                        .setThumbnail(initiatorAvatar)
                        .setTimestamp();

                    await interaction.reply({ embeds: [divorceallEmbed] });
                    break;
                }

            case 'adopt':
                {
                    // Check if the initiator has already adopted the target
                    if (await isParentOf(initiator.id, target.id)) {
                        return interaction.reply({ content: `Geez bro... relax. You obsessed with them or something? You already adopted that nigga ${target.displayName}.`, flags: MessageFlags.Ephemeral });
                    }
                    // Check if the target has already adopted the initiator (prevent circular adoption)
                    if (await isParentOf(target.id, initiator.id)) {
                        return interaction.reply({ content: `**🚫 ${target.displayName} has already adopted you.**`, flags: MessageFlags.Ephemeral });
                    }
                    // Prevent adopting a spouse
                    if (await areMarried(initiator.id, target.id)) {
                        return interaction.reply({ content: `**How tf are you gonna adopt your spouse, ${target.displayName}?**`, flags: MessageFlags.Ephemeral });
                    }
                    // Check if the target is already adopted by someone else
                    const existingAdoption = await Relationship.findOne({
                        type: 'adoption',
                        status: 'accepted',
                        targetId: target.id
                    });
                    if (existingAdoption) {
                         return interaction.reply({ content: `**🚫 ${target.displayName} has already been adopted by someone else.**`, flags: MessageFlags.Ephemeral });
                    }

                    // Create a new adoption relationship (accepted immediately for simplicity)
                    const adoption = new Relationship({
                        initiatorId: initiator.id,
                        targetId: target.id,
                        type: 'adoption',
                        status: 'accepted'
                    });
                    await adoption.save();

                    const adoptionEmbed = new EmbedBuilder()
                        .setTitle(`***👨‍👩‍👧‍👦 Adoption Successful! 👨‍👩‍👧‍👦***`)
                        .setDescription(`*Welcome to the family, <@${target.id}>! <@${initiator.id}> has adopted you!*`)
                        .setThumbnail(targetAvatar)
                        .setColor('#a2d802')
                        .setImage('https://i.imgur.com/ui84XL6.png')
                        .setTimestamp();

                    await interaction.reply({ embeds: [adoptionEmbed] });
                    break;
                }

            case 'disown':
                {
                    let disownMsg = ``;
                    // Find the adoption relationship
                    const adoption = await Relationship.findOne({
                        type: 'adoption',
                        status: 'accepted',
                        initiatorId: initiator.id,
                        targetId: target.id
                    });

                    if (!adoption) {
                        disownMsg = `**I know we all wanna disown ${target.displayName}... but you haven't adopted them yet.**`;
                        const disownedEmbed = new EmbedBuilder()
                        .setDescription(disownMsg);
                        return interaction.reply({ embeds: [disownedEmbed] });
                    }

                    // Update the adoption status to 'disowned'
                    adoption.status = 'disowned';
                    await adoption.save();
                    disownMsg = `*<@${initiator.id}> has disowned <@${target.id}>. What a waste of space..😮‍💨*`;
                    const disownedEmbed = new EmbedBuilder()
                        .setTitle(`***🍾 You Got Disowned! 🍾***`)
                        .setDescription(disownMsg)
                        .setImage('https://i.imgur.com/AhcKiSa.png')
                        .setThumbnail(targetAvatar)
                        .setColor('#cc0000')
                        .setTimestamp();
                    await interaction.reply({ embeds: [disownedEmbed] });
                    break;
                }

            case 'disownall':
                {
                    let dAllMsg = ``;
                    // Find all accepted adoptions where the initiator is the current user
                    const adoptions = await Relationship.find({
                        type: 'adoption',
                        status: 'accepted',
                        initiatorId: initiator.id
                    });

                    if (adoptions.length === 0) {
                        dAllMsg = `**You have not adopted anyone.**`;
                        const dsownallEmbed = new EmbedBuilder()
                            .setDescription(dAllMsg)
                            .setColor('#f4d229');
                        return interaction.reply({ embeds: [dsownallEmbed] });
                    }

                    // Update all found adoptions to 'disowned' status
                    await Relationship.updateMany(
                        {
                            type: 'adoption',
                            status: 'accepted',
                            initiatorId: initiator.id
                        },
                        { $set: { status: 'disowned' } }
                    );

                    dAllMsg = `***You've finally gotten rid of all those broken beer fetching machines... good riddance***`;
                    const dsownallEmbed = new EmbedBuilder()
                        .setTitle(`***🍾 All Children Disowned 🍾***`)
                        .setDescription(dAllMsg)
                        .setColor('#aa0000')
                        .setThumbnail(initiatorAvatar)
                        .setImage('https://i.imgur.com/AhcKiSa.png')
                        .setTimestamp();                  

                    await interaction.reply({ embeds: [dsownallEmbed] });
                    break;
                }

            case 'hug':
                {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`hug_accept_${initiator.id}_${target.id}`)
                                .setLabel('Accept')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`hug_decline_${initiator.id}_${target.id}`)
                                .setLabel('Decline')
                                .setStyle(ButtonStyle.Danger),
                        );
                    const hugrequestEmbed = new EmbedBuilder()
                        .setTitle(`***🤗 Hug Request 🤗***`)
                        .setDescription(`*<@${target.id}>, <@${initiator.id}> wants to give you a hug! Do you accept?*`)
                        .setThumbnail(initiatorAvatar)
                        .setColor('#e048ff');

                    const reply = await interaction.reply({
                        embeds: [hugrequestEmbed] ,
                        components: [row]
                    });

                    const filter = i => i.user.id === target.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const [_, action] = i.customId.split('_');

                        if (action === 'accept') {
                            let msg = ``;
                            let img = '';
                            let color = '';
                            if(initiator.roles.cache.has(MaleRoleId)&&target.roles.cache.has(MaleRoleId)) {
                                msg = `***<@${initiator.id}> gave <@${target.id}> a hug.. that nigga gay.***`;
                                img = 'https://gifdb.com/images/high/brokeback-mountain-gif-file-1092kb-5xf1qchldna0z60g.gif';
                                color = '#f770ba';
                            } else {
                                msg = `***<@${initiator.id}> gave <@${target.id}> a weirdly sensual hug...***`;
                                img = 'https://c.tenor.com/T9LVCfs-pM0AAAAd/tenor.gif';
                                color = '#e048ff';
                            }
                            const hugEmbed = new EmbedBuilder()
                                .setDescription(msg)
                                .setImage(img)
                                .setColor(color);
                            await i.update({ content: `**<@${target.id}>** has accepted the hug!`, components: [] });
                            await interaction.followUp({ embeds: [hugEmbed] });
                        } else if (action === 'decline') {
                            await i.update({ content: `**<@${target.id}>** has rejected the hug from **<@${initiator.id}>**. 🥀💔`, components: [] });
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: '**❌ The hug request timed out.**', components: [] });
                        }
                    });
                    break;
                }

            case 'kiss':
                {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`kiss_accept_${initiator.id}_${target.id}`)
                                .setLabel('Accept')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`kiss_decline_${initiator.id}_${target.id}`)
                                .setLabel('Decline')
                                .setStyle(ButtonStyle.Danger),
                        );
                    const kissrequestEmbed = new EmbedBuilder()
                        .setTitle(`***💋 Kiss Request 💋***`)
                        .setDescription(`*<@${target.id}>, <@${initiator.id}> wants to give you a kiss! Do you accept?*`)
                        .setThumbnail(initiatorAvatar)
                        .setColor('#e048ff');
                    

                    const reply = await interaction.reply({
                        embeds: [kissrequestEmbed],
                        components: [row]
                    });

                    const filter = i => i.user.id === target.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const [_, action] = i.customId.split('_');
                        if (action === 'accept') {
                            const kissEmbed = new EmbedBuilder()
                                .setDescription(`***<@${initiator.id}> kissed <@${target.id}>***`)
                                .setImage('https://c.tenor.com/UO-pdPnf7ggAAAAd/tenor.gif')
                                .setColor('#e048ff');
                            await i.update({ content: `**<@${target.id}>** has accepted the kiss!`, components: [] });
                            await interaction.followUp({ embeds: [kissEmbed] });

                            if(target.roles.cache.has(AgeRoleID)) {
                                if(!initiator.roles.cache.has(AgeRoleID)) {
                                    if(!initiator.roles.highest.position > interaction.guild.members.me.roles.highest.position) {
                                        const duration = 5;
                                        await interaction.followUp(`Oh no! Looks like <@${target.id}> was a minor! The FBI has been contacted...`)
                                        const randomint = Math.floor(Math.random() * 12) + 1;
                                        if(randomint < 7) {
                                            const timeoutInMilliseconds = duration * 60 * 1000;

                                            await interaction.member.timeout(timeoutInMilliseconds, `Timed out by ${interaction.client.user.tag} for ${duration} minutes`);
                                            await interaction.followUp(`You rolled a dice to decide your escape... Uh oh... you rolled a ${randomint}. I'm sorry but you're going away for some time`);
                                                
                                                // Use setTimeout to re-add the role after the timeout duration has passed.
                                        } else {
                                            await interaction.followUp(`You rolled a dice to decide your escape... You rolled a ${randomint}! You're free to go.`);
                                        }
                                    } else if(initiator.roles.cache.has(RoleID)) {
                                        const duration = 5;
                                        await interaction.followUp(`Oh no! Looks like <@${target.id}> was a minor! The FBI has been contacted...`)
                                        const randomint = Math.floor(Math.random() * 12) + 1;
                                        if(randomint < 7) {
                                            const timeoutInMilliseconds = duration * 60 * 1000;
                                            if (initiator.roles.cache.has(RoleID)) {
                                                try {
                                                    await initiator.roles.remove(RoleID, `Role removed due to timeout triggered by touch command.`);
                                                    console.log(`Removed role ${RoleID} from ${initiator.user.tag}`);
                                                } catch (roleError) {
                                                    console.error(`Failed to remove role ${RoleID}:`, roleError);
                                                }
                                            }

                                            await interaction.member.timeout(timeoutInMilliseconds, `Timed out by ${interaction.client.user.tag} for ${duration} minutes`);
                                            await interaction.followUp(`You rolled a dice to decide your escape... Uh oh... you rolled a ${randomint}. I'm sorry but you're going away for some time`);
                                                
                                                // Use setTimeout to re-add the role after the timeout duration has passed.
                                            setTimeout(async () => {
                                                try {
                                                        const guild = interaction.guild;
                                                        const member = await guild.members.fetch(interaction.member.id);
                                                        // Make sure the member still exists and doesn't have the role before re-adding.
                                                        if (member && !member.roles.cache.has(RoleID)) {
                                                            await member.roles.add(RoleID, 'Timeout duration expired, re-adding role.');
                                                            console.log(`Re-added role ${RoleID} to ${member.user.tag}`);
                                                        }
                                                        // Also remove the timeout once it has expired
                                                        if (member && member.isCommunicationDisabled()) {
                                                            await member.timeout(null, 'Timeout duration expired.');
                                                            console.log(`Removed timeout from ${member.user.tag}.`);
                                                        }
                                                } catch (e) {
                                                        console.error(`Failed to re-add role or remove timeout after timeout duration for ${interaction.member.user.tag}:`, e);
                                                }
                                            }, timeoutInMilliseconds);                        
                                        } else {
                                            await interaction.followUp(`You rolled a dice to decide your escape... You rolled a ${randomint}! You're free to go.`);
                                        }
                                    } else {
                                        await interaction.followUp(`<@${target.id}> was a minor! The FBI is comi- oh? nevermind. You're free to go boss.`);
                                    }   
                                } 
                            }
                        } else if (action === 'decline') {
                            await i.update({ content: `**<@${target.id}>** has rejected the kiss from **<@${initiator.id}>**. 💔`, components: [] });
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: '**❌ The kiss request timed out.**', components: [] });
                        }
                    });
                    break;
                }

            case 'slap':
                {
                    const slapEmbed = new EmbedBuilder()
                        .setDescription(`***<@${initiator.id}> has slapped tf out of <@${target.id}>... about time someone did...***`)
                        .setImage('https://media.tenor.com/b7lPcGXxKpsAAAAM/shut-up-stfu.gif')
                        .setColor('#ff0200');
                    await interaction.reply({ embeds: [slapEmbed] });
                    break;
                }

            case 'touch':
                {
                    const touchEmbed = new EmbedBuilder()
                        .setDescription(`***<@${initiator.id}> has touched <@${target.id}>...***`)
                        .setImage('https://c.tenor.com/8RNv7Ip6GlAAAAAd/tenor.gif')
                        .setColor('#e048ff');
                    await interaction.reply({ embeds: [touchEmbed] });

                    if(target.roles.cache.has(AgeRoleID)) {
                        if(!initiator.roles.cache.has(AgeRoleID)) {
                            if(!initiator.roles.highest.position > interaction.guild.members.me.roles.highest.position) {
                                const duration = 5;
                                await interaction.followUp(`Oh no! Looks like <@${target.id}> was a minor! The FBI has been contacted...`)
                                const randomint = Math.floor(Math.random() * 12) + 1;
                                if(randomint < 7) {
                                    const timeoutInMilliseconds = duration * 60 * 1000;

                                    await interaction.member.timeout(timeoutInMilliseconds, `Timed out by ${interaction.client.user.tag} for ${duration} minutes`);
                                    await interaction.followUp(`You rolled a dice to decide your escape... Uh oh... you rolled a ${randomint}. I'm sorry but you're going away for some time`);
                                        
                                        // Use setTimeout to re-add the role after the timeout duration has passed.
                                } else {
                                    await interaction.followUp(`You rolled a dice to decide your escape... You rolled a ${randomint}! You're free to go.`);
                                }
                            } else if(initiator.roles.cache.has(RoleID)) {
                                const duration = 5;
                                await interaction.followUp(`Oh no! Looks like <@${target.id}> was a minor! The FBI has been contacted...`)
                                const randomint = Math.floor(Math.random() * 12) + 1;
                                if(randomint < 7) {
                                    const timeoutInMilliseconds = duration * 60 * 1000;
                                    if (initiator.roles.cache.has(RoleID)) {
                                        try {
                                            await initiator.roles.remove(RoleID, `Role removed due to timeout triggered by touch command.`);
                                            console.log(`Removed role ${RoleID} from ${initiator.user.tag}`);
                                        } catch (roleError) {
                                            console.error(`Failed to remove role ${RoleID}:`, roleError);
                                        }
                                    }

                                    await interaction.member.timeout(timeoutInMilliseconds, `Timed out by ${interaction.client.user.tag} for ${duration} minutes`);
                                    await interaction.followUp(`You rolled a dice to decide your escape... Uh oh... you rolled a ${randomint}. I'm sorry but you're going away for some time`);
                                        
                                        // Use setTimeout to re-add the role after the timeout duration has passed.
                                    setTimeout(async () => {
                                        try {
                                                const guild = interaction.guild;
                                                const member = await guild.members.fetch(interaction.member.id);
                                                // Make sure the member still exists and doesn't have the role before re-adding.
                                                if (member && !member.roles.cache.has(RoleID)) {
                                                    await member.roles.add(RoleID, 'Timeout duration expired, re-adding role.');
                                                    console.log(`Re-added role ${RoleID} to ${member.user.tag}`);
                                                }
                                                // Also remove the timeout once it has expired
                                                if (member && member.isCommunicationDisabled()) {
                                                    await member.timeout(null, 'Timeout duration expired.');
                                                    console.log(`Removed timeout from ${member.user.tag}.`);
                                                }
                                        } catch (e) {
                                                console.error(`Failed to re-add role or remove timeout after timeout duration for ${interaction.member.user.tag}:`, e);
                                        }
                                    }, timeoutInMilliseconds);                        
                                } else {
                                    await interaction.followUp(`You rolled a dice to decide your escape... You rolled a ${randomint}! You're free to go.`);
                                }
                            } else {
                                await interaction.followUp(`<@${target.id}> was a minor! The FBI is comi- oh? nevermind. You're free to go boss.`);
                            }   
                        } 
                    }
                    break;
                }
            
            case 'cuddle':
                {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`cuddle_accept_${initiator.id}_${target.id}`)
                                .setLabel('Accept')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`cuddle_decline_${initiator.id}_${target.id}`)
                                .setLabel('Decline')
                                .setStyle(ButtonStyle.Danger),
                        );
                    const cuddlerequestEmbed = new EmbedBuilder()
                        .setTitle(`***🫂 Cuddle Request 🫂***`)
                        .setDescription(`*<@${target.id}>, <@${initiator.id}> wants to cuddle with you! Do you accept?*`)
                        .setThumbnail(initiatorAvatar)
                        .setColor('#e048ff');
                    const reply = await interaction.reply({
                        embeds: [cuddlerequestEmbed],
                        components: [row]
                    });

                    const filter = i => i.user.id === target.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const [_, action] = i.customId.split('_');
                        if (action === 'accept') {
                            const cuddleEmbed = new EmbedBuilder()
                                .setDescription(`***<@${initiator.id}> started cuddling with <@${target.id}>...***`)
                                .setImage('https://c.tenor.com/dwwLwSNNXtwAAAAd/tenor.gif')
                                .setColor('#e048ff');
                            await i.update({ content: `**<@${target.id}>** has accepted the cuddle!`, components: [] });
                            await interaction.followUp({ embeds: [cuddleEmbed] });
                        } else if (action === 'decline') {
                            await i.update({ content: `**<@${target.id}>** has rejected the cuddle from **<@${initiator.id}>**. 💔`, components: [] });
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: '**❌ The cuddle request timed out.**', components: [] });
                        }
                    });
                    break;
                }
            
            case 'runaway':
                {
                    // Find all relationships where the initiator is the current user (spouses and children)
                    const userRelationships = await Relationship.find({
                        $or: [
                            { initiatorId: initiator.id, type: 'marriage', status: 'accepted' },
                            { initiatorId: initiator.id, type: 'adoption', status: 'accepted' },
                        ]
                    });

                    // Find all relationships where the target is the current user (spouses and parents)
                    const targetRelationships = await Relationship.find({
                        $or: [
                            { targetId: initiator.id, type: 'marriage', status: 'accepted' },
                            { targetId: initiator.id, type: 'adoption', status: 'accepted' },
                        ]
                    });

                    const allRelationships = [...userRelationships, ...targetRelationships];

                    if (allRelationships.length === 0) {
                        return interaction.reply({ content: 'You are not in any family relationships to abandon.', flags: MessageFlags.Ephemeral });
                    }

                    // Delete all found relationships
                    for (const rel of allRelationships) {
                        await Relationship.findByIdAndDelete(rel._id);
                    }

                    const runawayEmbed = new EmbedBuilder()
                        .setTitle(`***🏃‍➡️ Ran Away From Family 🏃‍➡️***`)
                        .setDescription(`*<@${initiator.id}> has abandoned all their spouses, children, and parents. They are now a lone wolf... a lone alpha wolf..*`)
                        .setThumbnail(initiatorAvatar)
                        .setColor('#ff4500')
                        .setImage('https://i.imgur.com/37bwjlc.png')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [runawayEmbed] });
                    break;
                }
                
            case 'ask-to-be-parent':
                {
                    // Check if the target is already a parent of the initiator
                    if (await isParentOf(target.id, initiator.id)) {
                        return interaction.reply({ content: `**🚫 ${target.displayName} is already your parent!**`, flags: MessageFlags.Ephemeral });
                    }

                    // Check if the initiator is already a child of someone else
                    const existingParent = await Relationship.findOne({
                        type: 'adoption',
                        status: 'accepted',
                        targetId: initiator.id
                    });
                    if (existingParent) {
                        return interaction.reply({ content: `**🚫 You already have a parent!**`, flags: MessageFlags.Ephemeral });
                    }

                    // Create a pending adoption request
                    const adoptionRequest = new Relationship({
                        initiatorId: target.id, // The target is the potential parent
                        targetId: initiator.id, // The initiator is the child
                        type: 'adoption-request',
                        status: 'pending'
                    });
                    await adoptionRequest.save();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`accept_adoption_${adoptionRequest._id}`)
                                .setLabel('Accept')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`decline_adoption_${adoptionRequest._id}`)
                                .setLabel('Decline')
                                .setStyle(ButtonStyle.Danger),
                        );

                    const requestEmbed = new EmbedBuilder()
                        .setTitle(`***🥺 Adoption Request 🥺***`)
                        .setThumbnail(initiatorAvatar)
                        .setDescription(`*<@${target.id}>, <@${initiator.id}> has asked you to adopt them. Do you accept?*`)
                        .setColor('#add8e6');

                    const reply = await interaction.reply({
                        embeds: [requestEmbed],
                        components: [row]
                    });

                    const filter = i => i.customId.startsWith('accept_adoption_') || i.customId.startsWith('decline_adoption_');
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const [action, , requestId] = i.customId.split('_');

                        if (i.user.id !== target.id) {
                            return i.reply({ content: 'This is not your request to respond to!', ephemeral: true });
                        }

                        if (requestId !== adoptionRequest._id.toString()) {
                            return i.reply({ content: 'This is not the correct request!', ephemeral: true });
                        }

                        if (action === 'accept') {
                            const acceptedRequest = await Relationship.findById(requestId);
                            if (acceptedRequest) {
                                // Create the adoption relationship
                                acceptedRequest.type = 'adoption';
                                acceptedRequest.status = 'accepted';
                                await acceptedRequest.save();

                                const adoptionEmbed = new EmbedBuilder()
                                    .setTitle(`***👨‍👩‍👧‍👦 Adoption Successful! 👨‍👩‍👧‍👦***`)
                                    .setDescription(`*Welcome to the family, <@${initiator.id}>! <@${target.id}> has adopted you!*`)
                                    .setThumbnail(initiatorAvatar)
                                    .setColor('#a2d802')
                                    .setImage('https://i.imgur.com/ui84XL6.png')
                                    .setTimestamp();
                                
                                await i.update({ content: `**${target.displayName}** has accepted the adoption request!`, embeds: [adoptionEmbed], components: [] });
                            }
                        } else if (action === 'decline') {
                            await Relationship.findByIdAndDelete(requestId);
                            await i.update({ content: `**${target.displayName}** has rejected the adoption request. 💔`, components: [] });
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            const timedOutRequest = await Relationship.findById(adoptionRequest._id);
                            if (timedOutRequest) {
                                await Relationship.findByIdAndDelete(adoptionRequest._id);
                            }
                            await interaction.editReply({ content: '**❌ The adoption request timed out.**', components: [] });
                        }
                    });

                    break;
                }

            case 'familytree': {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;

    // A helper function to sanitize usernames for drawing on the canvas.
    const sanitizeText = (text) => {
        return text.replace(/[^a-zA-Z0-9 ]/g, '');
    };

    // --- Finding the Family Root ---
    let rootUserId = targetUser.id;
    let currentUserId = targetUser.id;
    let hasParents = true;

    while (hasParents) {
        const parentRelationship = await Relationship.findOne({
            type: 'adoption',
            status: 'accepted',
            targetId: currentUserId
        });

        if (parentRelationship) {
            currentUserId = parentRelationship.initiatorId;
            rootUserId = currentUserId;
        } else {
            hasParents = false;
        }
    }

    // --- Building the Family Tree Structure from the Root ---
    const familyTree = new Map();
    const queue = [rootUserId];
    const visited = new Set();

    while (queue.length > 0) {
        const userId = queue.shift();
        if (visited.has(userId)) continue;
        visited.add(userId);

        const userRelationships = await Relationship.find({
            $or: [
                { initiatorId: userId },
                { targetId: userId }
            ],
            status: 'accepted'
        });

        const childrenIds = new Set();
        const spouseIds = new Set();
        const parentIds = new Set();

        for (const rel of userRelationships) {
            if (rel.type === 'adoption') {
                if (rel.initiatorId === userId) {
                    childrenIds.add(rel.targetId);
                    if (!visited.has(rel.targetId)) queue.push(rel.targetId);
                } else if (rel.targetId === userId) {
                    parentIds.add(rel.initiatorId);
                    if (!visited.has(rel.initiatorId)) queue.push(rel.initiatorId);
                }
            } else if (rel.type === 'marriage') {
                const spouseId = rel.initiatorId === userId ? rel.targetId : rel.initiatorId;
                spouseIds.add(spouseId);
                if (!visited.has(spouseId)) queue.push(spouseId);
            }
        }

        familyTree.set(userId, {
            children: Array.from(childrenIds),
            spouses: Array.from(spouseIds),
            parents: Array.from(parentIds)
        });
    }

    // --- Canvas Drawing Logic (Revised with Two-Pass Layout) ---
    const pfpSize = 80;
    const gap = 40;
    const userPositions = new Map();
    let finalWidth = 0;
    let finalHeight = 0;

    // Pass 1: Calculate the width of each subtree.
    const calculateSubtreeWidth = (userId) => {
        const node = familyTree.get(userId);
        if (!node) return pfpSize;

        const childrenWidths = node.children.map(childId => calculateSubtreeWidth(childId));
        let childrenTotalWidth = childrenWidths.reduce((sum, width) => sum + width + gap, 0);
        childrenTotalWidth = Math.max(0, childrenTotalWidth - gap);

        const selfWidth = (node.spouses.length + 1) * (pfpSize + gap) - gap;
        return Math.max(selfWidth, childrenTotalWidth);
    };

    // Pass 2: Position the elements based on the calculated widths.
    const positionSubtree = (userId, y, x) => {
        const node = familyTree.get(userId);
        if (!node) {
            userPositions.set(userId, { x, y });
            finalHeight = Math.max(finalHeight, y + pfpSize + 25 + gap);
            finalWidth = Math.max(finalWidth, x + pfpSize);
            return x + pfpSize + gap;
        }

        const selfWidth = (node.spouses.length + 1) * (pfpSize + gap) - gap;
        const childrenWidths = node.children.map(childId => calculateSubtreeWidth(childId));
        const childrenTotalWidth = childrenWidths.reduce((sum, width) => sum + width + gap, 0) - gap;
        const totalSubtreeWidth = Math.max(selfWidth, childrenTotalWidth);

        // Position children first to determine parent's position
        if (node.children.length === 1) {
            // New logic: For a single child, position the child first...
            const childId = node.children[0];
            const childWidth = calculateSubtreeWidth(childId);
            
            // Position the child's subtree
            positionSubtree(childId, y + pfpSize + gap * 3, x);
            const childPos = userPositions.get(childId);

            // ...then center the parent directly above them.
            const parentWidth = (node.spouses.length + 1) * (pfpSize + gap) - gap;
            
            // The center of the child's profile picture
            const childPfpCenter = childPos.x + pfpSize / 2;
            
            // The starting x position for the parent block to be centered over the child's pfp
            const parentBlockX = childPfpCenter - parentWidth / 2;
            userPositions.set(userId, { x: parentBlockX, y });

            // Position any spouses relative to the main parent
            let spouseX = parentBlockX;
            for (const spouseId of node.spouses) {
                spouseX += pfpSize + gap;
                userPositions.set(spouseId, { x: spouseX, y: y });
            }

            finalHeight = Math.max(finalHeight, y + pfpSize + 25 + gap);
            
        } else {
            // Existing logic for multiple children
            const parentBlockStartX = x + (totalSubtreeWidth - selfWidth) / 2;
            let spouseX = parentBlockStartX;
            userPositions.set(userId, { x: spouseX, y: y });
            finalHeight = Math.max(finalHeight, y + pfpSize + 25 + gap);

            for (const spouseId of node.spouses) {
                spouseX += pfpSize + gap;
                userPositions.set(spouseId, { x: spouseX, y: y });
            }
            
            let currentChildX = x + (totalSubtreeWidth - childrenTotalWidth) / 2;
            for (let i = 0; i < node.children.length; i++) {
                const childId = node.children[i];
                const childWidth = childrenWidths[i];
                positionSubtree(childId, y + pfpSize + gap * 3, currentChildX);
                currentChildX += childWidth + gap;
            }
        }
        
        finalWidth = Math.max(finalWidth, x + totalSubtreeWidth);
        return x + totalSubtreeWidth + gap;
    };


    // A helper function to draw a single user, to keep the main logic clean
    const drawUser = async (context, member, pos) => {
        try {
            const pfp = await loadImage(member.displayAvatarURL({ extension: 'png' }));
            context.drawImage(pfp, pos.x, pos.y, pfpSize, pfpSize);
        } catch (error) {
            console.error(`Failed to load avatar for user ${member.id}:`, error);
        }

        context.fillStyle = '#FFFFFF';
        context.font = '24px sans-serif';
        context.textAlign = 'center';
        context.fillText(sanitizeText(member.displayName), pos.x + pfpSize / 2, pos.y + pfpSize + 25);
    };

    // Main drawing function
    const drawTree = async (context, guild) => {
        // Draw connections first
        context.lineWidth = 3;
        for (const [userId, node] of familyTree.entries()) {
            const userPos = userPositions.get(userId);
            if (!userPos) continue;

            // Draw marriage lines
            const spouses = node.spouses || [];
            context.strokeStyle = '#FF69B4'; // Pink
            for (const spouseId of spouses) {
                const spousePos = userPositions.get(spouseId);
                // Draw the marriage line only once
                if (userPos.x < spousePos.x) {
                    context.beginPath();
                    context.moveTo(userPos.x + pfpSize, userPos.y + pfpSize / 2);
                    context.lineTo(spousePos.x, spousePos.y + pfpSize / 2);
                    context.stroke();
                }
            }
            
            // Draw lines to children
            const children = node.children || [];
            context.strokeStyle = '#90EE90'; // Green
            if (children.length > 0) {
                const parentXCenter = spouses.length > 0
                    ? (userPos.x + userPositions.get(spouses[0]).x) / 2 + pfpSize / 2
                    : userPos.x + pfpSize / 2;
                
                const parentYBottom = userPos.y + pfpSize;

                if (children.length === 1) {
                    // New logic: Draw a direct vertical line for a single child
                    const childId = children[0];
                    const childPos = userPositions.get(childId);
                    if (childPos) {
                        const childXCenter = childPos.x + pfpSize / 2;
                        context.beginPath();
                        context.moveTo(parentXCenter, parentYBottom);
                        context.lineTo(childXCenter, childPos.y);
                        context.stroke();
                    }
                } else {
                    // Existing logic for multiple children
                    const horizontalLineY = parentYBottom + gap;

                    const firstChildPos = userPositions.get(children[0]);
                    const lastChildPos = userPositions.get(children[children.length - 1]);
                    if (firstChildPos && lastChildPos) {
                        const firstChildXCenter = firstChildPos.x + pfpSize / 2;
                        const lastChildXCenter = lastChildPos.x + pfpSize / 2;

                        // Draw the vertical line from parent(s) to the horizontal line
                        context.beginPath();
                        context.moveTo(parentXCenter, parentYBottom);
                        context.lineTo(parentXCenter, horizontalLineY);
                        context.stroke();
                        
                        // Draw the horizontal line connecting the children's vertical lines
                        context.beginPath();
                        context.moveTo(firstChildXCenter, horizontalLineY);
                        context.lineTo(lastChildXCenter, horizontalLineY);
                        context.stroke();

                        // Draw vertical lines from the horizontal line to each child
                        for (const childId of children) {
                            const childPos = userPositions.get(childId);
                            if (childPos) {
                                const childXCenter = childPos.x + pfpSize / 2;
                                context.beginPath();
                                context.moveTo(childXCenter, horizontalLineY);
                                context.lineTo(childXCenter, childPos.y);
                                context.stroke();
                            }
                        }
                    }
                }
            }
        }
        
        // Draw users and their names on top of lines
        for (const [userId, pos] of userPositions.entries()) {
            const member = guild.members.cache.get(userId);
            if (!member) continue;
            await drawUser(context, member, pos);
        }
    };


    // Start layout calculation
    const rootMember = guild.members.cache.get(rootUserId);
    if (rootMember) {
        // Run the two passes
        calculateSubtreeWidth(rootUserId);
        positionSubtree(rootUserId, 50, 50);

        // Create the final canvas with the correct size
        const finalCanvas = createCanvas(finalWidth + 100, finalHeight + 50);
        const finalContext = finalCanvas.getContext('2d');
        finalContext.fillStyle = '#2f3136';
        finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Draw the tree on the new canvas
        await drawTree(finalContext, guild);
        
        const buffer = finalCanvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, { name: 'family-tree.png' });
        
        const familyTreeEmbed = new EmbedBuilder()
            .setTitle(`***👨‍👩‍👧‍👦 ${sanitizeText(rootMember.displayName)}'s Family Tree 👨‍👩‍👧‍👦***`)
            .setImage('attachment://family-tree.png')
            .setColor('#4890ff')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [familyTreeEmbed], files: [attachment] });

    } else {
        return interaction.editReply({ content: 'Could not find the family root for that user.' });
    }
    
    break;
}


            // Admin-only force commands
            case 'force-marry':
                {
                    if((initiator.roles.highest.position > interaction.guild.members.me.roles.highest.position)) {
                        const user1 = interaction.options.getMember('user1');
                        const user2 = interaction.options.getMember('user2');

                        // Check for existing marriages and delete them
                        await Relationship.deleteMany({
                            $or: [
                                { initiatorId: user1.id, targetId: user2.id, type: 'marriage', status: 'accepted' },
                                { initiatorId: user2.id, targetId: user1.id, type: 'marriage', status: 'accepted' },
                            ]
                        });

                        // Create the new marriage relationship
                        const marriage = new Relationship({
                            initiatorId: user1.id,
                            targetId: user2.id,
                            type: 'marriage',
                            status: 'accepted'
                        });
                        await marriage.save();

                        // Create a new canvas to draw the image
                        const canvas = createCanvas(600, 200);
                        const context = canvas.getContext('2d');
                        context.fillStyle = '#2f3136';
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        
                        const [pfp1, pfp2, ring] = await Promise.all([
                            loadImage(user1.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                            loadImage(user2.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                            loadImage('https://images.emojiterra.com/google/noto-emoji/unicode-15/color/512px/1f48d.png')
                        ]);
                        
                        context.drawImage(pfp1, 50, 25, 150, 150);
                        context.drawImage(pfp2, 400, 25, 150, 150);
                        context.drawImage(ring, 250, 50, 100, 100);
                        const buffer = canvas.toBuffer('image/png');
                        const attachment = new AttachmentBuilder(buffer, { name: 'marriage-certificate.png' });
                        
                        const marriageEmbed = new EmbedBuilder()
                            .setColor('#ff69b4')
                            .setTitle(`**Admin Force Marriage!**`)
                            .setDescription(`*<@${user1.id}> and <@${user2.id}> are now officially married by admin command. 🥂*`)
                            .setImage('attachment://marriage-certificate.png')
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [marriageEmbed], files: [attachment] });
                    }
                    
                    break;
                }

            case 'force-divorce':
                {
                    if((initiator.roles.highest.position > interaction.guild.members.me.roles.highest.position)) {
                        const user1 = interaction.options.getMember('user1');
                        const user2 = interaction.options.getMember('user2');

                        const marriage = await Relationship.findOne({
                            type: 'marriage',
                            status: 'accepted',
                            $or: [
                                { initiatorId: user1.id, targetId: user2.id },
                                { initiatorId: user2.id, targetId: user1.id }
                            ]
                        });

                        if (!marriage) {
                            return interaction.reply({ content: `**🚫 ${user1.displayName} and ${user2.displayName} are not married.**`, flags: MessageFlags.Ephemeral });
                        }

                        marriage.status = 'divorced';
                        await marriage.save();
                        
                        const canvas = createCanvas(600, 200);
                        const context = canvas.getContext('2d');
                        context.fillStyle = '#2f3136';
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        
                        const [pfp1, pfp2, brokenHeart] = await Promise.all([
                            loadImage(user1.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                            loadImage(user2.user.displayAvatarURL({ dynamic: false, extension: 'png' })),
                            loadImage('https://images.emojiterra.com/google/noto-emoji/unicode-15/color/512px/1f494.png')
                        ]);
                        
                        context.drawImage(pfp1, 50, 25, 150, 150);
                        context.drawImage(pfp2, 400, 25, 150, 150);
                        context.drawImage(brokenHeart, 250, 50, 100, 100);
                        const buffer = canvas.toBuffer('image/png');
                        const attachment = new AttachmentBuilder(buffer, { name: 'divorce-notice.png' });
                        
                        const divorceEmbed = new EmbedBuilder()
                            .setColor('#ff0a00')
                            .setTitle(`***💔 Admin Force Divorce 💔***`)
                            .setDescription(`*<@${user1.id}> and <@${user2.id}> are no longer married by admin command.*`)
                            .setImage('attachment://divorce-notice.png')
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [divorceEmbed], files: [attachment] });
                    }
                    
                    break;
                }
            
            case 'force-adopt':
                {
                    if((initiator.roles.highest.position > interaction.guild.members.me.roles.highest.position)) {
                        const parent = interaction.options.getMember('parent');
                        const child = interaction.options.getMember('child');

                        // Check if the child is already adopted, and disown them if so
                        const existingAdoption = await Relationship.findOne({
                            type: 'adoption',
                            status: 'accepted',
                            targetId: child.id
                        });
                        if (existingAdoption) {
                            existingAdoption.status = 'disowned';
                            await existingAdoption.save();
                        }

                        // Create the new adoption relationship
                        const adoption = new Relationship({
                            initiatorId: parent.id,
                            targetId: child.id,
                            type: 'adoption',
                            status: 'accepted'
                        });
                        await adoption.save();

                        const adoptionEmbed = new EmbedBuilder()
                            .setTitle(`***👨‍👩‍👧‍👦 Admin Force Adoption! 👨‍👩‍👧‍👦***`)
                            .setDescription(`*<@${parent.id}> has adopted <@${child.id}> by admin command!*`)
                            .setThumbnail(child.user.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 }))
                            .setColor('#a2d802')
                            .setImage('https://i.imgur.com/ui84XL6.png')
                            .setTimestamp();
                        await interaction.reply({ embeds: [adoptionEmbed] });
                    }
                    
                    break;
                }

            case 'force-disown':
                {
                    if((initiator.roles.highest.position > interaction.guild.members.me.roles.highest.position)) {
                        const parent = interaction.options.getMember('parent');
                        const child = interaction.options.getMember('child');

                        const adoption = await Relationship.findOne({
                            type: 'adoption',
                            status: 'accepted',
                            initiatorId: parent.id,
                            targetId: child.id
                        });

                        if (!adoption) {
                            return interaction.reply({ content: `**🚫 ${parent.displayName} has not adopted ${child.displayName}.**`, flags: MessageFlags.Ephemeral });
                        }

                        adoption.status = 'disowned';
                        await adoption.save();

                        const disownedEmbed = new EmbedBuilder()
                            .setTitle(`***🍾 Admin Force Disown 🍾***`)
                            .setDescription(`*<@${parent.id}> has disowned <@${child.id}> by admin command.*`)
                            .setImage('https://i.imgur.com/AhcKiSa.png')
                            .setThumbnail(child.user.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 }))
                            .setColor('#cc0000')
                            .setTimestamp();
                        await interaction.reply({ embeds: [disownedEmbed] });
                    }
                    
                    break;
                }

            

            default: 
                await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    },
};
