import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  const req = await request.json();

  const {image, prompt, source} = req;

  console.log('/api', {image, prompt, source});

  if(!image || !prompt || !source) {
    return NextResponse.json(
      { error: 'not image, prompt or source /api' },
      { status: 500 }
    );
  }
  
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  const model =
    "zsxkib/ic-light:d41bcb10d8c159868f4cfbd7c6a2ca01484f7d39e4613419d5952c61562f1ba7";

  const input = {
    cfg: 2,
    steps: 25,
    width: 512,
    height: 640,
    prompt: prompt,
    light_source: "Left Light",
    highres_scale: 1.5,
    output_format: "webp",
    subject_image: image,
    lowres_denoise: 0.9,
    output_quality: 80,
    appended_prompt: "best quality",
    highres_denoise: 0.5,
    negative_prompt: "lowres, bad anatomy, bad hands, cropped, worst quality, dark",
    number_of_images: 1
  }

  let output: any | null = null;

  try {
    output = await replicate.run(model, { input });
  } catch (error: any) {
    console.log('illuminai /api', {error});
    return NextResponse.json(
      { error: `Something went wrong, ${error.message}` },
      { status: 500 }
    );
  }

  
  
  // const output = [
  //   "https://replicate.delivery/pbxt/DCiXOO8IjXKeM6ecacI0hP7jEBfHX5uYt3a0bf85dNNYBwHMB/generated_0.webp"
  // ]

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
