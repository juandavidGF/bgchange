import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  // 1. Get request data (in JSON format) from the client
  const req = await request.json();

  const {image, prompt} = req;

  if(!image || !!prompt) return NextResponse.json(
      { error: 'not image or prompt' },
      { status: 500 }
    );
  
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  const model =
    "dhanushreddy291/photo-background-generation:1db5ee211d65558d3fd11fc60bc00073f300d7a3a0b5abbfafbd20239ac58d2f";

  const input = {
    image,
    prompt,
    num_outputs: 1,
    negative_prompt: "3d, cgi, render, bad quality, normal quality",
    num_inference_steps: 30,
    controlnet_conditioning_scale: 1
  };

  const output = await replicate.run(model, { input });

  if (!output) {
    console.log('Something went wrong');
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }

  console.log('Output', output);
  return NextResponse.json({ output }, { status: 201 });
}
