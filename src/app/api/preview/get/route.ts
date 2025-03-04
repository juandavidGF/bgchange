import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) throw Error('REPLICATE_API_TOKEN not found');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    // For Gradio results (which are immediate)
    if (id.startsWith('gradio_')) {
      return NextResponse.json({
        status: 'succeeded',
        output: null // Output was already returned in the POST response
      });
    }

    // For Replicate results
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN!,
    });

    const prediction = await replicate.predictions.get(id);
    
    return NextResponse.json({
      status: prediction.status,
      output: prediction.output,
    });
  } catch (error: any) {
    console.error('Error checking prediction status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
