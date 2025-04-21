import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { Client, handle_file } from "@gradio/client";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) throw Error('REPLICATE_API_TOKEN not found');

async function convertBase64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64);
  return await response.blob();
}

interface ConfigInput {
  key: string;
  component: string;
  show?: boolean;
  value?: any;
}

interface PreviewConfig {
  type: 'replicate' | 'gradio';
  model?: string;
  version?: string;
  client?: string;
  path?: string;
  inputs: ConfigInput[];
  endpoint?: string;
}

export async function POST(request: Request) {
  console.log('Preview POST request received');
  try {
    const { config, params } = await request.json();
    console.log('Preview request:', { config, params });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    // Handle Replicate models
    if (config.type === 'replicate') {
      const replicate = new Replicate({
        auth: REPLICATE_API_TOKEN,
      });

      if (!config.model || typeof config.model !== 'string') {
        throw new Error('Model identifier is required for Replicate models');
      }

      if (!config.version) {
        throw new Error('Model version is required for Replicate models');
      }

      // Process inputs according to configuration
      const input: { [key: string]: any } = {};
      const typedConfig = config as PreviewConfig;
      typedConfig.inputs.forEach((item: ConfigInput) => {
        if (item.show) {
          switch (item.component) {
            case 'image':
              if (params.image && params.image[item.key]) {
                input[item.key] = params.image[item.key];
              }
              break;
            case 'prompt':
              input[item.key] = params[item.key];
              break;
            case 'textbox':
              input[item.key] = params[item.key];
              break;
            default:
              input[item.key] = params[item.key];
          }
        } else if (item.value !== undefined) {
          // Use default value for hidden inputs
          input[item.key] = item.value;
        }
      });

      console.log('Replicate input:', input);

      const prediction = await replicate.predictions.create({
        model: typedConfig.model as `${string}/${string}`,
        version: typedConfig.version,
        input,
      });

      console.log('Replicate prediction started:', prediction);

      return NextResponse.json({ 
        id: prediction.id,
        status: prediction.status
      }, { status: 201 });
    }
    // Handle Gradio models
    else if (config.type === 'gradio') {
      const typedConfig = config as PreviewConfig;
      if (!typedConfig.client || !typedConfig.path || !typedConfig.endpoint) {
        throw new Error('Client and path are required for Gradio models');
      }

      const processedParams: Record<string, any> = {};

      // Process each input
      for (const item of typedConfig.inputs) {
        const input = item as ConfigInput;
        
        if (!input.show) {
          if (input.value !== undefined) {
            processedParams[input.key] = input.value;
          }
          continue;
        }

        switch (input.component) {
          case 'image': {
            const image = params.image && params.image[input.key];
            if (image) {
              if (typeof image === 'string' && image.startsWith('data:image/')) {
                processedParams[input.key] = await handle_file(await convertBase64ToBlob(image));
              } else {
                processedParams[input.key] = await handle_file(image);
              }
            }
            break;
          }
          case 'textbox':
            processedParams[input.key] = params[input.key];
            break;
          case 'prompt':
            processedParams[input.key] = params[input.key];
            break;
          default:
            processedParams[input.key] = params[input.key] !== undefined ? params[input.key] : input.value;
            break;
        }
      }

      console.log('Gradio params:', {processedParams, typedConfig});

      let app;

      try {
        app = await Client.connect(typedConfig.client!);
        console.log('app:', {path: typedConfig.client, processedParams});
      } catch (error:any) {
        throw new Error(`Error connecting app to Gradio client: ${error.message}`);
      }
      console.log('Gradio app connected:', !!app);

      let result;

      // Validate parameters
      if (!processedParams || typeof processedParams !== 'object') {
        throw new Error('Invalid parameters for prediction');
      }

      const predictParams = {
        endpoint: typedConfig.endpoint,
        data: processedParams,
      }
      console.log('Gradio predict params:', predictParams);
      
      try {
        // Get API info to validate endpoint and parameters
        // const apiInfo = await app.view_api();
        
        // if (!apiInfo.named_endpoints[typedConfig.endpoint]) {
        //   console.error('Available endpoints:', apiInfo.named_endpoints);
        //   // TODO we need to manage the alternative
        //   throw new Error(`Endpoint ${typedConfig.endpoint} not found in app`);
        // }
        // console.log('after apiInfo:');

        // const endpointInfo = apiInfo.named_endpoints[typedConfig.endpoint];
        // const requiredParams = endpointInfo.parameters
        //   ? endpointInfo.parameters
        //       .filter((p: any) => !p.parameter_has_default)
        //       .map((p: any) => p.parameter_name)
        //   : [];

        // const missingParams = requiredParams.filter(
        //   (param: string) => processedParams[param] === undefined
        // );
        
        // if (missingParams.length > 0) {
        //   throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
        // }

        // Log detailed parameter info before prediction
        console.log('Final prediction parameters:', {
          endpoint: typedConfig.endpoint,
          params: processedParams,
          paramTypes: Object.entries(processedParams).map(([k, v]) => ({
            param: k,
            type: typeof v,
            value: v
          }))
        });

        // Prepare final prediction parameters
        const predictionParams = {...processedParams};

        // Convert image Blobs directly to base64 strings
        if (predictionParams.input_fg instanceof Blob) {
          const arrayBuffer = await predictionParams.input_fg.arrayBuffer();
          const base64String = Buffer.from(arrayBuffer).toString('base64');
          predictionParams.input_fg = `data:image/png;base64,${base64String}`; 
        }
        if (predictionParams.scribble_map instanceof Blob) {
          const arrayBuffer = await predictionParams.scribble_map.arrayBuffer();
          const base64String = Buffer.from(arrayBuffer).toString('base64');
          predictionParams.scribble_map = `data:image/png;base64,${base64String}`; 
        }

        // Log the final parameters being sent
        console.log('Final prediction parameters (base64 converted):', {
          endpoint: typedConfig.endpoint,
          params: predictionParams,
          paramTypes: Object.entries(predictionParams).map(([k, v]) => ({
            param: k,
            type: typeof v,
            value: typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v
          }))
        });

        try {
          result = await app.predict(typedConfig.endpoint, predictionParams);
        } catch (error: any) {
          console.error('Detailed prediction error:', {
            error: error.message,
            stack: error.stack,
            endpoint: typedConfig.endpoint,
            params: processedParams,
            paramTypes: Object.entries(processedParams).map(([k, v]) => ({
              param: k,
              type: typeof v,
              value: v
            }))
          });
          throw new Error(`Prediction failed for endpoint ${typedConfig.endpoint}: ${error.message}`);
        }
      } catch (error: any) {
        console.error('Detailed prediction error:', {
          error: error.message,
          stack: error.stack,
          endpoint: typedConfig.endpoint,
          params: processedParams
        });
        throw new Error(`Prediction failed: ${error.message}`);
      }

      console.log('Gradio result:', JSON.stringify(result, null, 2));

      if (!result) {
        throw new Error('Gradio model returned no output');
      }

      return NextResponse.json({
        status: 'succeeded',
        output: result.data
      }, { status: 201 });
    }

    throw new Error('Unsupported model type');
  } catch (error: any) {
    console.error('Error in preview:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

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
    console.log('Replicate prediction status:', prediction);
    
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
