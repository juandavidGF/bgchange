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

    // Transform keys to strings
    const transformedDocument = Object.fromEntries(
      Object.entries(documentToInsert).map(([key, value]) => [String(key), value])
    );

    const result = await collection.insertOne(transformedDocument);

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

  // Verify the database exists
  const dbList = await client.db().admin().listDatabases();
  const dbExists = dbList.databases.some(db => db.name === dbName);
  if (!dbExists) {
    throw new Error(`Database "${dbName}" does not exist`);
  }

  // Verify the collection exists
  const collections = await database.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    throw new Error(`Collection "${collectionName}" does not exist`);
  }

  return { database, collection };
}