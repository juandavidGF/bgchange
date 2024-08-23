import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';


export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const body = await request.json();
    
    const { collection } = await validateMongoDBConnection(client);

    const documentToInsert = {
      ...body,
      createdAt: new Date()
    };

    const result = await collection.insertOne(documentToInsert);

    return NextResponse.json({ message: 'App configuration created', id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/create-app:', error);
    return NextResponse.json({ message: 'Error creating app configuration', error: error.message }, { status: 500 });
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
  const collections = await database.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    await database.createCollection(collectionName);
    console.log(`Created "${collectionName}" collection`);
  }

  return { database, collection };
}