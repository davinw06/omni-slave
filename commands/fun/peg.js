const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, Options } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('peg')
        .setDescription('Gives a user the pegging they deserve.')
        .addUserOption( option =>
            option.setName('user')
            .setDescription('The user whom you want to peg.😈')
            .setRequired(false)
        ),
    
    async execute(interaction) {
        const initiator = interaction.user;
        let victim = interaction.options.getUser('user') || interaction.user;
        let initiatorAvatar = initiator.displayAvatarURL({ extension: 'png', size: 1024 });
        let victimAvatar = victim.displayAvatarURL({ extension: 'png', size: 1024 });

        const underage_RoleID = '1379700883398332497';
        const mod_RoleID = '1380459360207114341';

        let description = `<@${initiator.id}> has just started pegging <@${victim.id}>!! Give them what they deserve!😈`;
        let peggingGif = 'https://c.tenor.com/26RCNR49i7cAAAAC/tenor.gif';

        if(victim.id === initiator.id) {
            description = `<@${initiator.id}> just started pegging themself... "Ngggyyah! I-I've been a very bad boy😔... I deserve it"`;
            peggingGif = 'https://media.tenor.com/kmBf5DWbuGYAAAAi/little-johnny-to-be-hero-x.gif';
        }

        const pegEmbed = new EmbedBuilder()
            .setTitle('Peg Alert')
            .setDescription(description)
            .setThumbnail(victimAvatar)
            .setImage(peggingGif)
            .setColor('#da00ff');
        
        await interaction.reply({ embeds: [pegEmbed] });

        const duration = 5;

        if(victim.member.roles.cache.has(underage_RoleID)) {
            if(interaction.member.roles.highest.position < interaction.member.me.roles.highest.position) {
                if(!initiator.member.roles.cache.has(underage_RoleID)) {
                    await interaction.followUp(`Looks like <@${victim.id}> was a minor, let's hear what the FBI has to say about this...`);
                    const randomint = Math.floor(Math.random() * 12) + 1;
                    if(randomint < 5) {
                        const timeoutInMilliseconds = duration * 60 * 1000;

                        await interaction.member.timeout(timeoutInMilliseconds, `Timed out by ${interaction.client.user.tag} for ${duration} minutes`);
                        await interaction.followUp(`You rolled a dice to decide your destiny... Uh oh... you rolled a ${randomint}. I'm sorry but you're going away for some time`);

                        setTimeout(async () => {
                            try {
                                const guild = interaction.guild;
                                const member = await guild.members.fetch(interaction.member.id);
                                // Make sure the member still exists and doesn't have the role before re-adding.
                                if (member && !member.roles.cache.has(mod_RoleID)) {
                                    await member.roles.add(mod_RoleID, 'Timeout duration expired, re-adding role.');
                                    console.log(`Re-added role ${mod_RoleID} to ${member.user.tag}`);
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
                        await interaction.followUp(`You rolled a dice to decide your destiny... You rolled a ${randomint}! You're free to go!`);
                    }
                }
            } else if(interaction.member.roles.cache.has(mod_RoleID)) {
                await interaction.followUp(`Looks like <@${victim.id}> was a minor, let's hear what the FBI has to say about this...`);
                const randomint = Math.floor(Math.random() * 12) + 1;
                if(randomint < 5) {
                    const timeoutInMilliseconds = duration * 60 * 1000;
                    if(initiator.member.roles.cache.has(mod_RoleID)) {
                        try {
                            initiator.member.roles.remove(mod_RoleID, `Role removed successfully due to peg command`);
                            console.log(`Role successfully removed from ${initiator.tag} due to peg command`);
                        } catch(error) {
                            console.error('Failed to remove role', error);
                        }
                    }

                    await interaction.member.timeout(timeoutInMilliseconds, `Timed out by ${interaction.client.user.tag} for ${duration} minutes`);
                    await interaction.followUp(`You rolled a dice to decide your destiny... Uh oh... you rolled a ${randomint}. I'm sorry but you're going away for some time`);

                    setTimeout(async () => {
                        try {
                            const guild = interaction.guild;
                            const member = await guild.members.fetch(interaction.member.id);
                            // Make sure the member still exists and doesn't have the role before re-adding.
                            if (member && !member.roles.cache.has(mod_RoleID)) {
                                await member.roles.add(mod_RoleID, 'Timeout duration expired, re-adding role.');
                                console.log(`Re-added role ${mod_RoleID} to ${member.user.tag}`);
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
                    await interaction.followUp(`You rolled a dice to decide your destiny... You rolled a ${randomint}! You're free to go!`);
                }
            } else {
                interaction.followUp(`Looks like you're going away for some ti- Oh wait it's you boss! You're free to go... (No more raping...PLEASE)`);
            }
            
        }
    }
}