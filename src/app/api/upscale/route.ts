import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  const req = await request.json();

  const {image} = req;

  // console.log('/api', {image});

  if(!image) {
    return NextResponse.json(
      { error: 'not image /api' },
      { status: 500 }
    );
  }
  
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  const model =
    "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";
  
  const input = {
    seed: 1337,
    image: image,
    prompt: "masterpiece, best quality, highres, <lora:more_details:0.5> <lora:SDXLrender_v2.0:1>",
    dynamic: 6,
    handfix: "disabled",
    pattern: false,
    sharpen: 0,
    sd_model: "juggernaut_reborn.safetensors [338b85bc4f]",
    scheduler: "DPM++ 3M SDE Karras",
    creativity: 0.35,
    lora_links: "",
    downscaling: false,
    resemblance: 0.6,
    scale_factor: 2,
    tiling_width: 112,
    output_format: "png",
    tiling_height: 144,
    custom_sd_model: "",
    negative_prompt: "(worst quality, low quality, normal quality:2) JuggernautNegative-neg",
    num_inference_steps: 18,
    downscaling_resolution: 768
  }

  let output: any | null = null;

  try {
    output = await replicate.run(model, { input });
  } catch (error: any) {
    console.log({error});
    return NextResponse.json(
      { error: `Something went wrong, ${error.message}` },
      { status: 500 }
    );
  }

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
