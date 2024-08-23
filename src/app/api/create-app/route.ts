import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      
      const { collection } = await validateMongoDBConnection(client);

      const result = await collection.insertOne(req.body);

      res.status(201).json({ message: 'App configuration created', id: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: 'Error creating app configuration', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

async function validateMongoDBConnection(client: MongoClient) {
  const dbName = process.env.MONGODB_DB_NAME;
  const collectionName = process.env.MONGODB_COLLECTION_NAME;

  if (!dbName || !collectionName) {
    throw new Error('MONGODB_DB_NAME and MONGODB_COLLECTION_NAME must be set in environment variables');
  }
  
  const database = client.db(dbName);
  const collection = database.collection(collectionName);

  // Verify the database exists, create it if it doesn't
  const dbList = await client.db().admin().listDatabases();
  const dbExists = dbList.databases.some(db => db.name === dbName);
  if (!dbExists) {
    await client.db(dbName).createCollection('temp');
    console.log(`Created "${dbName}" database`);
    await client.db(dbName).dropCollection('temp');
  }

  // Verify the collection exists, create it if it doesn't
  const collections = await database.listCollections({ name: 'apps' }).toArray();
  if (collections.length === 0) {
    await database.createCollection('apps');
    console.log('Created "apps" collection');
  }

  return { database, collection };
}
