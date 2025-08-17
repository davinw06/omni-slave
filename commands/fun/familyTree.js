const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const Relationship = require('../../Schemas.js/relationshipSchema');

// Helper: Sanitize text for display
const sanitizeText = (text) => text.replace(/[^a-zA-Z0-9 ]/g, '');

async function handleFamilyTreeCommand(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;

    // --- Build Family Tree Data ---
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

    // --- Detect siblings ---
    const siblingsMap = new Map(); // childId => [siblingIds]
    for (const [userId, node] of familyTree.entries()) {
        for (const childId of node.children) {
            siblingsMap.set(childId, node.children.filter(id => id !== childId));
        }
    }

    // --- Detect anniversaries ---
    const anniversaries = {};
    const marriages = await Relationship.find({ type: 'marriage', status: 'accepted' });
    const adoptions = await Relationship.find({ type: 'adoption', status: 'accepted' });

    const calcDuration = (date) => {
        const days = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
        if (days >= 365) return `${Math.floor(days / 365)} years`;
        if (days >= 30) return `${Math.floor(days / 30)} months`;
        return `${days} days`;
    };

    for (const m of marriages) {
        const key = [m.initiatorId, m.targetId].sort().join('-');
        anniversaries[key] = calcDuration(m.createdAt);
    }
    for (const a of adoptions) {
        const key = [a.initiatorId, a.targetId].sort().join('-');
        anniversaries[key] = calcDuration(a.createdAt);
    }

    // --- Canvas Layout ---
    const pfpSize = 80;
    const gap = 40;
    const userPositions = new Map();
    let finalWidth = 0;
    let finalHeight = 0;

    const calculateSubtreeWidth = (userId) => {
        const node = familyTree.get(userId);
        if (!node) return pfpSize;
        const childrenWidths = node.children.map(childId => calculateSubtreeWidth(childId));
        let childrenTotalWidth = childrenWidths.reduce((sum, width) => sum + width + gap, 0);
        childrenTotalWidth = Math.max(0, childrenTotalWidth - gap);
        const selfWidth = (node.spouses.length + 1) * (pfpSize + gap) - gap;
        return Math.max(selfWidth, childrenTotalWidth);
    };

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
        finalWidth = Math.max(finalWidth, x + totalSubtreeWidth);
        return x + totalSubtreeWidth + gap;
    };

    const drawUser = async (context, member, pos) => {
        try {
            const pfp = await loadImage(member.displayAvatarURL({ extension: 'png' }));
            context.drawImage(pfp, pos.x, pos.y, pfpSize, pfpSize);

            // Mark siblings with blue border
            if (siblingsMap.has(member.id) && siblingsMap.get(member.id).length > 0) {
                context.strokeStyle = 'blue';
                context.lineWidth = 4;
                context.strokeRect(pos.x, pos.y, pfpSize, pfpSize);
            }
        } catch (error) {
            console.error(`Failed to load avatar for user ${member.id}:`, error);
        }
        context.fillStyle = '#FFFFFF';
        context.font = '20px sans-serif';
        context.textAlign = 'center';
        context.fillText(sanitizeText(member.displayName), pos.x + pfpSize / 2, pos.y + pfpSize + 22);
    };

    // --- Render ---
    const rootMember = guild.members.cache.get(rootUserId);
    if (rootMember) {
        calculateSubtreeWidth(rootUserId);
        positionSubtree(rootUserId, 50, 50);
        const finalCanvas = createCanvas(finalWidth + 100, finalHeight + 50);
        const finalContext = finalCanvas.getContext('2d');
        finalContext.fillStyle = '#2f3136';
        finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        for (const [userId, pos] of userPositions.entries()) {
            const member = guild.members.cache.get(userId);
            if (!member) continue;
            await drawUser(finalContext, member, pos);
        }

        finalContext.strokeStyle = '#ffffff';
        finalContext.lineWidth = 2;

        for (const [userId, node] of familyTree.entries()) {
            const parentPos = userPositions.get(userId);
            if (!parentPos) continue;

            // Connect spouses
            for (const spouseId of node.spouses) {
                const spousePos = userPositions.get(spouseId);
                if (!spousePos) continue;

                finalContext.beginPath();
                finalContext.moveTo(parentPos.x + pfpSize / 2, parentPos.y + pfpSize / 2);
                finalContext.lineTo(spousePos.x + pfpSize / 2, spousePos.y + pfpSize / 2);
                finalContext.stroke();
            }

            // Connect children
            for (const childId of node.children) {
                const childPos = userPositions.get(childId);
                if (!childPos) continue;

                finalContext.beginPath();
                finalContext.moveTo(parentPos.x + pfpSize / 2, parentPos.y + pfpSize);
                finalContext.lineTo(childPos.x + pfpSize / 2, childPos.y);
                finalContext.stroke();
            }
        }

        const buffer = finalCanvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, { name: 'family-tree.png' });

        const embed = new EmbedBuilder()
            .setTitle(`👨‍👩‍👧‍👦 ${sanitizeText(rootMember.displayName)}'s Family Tree 👨‍👩‍👧‍👦`)
            .setImage('attachment://family-tree.png')
            .setColor('#4890ff')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    } else {
        return interaction.editReply({ content: 'Could not find the family root for that user.' });
    }
}

module.exports = { handleFamilyTreeCommand };
