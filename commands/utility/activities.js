const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Displays member activities: playing, streaming, listening (Spotify cover), time elapsed.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member whose activities you want to check.')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('member') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id);

        let embedColor = 0xFF0000; // Default color
        let activityDescription = '';
        let thumbnailURL = member.user.displayAvatarURL({ dynamic: true, size: 256 }); // Default to user's avatar

        const presence = member.presence;

        if (presence) {
            const activities = presence.activities;

            // --- Thumbnail Logic ---
            // Prioritize Spotify album cover using activity.assets.largeImageURL()
            const spotifyActivity = activities.find(activity =>
                activity.type === ActivityType.Listening && activity.name === 'Spotify'
            );

            if (spotifyActivity && spotifyActivity.assets && spotifyActivity.assets.largeImageURL()) {
                thumbnailURL = spotifyActivity.assets.largeImageURL();
            } else {
                // Fallback to other activity images if no Spotify or if Spotify has no largeImage
                const otherActivityWithImage = activities.find(activity =>
                    activity.type !== ActivityType.Custom && activity.assets && activity.assets.largeImage
                );

                if (otherActivityWithImage) {
                    // For non-Spotify activities, use largeImageURL() if available, else construct
                    thumbnailURL = otherActivityWithImage.assets.largeImageURL() ||
                                   `https://cdn.discordapp.com/app-assets/${otherActivityWithImage.applicationId}/${otherActivityWithImage.assets.largeImage}.png`;
                }
            }
            // If no activity image, thumbnailURL remains the user's avatar (initialized at the start)
            // --- End Thumbnail Logic ---


            const otherActivities = activities.filter(activity => activity.type !== ActivityType.Custom);

            if (otherActivities.length > 0) {
                activityDescription = otherActivities.map(activity => {
                    let name = activity.name;
                    let state = activity.state ? ` (${activity.state})` : '';
                    let details = activity.details ? ` - ${activity.details}` : '';
                    let url = activity.url ? ` (URL: <${activity.url}>)` : '';

                    let elapsedTime = '';
                    if (activity.timestamps && activity.timestamps.start) {
                        const startTime = activity.timestamps.start.getTime();
                        const now = Date.now();
                        const duration = now - startTime;

                        const seconds = Math.floor((duration / 1000) % 60);
                        const minutes = Math.floor((duration / (1000 * 60)) % 60);
                        const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

                        const formatTwoDigits = (num) => String(num).padStart(2, '0');

                        elapsedTime = ` [Elapsed: ${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}]`;
                    }

                    switch (activity.type) {
                        case ActivityType.Playing:
                            return `> Playing: **${name}**${details}${state}${elapsedTime}`;
                        case ActivityType.Streaming:
                            return `> Streaming: **${name}**${details}${state}${url}${elapsedTime}`;
                        case ActivityType.Listening:
                            if (name === 'Spotify') {
                                return `> Listening to Spotify: **${activity.details || 'N/A'}** by ${activity.state || 'N/A'}${elapsedTime}`;
                            }
                            return `> Listening to: **${name}**${details}${state}${elapsedTime}`;
                        case ActivityType.Watching:
                            return `> Watching: **${name}**${details}${state}${elapsedTime}`;
                        default:
                            return `> Other: **${name}**${details}${state}${elapsedTime}`;
                    }
                }).join('\n');
            } else {
                activityDescription = `**${member.user.tag}** is not currently engaged in any activities (playing, streaming, etc.).`;
            }
        } else {
            activityDescription = `**${member.user.tag}** is offline or their presence information is not available.`;
        }

        const activitiesEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${member.user.displayName}'s Activities`)
            .setDescription(activityDescription)
            .setThumbnail(thumbnailURL)
            .setFooter({ text: `Requested by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [activitiesEmbed] });
    },
};
