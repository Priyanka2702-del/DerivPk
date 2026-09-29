// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//   throw new Error("Please define MONGODB_URI in .env.local");
// }

// type MongooseCache = {
//   conn: typeof mongoose | null;
//   promise: Promise<typeof mongoose> | null;
// };

// declare global {
//   // eslint-disable-next-line no-var
//   var mongooseCache: MongooseCache | undefined;
// }

// const cached: MongooseCache = global.mongooseCache ?? {
//   conn: null,
//   promise: null,
// };

// global.mongooseCache = cached;

// export async function connectDB() {
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     cached.promise = mongoose.connect(MONGODB_URI, {
//       maxPoolSize: 10,
//       minPoolSize: 2,

//       serverSelectionTimeoutMS: 10000,
//       socketTimeoutMS: 45000,

//       family: 4,
//     });
//   }

//   try {
//     cached.conn = await cached.promise;
//   } catch (error) {
//     cached.promise = null;
//     throw error;
//   }

//   return cached.conn;
// }

import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache:
    | MongooseCache
    | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ?? {
    conn: null,
    promise: null,
  };

global.mongooseCache = cached;

export async function connectDB() {
  const MONGODB_URI =
    process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define MONGODB_URI in environment variables."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(
      MONGODB_URI,
      {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      }
    );
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
