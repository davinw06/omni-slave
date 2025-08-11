const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, MessageFlags, RoleFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goon')
        .setDescription('Goon to another user or yourself')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('User you want to goon to')
            .setRequired(false)
        ),

    async execute(interaction) {
        let user = interaction.options.getUser('user');
        let targetMember = interaction.options.getMember('user');
        if(!targetMember) targetMember = interaction.member;
        if(!user) user = interaction.user;

        const responses = [
            `<@${interaction.user.id}> viciously gooned to <@${user.id}>!`,
            `<@${interaction.user.id}> touched themselves to the thought of <@${user.id}>`,
            `<@${interaction.user.id}> couldn't contain themselves while thinking of <@${user.id}>!`
        ];

        let randResponse = responses[Math.floor(Math.random() * responses.length)];

        if(user == interaction.user) {
            randResponse = `<@${interaction.user.id}> just gooned to themself!... Damn I'm sexy..`;
        }

        let userAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });
        let otherAvatar = user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048 });

        

        const duration = 5;
        const RoleID = '1380459360207114341';
        const AgeRoleID = '1379700883398332497';
        const MaleRoleId = '1379632668689563678';
        const FemaleRoleId = '1379632424962621511';


        if(targetMember!=interaction.member) {
            if(targetMember.roles.cache.has(MaleRoleId)&&interaction.member.roles.cache.has(MaleRoleId))
            {
                randResponse = `<@${interaction.user.id}> just gooned to <@${targetMember.id}>... gay.`;
            }

            if(targetMember.roles.cache.has(FemaleRoleId)&&interaction.member.roles.cache.has(FemaleRoleId))
            {
                randResponse = `<@${interaction.user.id}> just gooned to <@${targetMember.id}> ✂️.`;
            }
        }

        const goonEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`**Someone Just Masturbated!**`)
            .setDescription(randResponse)
            .setThumbnail(userAvatar)
            .setImage(otherAvatar);

        try{
            await interaction.reply({ embeds: [goonEmbed] });
        } catch(error) {
            console.error('Error responding to goon.js command', error);
            await interaction.followUp({ content:'Something went wrong running that command. Please report to owner', flags: MessageFlags.Ephemeral });
        }


        if(targetMember.roles.cache.has(AgeRoleID)) {
            if(interaction.member.roles.highest.position < interaction.guild.members.me.roles.highest.position) {
                if(!interaction.member.roles.cache.has(AgeRoleID)) {
                    await interaction.followUp(`Oh no! Looks like <@${user.id}> was a minor! The FBI will reach you any minute now...`)
                    const randomint = Math.floor(Math.random() * 12) + 1;
                    if(randomint < 7) {
                        const timeoutInMilliseconds = duration * 60 * 1000;
                        
                        // Check if the member has the specific RoleID and remove it before timing out.
                        if (interaction.member.roles.cache.has(RoleID)) {
                            try {
                                await interaction.member.roles.remove(RoleID, `Role removed due to timeout triggered by goon command.`);
                                console.log(`Removed role ${RoleID} from ${interaction.member.user.tag}`);
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
                }
            } else if(interaction.member.roles.cache.has(RoleID)) {
                if(!interaction.member.roles.cache.has(AgeRoleID)) {
                    await interaction.followUp(`Oh no! Looks like <@${user.id}> was a minor! The FBI will reach you any minute now...`)
                    const randomint = Math.floor(Math.random() * 12) + 1;
                    if(randomint < 7) {
                        const timeoutInMilliseconds = duration * 60 * 1000;
                        
                        // Check if the member has the specific RoleID and remove it before timing out.
                        if (interaction.member.roles.cache.has(RoleID)) {
                            try {
                                await interaction.member.roles.remove(RoleID, `Role removed due to timeout triggered by goon command.`);
                                console.log(`Removed role ${RoleID} from ${interaction.member.user.tag}`);
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
                }
            } else {
                await interaction.followUp(`<@${user.id}> was a minor! The FBI is comi- oh? nevermind. You're free to go boss.`);
            }
        }
        
    }
}
