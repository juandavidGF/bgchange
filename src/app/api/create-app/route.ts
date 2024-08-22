import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not defined');
const client = new MongoClient(uri);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await client.connect();
      const database = client.db('your_database_name');
      const collection = database.collection('app_configurations');

      const result = await collection.insertOne(req.body);

      res.status(201).json({ message: 'App configuration created', id: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: 'Error creating app configuration', error });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}