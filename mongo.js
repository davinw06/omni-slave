const mongoose = require('mongoose');

// Replace with your actual MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/admin';
// Or for Atlas:
// const mongoURI = 'mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false, // Deprecated, remove if present
    // useCreateIndex: true,    // Deprecated, remove if present
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error('MongoDB connection error:', err));

// You might also want to listen for connection events:
mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open to ' + mongoURI);
});

mongoose.connection.on('error', (err) => {
    console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});