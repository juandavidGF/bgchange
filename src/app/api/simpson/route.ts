import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  // 1. Get request data (in JSON format) from the client
  const req = await request.json();

  const {image, prompt} = req;

  if(!image || !prompt) return NextResponse.json(
      { error: 'not image or prompt /api' },
      { status: 500 }
    );
  
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  const model =
    "fofr/sdxl-simpsons-characters:f4d36a72b43ea2fd511cab0afb32539955ee5b28b65c8e3fb7d8abd254be8e91";

  const input = {
    width: 1024,
    height: 1024,
    prompt: prompt,
    refine: "expert_ensemble_refiner",
    scheduler: "K_EULER",
    lora_scale: 0.6,
    num_outputs: 1,
    guidance_scale: 7.5,
    apply_watermark: false,
    high_noise_frac: 0.8,
    negative_prompt: "ugly, broken, distorted, artefacts, 3D, render, photography",
    prompt_strength: 0.8,
    num_inference_steps: 30
  }
  
  
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
