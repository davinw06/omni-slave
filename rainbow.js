const { createCanvas, loadImage } = require('canvas');
const { ImgurClient } = require('imgur');

// IMPORTANT: Replace 'YOUR_IMGUR_CLIENT_ID' with your actual Imgur Client ID
const imgurClient = new ImgurClient({ clientId: 'cafe29bcade375e' });

/**
 * Applies a rainbow filter over a given image URL and uploads it to Imgur.
 * @param {string} imageUrl The URL of the image to filter.
 * @returns {Promise<string>} A promise that resolves with the URL of the uploaded, filtered image.
 */
async function applyRainbowFilter(imageUrl) {
    console.log(`Attempting to apply rainbow filter to: ${imageUrl}`);

    try {
        // Load the user's avatar image from the URL
        const image = await loadImage(imageUrl);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the avatar onto the canvas
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Create a horizontal rainbow gradient
        const gradient = ctx.createLinearGradient(0, 0, image.width, 0);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');     // Red
        gradient.addColorStop(0.16, 'rgba(255, 127, 0, 0.5)'); // Orange
        gradient.addColorStop(0.33, 'rgba(255, 255, 0, 0.5)'); // Yellow
        gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.5)');   // Green
        gradient.addColorStop(0.66, 'rgba(0, 0, 255, 0.5)');   // Blue
        gradient.addColorStop(0.83, 'rgba(75, 0, 130, 0.5)');  // Indigo
        gradient.addColorStop(1, 'rgba(148, 0, 211, 0.5)');    // Violet

        // Apply the gradient as an overlay
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, image.width, image.height);

        // Convert the canvas to a buffer
        const buffer = canvas.toBuffer('image/png');

        // Upload the filtered image buffer to Imgur using the client instance
        const uploadResponse = await imgurClient.upload({
            image: buffer.toString('base64'),
            type: 'base64'
        });

        if (uploadResponse && uploadResponse.data && uploadResponse.data.link) {
            const uploadedImageUrl = uploadResponse.data.link;
            console.log(`Uploaded image to Imgur: ${uploadedImageUrl}`);
            return uploadedImageUrl;
        } else {
            console.error('Imgur upload response did not contain a link or was unsuccessful:', uploadResponse);
            // Fallback to a placeholder image if the upload fails
            const placeholderFilteredUrl = "https://placehold.co/256x256/FF00FF/FFFFFF?text=Upload+Failed";
            return placeholderFilteredUrl;
        }
    } catch (error) {
        console.error('Error applying rainbow filter or uploading to Imgur:', error);
        // Fallback to a placeholder image on any error
        const placeholderFilteredUrl = "https://placehold.co/256x256/FF00FF/FFFFFF?text=Error+Filter";
        return placeholderFilteredUrl;
    }
}

// Export the function so it can be used in other files
module.exports = { applyRainbowFilter };
