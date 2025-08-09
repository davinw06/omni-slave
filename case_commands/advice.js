const triggerSentence = "Buddha, give this man some advice🗣️🗣️🔥";

// Define the bot's responses when the trigger sentence is detected
const botResponses = [
    "It would be best if you just ended it gang negl...",
    "Why not just beat ur wife? That usually helps...",
    "JUST RAPE A MAN!",
    "Well you can always jump off a bridge...",
    "Maybe you should go out until someone tells you that you're ugly. You can call it a 'quick walk'"
];

/**
 * Executes the bad advice command logic.
 * @param {Message} message - The Discord message object that triggered the event.
 */
async function execute(message) {
    // Convert the message content to lowercase and trim whitespace for robust matching
    const normalizedMessageContent = message.content.toLowerCase().trim();
    const normalizedTriggerSentence = triggerSentence.toLowerCase().trim();

    // Check if the normalized message content exactly matches the normalized trigger sentence
    if (normalizedMessageContent === normalizedTriggerSentence) {
        try {
            // Select a random response from the array
            const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
            // Reply to the message that triggered the command
            await message.reply(randomResponse);
            console.log(`Responded to "${message.content}" with advice from ${message.author.tag}`);
        } catch (error) {
            console.error(`Error replying to message in advice.js: ${error}`);
        }
    }
}

// Export the command's properties and execution logic
module.exports = {
    name: 'advice', // A name for this command (useful for logging/identification)
    description: 'Responds with bad advice when a specific sentence is said.',
    execute: execute,
};