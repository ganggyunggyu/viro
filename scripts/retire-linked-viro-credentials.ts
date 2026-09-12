import { mongo } from 'mongoose';
import { parseRetirementOptions } from './retire-linked-viro-credentials-options';
import { createRetirementStore } from './retire-linked-viro-credentials-store';
import { retireLinkedCredentials } from '../src/shared/lib/dabut-auth/retirement';

const main = async () => {
  const { userId, dabutUserId, apply } = parseRetirementOptions(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DB;
  if (!uri || !database) throw new Error('MONGODB_URI and MONGODB_DB must be provided explicitly');
  const client = new mongo.MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  try {
    await client.connect();
    const result = await retireLinkedCredentials(createRetirementStore(client.db(database)), { userId, dabutUserId }, apply);
    console.log(JSON.stringify({ database, ...result }, null, 2));
  } finally { await client.close(); }
};

main().catch(() => {
  console.error('Credential retirement failed. Check the explicit member mapping, options and database connection.');
  process.exitCode = 1;
});
