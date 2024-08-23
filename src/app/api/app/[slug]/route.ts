import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { Slug } from '@/types';
import { Configurations } from "@/types";
import configurations from '@/common/configuration';
import { Client, handle_file } from "@gradio/client";

type Status = "successful" | "failed" | "canceled";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) throw Error(`not REPLICATE_API_TOKEN ${REPLICATE_API_TOKEN}`);

export async function POST(
  request: Request,
  { params }: { params: { slug: Slug } },
) {
  
  const slug = params.slug;

  // return NextResponse.json(
  //   { status: 201 }
  // );

  try {

    if (slug  === 'EVF-SAM' && configurations[slug]) {
      console.log('flag1');
      const config = configurations[slug];
      const formData = await request.formData();
      console.log('flag1.1');

      const image = formData.get(configurations['EVF-SAM'].inputs[0].key) as File | null;
      const prompt = formData.get(configurations['EVF-SAM'].inputs[1].key) as String | null;

      console.log('flag1.2', {image, prompt});

      if (!image || !prompt) {
        return NextResponse.json(
          { error: "Both image and prompt are required." }, 
          { status: 400 }
        );
      }

      
      const imageBuffer = await image.arrayBuffer();
      console.log('flag2', config.client, config.path);

      const app = await Client.connect(config.client as string);
      console.log('flag2.1', config.client, config.path);
      const output = await app.predict(config.path as string, {
        image_np: handle_file(image),
        prompt: prompt
      });
      
      console.log('gradio EV', output.data);
      if (!output) {
        console.log('Something went wrong');
        return NextResponse.json(
          { error: 'Something went wrong' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        output.data,
        { status: 201 }
      );
    } else if(configurations[slug]) {
      const req = await request.json();
      const config = configurations[slug];

      let indImg = 0;

      if (config.type === 'replicate') {
        const replicate = new Replicate({
          auth: REPLICATE_API_TOKEN,
        });

        const model: 
          `${string}/${string}` | `${string}/${string}:${string}` | undefined = config.model;

        if(!model || typeof model !== "string") throw Error(`not model found or format issue ${model}`);

        const version = config.version as string | undefined;

        // I need to check how to convert array of object, to object,

        const input: { [key: string]: any } = {};
        
        // TODO -> Make the extraction of the req automatic, define in the fronted, the name related with the config object ...

        let indxImage = 0;
        config.inputs.forEach(item => {
          if (item.key) {
            if(item.show) {
              const {type} = item;
              if (type === 'image') {
                const {image} = req;
                if(!image) return NextResponse.json(
                  { error: 'not image /api' },
                  { status: 500 }
                );
                console.log({image})
                input[item.key] = image[indxImage];
              } else if (type === 'prompt') {
                const {prompt} = req;
                if(!prompt) return NextResponse.json(
                  { error: 'not image /api' },
                  { status: 500 }
                );
                input[item.key] = prompt;
              }
            } else {
              input[item.key] = item.value;
            }
          }
        });

        if(!input) throw Error('api/app/[]/ input is not a object');

        console.log('xxx ->', {model, version , input});
        const output = await replicate.predictions.create({
          model,
          version,
          input,
        });

        // const output = {
        //   id: "nbjvdfmzwdrgg0ch1tn8dee3j8"
        // };
        
        if (!output) {
          console.log(`api/[${slug}] !output`, {output});
          console.log('Something went wrong');
          return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          output,
          { status: 201 }
        );
      } else if (config.type === 'gradio') {
        const params = config.inputs.map(item => {
          if(item.show) {
            if(item.type === 'image') {
              const newImg = req.image[indImg];
              indImg++;
              return newImg;
            } else if (item.type === 'prompt') {
              return req.prompt;
            } else {
              return item.value;
            }
          }
        });
        const app = await Client.connect(config.client as string);
        const output = await app.predict("/tryon", params)

        console.log({output});
        if (!output) {
          console.log('Something went wrong');
          return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          output.data,
          { status: 201 }
        );

        
      }
    } else {
      if(slug !== 'freshink' 
        && slug !== 'createVideo'
        && slug !== "hairStyle"
        && slug !== "livePortrait"
        && slug !== "upscaler"
        && slug !== 'tryon'
      ) return NextResponse.json(
        { error: `Something went wrong, api, slug ${slug} not found` },
        { status: 500 }
      );
    }

    const req = await request.json();

    const {sheme} = getModel({slug});

    Object.entries(sheme.input).forEach((item) => {
      if(item[1] === 'image') {
        const {image} = req;
        if(!image) return NextResponse.json(
          { error: 'not image /api' },
          { status: 500 }
        );
        (sheme.input as any)[item[0]] = image;
      } else if (item[1] === 'video') {
        const {video} = req;
        if(!video) return NextResponse.json(
          { error: 'not video req /api' },
          { status: 500 }
        );
        (sheme.input as any)[item[0]] = video;
        // (sheme.input as any)[item[0]] = "https://replicate.delivery/pbxt/LEQxLFMUNZMiKt5PWjyMJIbTdvKAb5j3f0spuiEwt9TEbo8B/d0.mp4";
      } else if(item[1] === 'prompt') {
        const {prompt} = req;
        if(!prompt) return NextResponse.json(
          { error: 'not prompt /api' },
          { status: 500 }
        );
        (sheme.input as any)[item[0]] = prompt;
      }
    })
    
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });
  
    const model: 
      `${string}/${string}` | `${string}/${string}:${string}` | undefined = sheme?.model;
  
    if(!model || typeof model !== "string") throw Error(`not model found or format issue ${model}`);

    const version: string | undefined = sheme.version;
    if(!version) throw Error('api/app/[]/ version not found');
  
    const input = sheme?.input;
    if(!input) throw Error('api/app/[]/ input is not a object');

    console.log('xxx ->', {model, version , input});
    const output = await replicate.predictions.create({
      version,
      input,
    });

    // const output = {
    //   id: "87h588fapdrgg0cgmgftvtz87r"
    // };


    console.log({output});
    if (!output) {
      console.log('Something went wrong');
      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      output,
      { status: 201 }
    );
  } catch (error: any) {
    console.error("api/app/[] err" + JSON.stringify(error, null, 2));
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
          prompt: "prompt",
          num_frames: 128,
          negative_prompt: "错误的眼睛，糟糕的人脸，毁容，糟糕的艺术，变形，多余的肢体，模糊的颜色，模糊，重复，病态，残缺，",
          num_inference_steps: 25,
          num_inference_steps_upscale_video: 25
        }
      }
      break;
    case 'upscaler':
      model = "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";
      sheme = {
        model,
        input: {
          seed: 1337,
          image: "image",
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
      }
      break;
    case 'hairStyle':
      model = "orpatashnik/styleclip:7af9a66f36f97fee2fece7dcc927551a951f0022cbdd23747b9212f23fc17021";
      sheme = {
        model,
        version: "7af9a66f36f97fee2fece7dcc927551a951f0022cbdd23747b9212f23fc17021",
        input: {
          input: "image",
          target: "prompt",
          neutral: "a face",
          manipulation_strength: 4.1,
          disentanglement_threshold: 0.15
        },
      }
      break;
    case 'livePortrait':
      model = "fofr/live-portrait:067dd98cc3e5cb396c4a9efb4bba3eec6c4a9d271211325c477518fc6485e146";
      const version = "067dd98cc3e5cb396c4a9efb4bba3eec6c4a9d271211325c477518fc6485e146";
      sheme = {
        model,
        version,
        input: {
          face_image: "image",
          driving_video: "video",
          live_portrait_dsize: 512,
          live_portrait_scale: 2.3,
          video_frame_load_cap: 128,
          live_portrait_lip_zero: true,
          live_portrait_relative: true,
          live_portrait_vx_ratio: 0,
          live_portrait_vy_ratio: -0.12,
          live_portrait_stitching: true,
          video_select_every_n_frames: 1,
          live_portrait_eye_retargeting: false,
          live_portrait_lip_retargeting: false,
          live_portrait_lip_retargeting_multiplier: 1,
          live_portrait_eyes_retargeting_multiplier: 1
        }
      }
      break;
    // case 'tryon':

    //   break;
    default:
      throw Error('slug not found');
      break;
  }

  return {sheme};
}