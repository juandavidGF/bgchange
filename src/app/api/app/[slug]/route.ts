import { NextResponse } from 'next/server';
import Replicate from 'replicate';

type Slug = "createVideo" | "freshink";
type Status = "successful" | "failed" | "canceled";

export async function POST(
  request: Request,
  { params }: { params: { slug: Slug } },
) {
  const req = await request.json();

  const slug = params.slug;
  if(slug !== 'freshink' && slug !== 'createVideo') return NextResponse.json(
    { error: `Something went wrong, api, slug ${slug} not allowed` },
    { status: 500 }
  );

  try {
    const {sheme} = getModel({slug});
    const {prompt} = req;
  
    if(!prompt) return NextResponse.json(
        { error: 'not image or prompt /api' },
        { status: 500 }
      );
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN as string,
    });
  
    const model: 
      `${string}/${string}` | `${string}/${string}:${string}` | undefined = sheme?.model;
  
    if(!model || typeof model !== "string") throw Error(`not model found or format issue ${model}`);
  
    const input = sheme?.input;
    if(!input) throw Error('input is not a object');
  
    input.prompt = prompt;
  
    // const output = await replicate.run(model, { input });
    const output = await replicate.predictions.create({
      model,
      input,
    });
  
    if (!output) {
      console.log('Something went wrong');
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      );
    }
  
    console.log({output});
    return NextResponse.json({ output }, { status: 201 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function getModel({slug}: {slug: string}) {
  let sheme;
  let model: `${string}/${string}` | `${string}/${string}:${string}`;

  console.log({slug});

  switch (slug) {
    case 'freshink':
      model = "fofr/sdxl-fresh-ink:8515c238222fa529763ec99b4ba1fa9d32ab5d6ebc82b4281de99e4dbdcec943";
      sheme = {
        model: model,
        input: {
          width: 1024,
          height: 1024,
          prompt: "A fresh ink TOK tattoo",
          refine: "expert_ensemble_refiner",
          scheduler: "K_EULER",
          lora_scale: 0.6,
          num_outputs: 1,
          guidance_scale: 7.5,
          apply_watermark: false,
          high_noise_frac: 0.9,
          negative_prompt: "ugly, broken, distorted",
          prompt_strength: 0.8,
          num_inference_steps: 25
        }
      }
      break;
    case 'createVideo':
      model = "chenxwh/diffsynth-exvideo:b3b0e929bf918153fbc0c5444fbe215f5cdbdbdf610910cf4dfcb6f6006e4783";
      sheme = {
        model,
        input: {
          prompt: "bonfire, on the stone",
          num_frames: 128,
          negative_prompt: "错误的眼睛，糟糕的人脸，毁容，糟糕的艺术，变形，多余的肢体，模糊的颜色，模糊，重复，病态，残缺，",
          num_inference_steps: 25,
          num_inference_steps_upscale_video: 25
        }
      }
      break;
    default:
      throw Error('case not found');
  }

  return {sheme};
}
