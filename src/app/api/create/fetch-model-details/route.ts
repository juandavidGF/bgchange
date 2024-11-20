import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";
import { InputItem, OutputItem } from '@/types';

export async function POST(request: Request) {
  const { type, client, model, version } = await request.json();
  
  try {
    if (type === 'replicte') {
      const response = await fetch(`https://api.replicate.com/v1/models/${model}/versions/${version}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch model details');
      }
  
      const data = await response.json();
      
      const inputs = data.openapi_schema.components.schemas.Input.properties;
      const outputs = data.openapi_schema.components.schemas.Output;
      const required = data.openapi_schema.components.schemas.Input.required;
  
      return NextResponse.json({ inputs, outputs, required });
    } else if (type === 'gradio') {
      const app = await Client.connect(String(client));

      const app_info = await app.view_api();
      console.log(JSON.stringify(app_info, null, 2));
      
      const formattedEndpoints = await convertToIO({app_info, app});

      return NextResponse.json({ formattedEndpoints, app, app_info });
    }
  } catch (error: any) {
    console.error('Error fetching model details:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function convertToIO({app_info, app}: {app_info: any, app?: any}) {
  function formatIO({key, valueObject}: {key: any, valueObject: any}) {
    let inputs: Partial<InputItem>[] = [];
    let outputs: Partial<OutputItem>[] = [];
    valueObject.parameters.forEach((item: any, i: number) => {
      inputs[i] = {};
      inputs[i].key = item.parameter_name;
      inputs[i].component = item.component;
      inputs[i].label = item.label;
      inputs[i].value = item.parameter_default;
      inputs[i].type = item.type;
      inputs[i].description = item.example;
    });

    valueObject.returns.forEach((item: any, i: number) => {
      outputs[i] = {};
      outputs[i].component = item.component;
      outputs[i].title = item.label;
      outputs[i].type = item.type;
      outputs[i].formatItem = item?.python_type?.type;
    });

    return {inputs, outputs}
  }
  
  if (app_info) {
    let formattedEndpoints: any = [];
    const {named_endpoints} = app_info;
    Object.entries(named_endpoints).forEach(async ([key, valueObject]) => {
      const {inputs, outputs} = formatIO({key, valueObject});
      formattedEndpoints.push({key, inputs, outputs});
    });
    return formattedEndpoints;
  }
  return null;
}