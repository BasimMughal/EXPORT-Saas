import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dbPath = resolve(process.cwd(), '.mongo-data');
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: 'export_management_saas',
    dbPath,
    storageEngine: 'wiredTiger',
  },
});

const uri = mongod.getUri();
console.log(`MongoDB ready at ${uri}`);
console.log('Keep this terminal open while using the app.');

const shutdown = async () => {
  console.log('Stopping MongoDB...');
  await mongod.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep process alive
await new Promise(() => {});
