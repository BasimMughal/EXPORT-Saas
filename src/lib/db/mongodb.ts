import { MongoClient, type Db } from 'mongodb';

import { env } from '@/env';

declare global {
  // eslint-disable-next-line no-var
  var mongoClientCache:
    | {
        client: MongoClient | null;
        promise: Promise<MongoClient> | null;
      }
    | undefined;
}

const cached = globalThis.mongoClientCache ?? {
  client: null,
  promise: null,
};

globalThis.mongoClientCache = cached;

export async function connectMongoClient() {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    cached.promise = new MongoClient(env.MONGODB_URI).connect();
  }

  cached.client = await cached.promise;
  return cached.client;
}

export async function getMongoDb(): Promise<Db> {
  const client = await connectMongoClient();
  return client.db(env.MONGODB_DB);
}
