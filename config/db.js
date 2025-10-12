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
        const opts = {
            // mongoose v6+ no longer needs useNewUrlParser/useUnifiedTopology, but keep safe
            // useUnifiedTopology: true,
            // useNewUrlParser: true,
        };

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
            return mongooseInstance;
        });
    }

    cached.conn = await cached.promise;
    console.log('MongoDB connected (serverless-friendly)');
    return cached.conn;
};

module.exports = connectDB;
