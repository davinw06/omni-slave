// This is a standalone script, save it as a new file, e.g., 'migrate.js'

const mongoose = require('mongoose');

// Assuming your existing message schema is in 'messageSchema.js'
const Message = require('./Schemas.js/messageSchema');
// Assuming your new user schema is in 'userSchema.js'
const User = require('./Schemas.js/userSchema');

// Replace this with your MongoDB connection URI
const mongoURI = process.env.MONGO_URI;

// This function performs the data migration
async function migrateData() {
    console.log('Starting data migration...');

    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB Atlas.');

        // Use a MongoDB aggregation pipeline to count messages per user
        const messageCounts = await Message.aggregate([
            {
                $group: {
                    _id: '$userId', // Group by userId
                    messageCount: { $sum: 1 } // Count how many messages are in each group
                }
            }
        ]);

        console.log(`Found a total of ${messageCounts.length} users with messages.`);
        
        // Loop through the results and update the new User collection
        for (const userCount of messageCounts) {
            await User.findOneAndUpdate(
                { userId: userCount._id },
                { $set: { messageCount: userCount.messageCount } },
                { upsert: true }
            );
        }

        console.log('Data migration complete! All historical counts have been updated.');
        
    } catch (error) {
        console.error('Error during data migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// Run the migration function
migrateData();
