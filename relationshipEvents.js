const Relationship = require('./Schemas.js/relationshipSchema');

async function handleParentLeave(member, guild) {
    const adoptions = await Relationship.find({
        type: 'adoption',
        status: 'accepted',
        initiatorId: member.id
    });

    for (const adoption of adoptions) {
        const childId = adoption.targetId;

        // Try to find a surviving spouse
        const marriage = await Relationship.findOne({
            type: 'marriage',
            status: 'accepted',
            $or: [
                { initiatorId: member.id },
                { targetId: member.id }
            ]
        });

        if (marriage) {
            const spouseId = marriage.initiatorId === member.id ? marriage.targetId : marriage.initiatorId;
            adoption.initiatorId = spouseId; // transfer custody
            await adoption.save();
        } else {
            adoption.status = 'terminated'; // orphan
            await adoption.save();
        }
    }
}

async function handleChildLeave(member) {
    await Relationship.updateMany(
        { type: 'adoption', status: 'accepted', targetId: member.id },
        { $set: { status: 'terminated' } }
    );
}

async function handleMarriageLeave(member) {
    await Relationship.updateMany(
        { type: 'marriage', status: 'accepted', $or: [{ initiatorId: member.id }, { targetId: member.id }] },
        { $set: { status: 'divorced' } }
    );
}

async function cleanupPendingRequests(member) {
    await Relationship.deleteMany({
        $or: [
            { initiatorId: member.id, status: 'pending' },
            { targetId: member.id, status: 'pending' }
        ]
    });
}

function registerRelationshipEvents(client) {
    client.on('guildMemberRemove', async (member) => {
        await handleParentLeave(member, member.guild);
        await handleChildLeave(member);
        await handleMarriageLeave(member);
        await cleanupPendingRequests(member);
        console.log(`[RelationshipEvents] Cleaned up relationships for ${member.user.tag}`);
    });
}

module.exports = {
    registerRelationshipEvents
};
