import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/export_management_saas';
const MONGODB_DB = process.env.MONGODB_DB ?? 'export_management_saas';

const DEMO_USER = {
  name: 'Basim Admin',
  email: 'admin@exportflow.com',
  password: 'Admin@12345',
  role: 'admin',
};

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });

  const users = mongoose.connection.collection('users');
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);

  await users.updateOne(
    { email: DEMO_USER.email },
    {
      $set: {
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        passwordHash,
        role: DEMO_USER.role,
        status: 'active',
        organizationId: null,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        lastLoginAt: null,
      },
    },
    { upsert: true },
  );

  console.log('Demo user ready');
  console.log(`Email:    ${DEMO_USER.email}`);
  console.log(`Password: ${DEMO_USER.password}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
