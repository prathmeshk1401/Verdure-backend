const mongoose = require('mongoose');

// Cache the connection across Lambda invocations (serverless) to reuse sockets
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment');
    }

    if (!cached.promise) {
        const opts = {};

        // Attempt to connect, but capture errors to give clearer guidance
        cached.promise = mongoose
            .connect(process.env.MONGO_URI, opts)
            .then((mongooseInstance) => mongooseInstance)
            .catch((err) => {
                // redact credentials when logging
                let redacted = process.env.MONGO_URI;
                try {
                    // remove credentials between '//' and '@'
                    redacted = redacted.replace(/:(?:[^@]+)@/, ':*****@');
                } catch (e) {
                    /* ignore */
                }
                console.error('Failed to connect to MongoDB with URI:', redacted);
                // rethrow to be handled by caller
                throw err;
            });
    }

    cached.conn = await cached.promise;
    console.log('MongoDB connected (serverless-friendly)');
    return cached.conn;
};

module.exports = connectDB;
