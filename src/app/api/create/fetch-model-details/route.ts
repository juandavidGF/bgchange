import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";
import { InputItem, OutputItem } from '@/types';

export async function POST(request: Request) {
  const { type, client, model, version } = await request.json();

  console.log('flag0', {type, client, model, version});
  
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
      console.log('flag1', {client});
      
      const fixedClient = fixClient(client);
      let app = await Client.connect(String(fixedClient));

      console.log('flag2, app', {app});
      
      const app_info = await app.view_api();
      
      const formattedEndpoints = await convertToIO({app_info, app, client: fixedClient});

      return NextResponse.json({ formattedEndpoints });
    } else if (type === 'fal') {
      const response = await fetch(`https://api.fal.ai/v1/models/${model}/versions/${version}`, {
        headers: {
          'Authorization': `Token ${
            process.env.FAL_API_TOKEN
          }`,
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
    }
  } catch (error: any) {
    console.error('Error fetching model details:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function fixClient(inputClient: string): string {
  try {
    const url = new URL(inputClient);
    if (url.hostname === "huggingface.co") {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === "spaces" && parts.length > 1) {
        return parts.slice(1).join('/');
      }
    }
  } catch (e: any) {
    // No es una URL válida, se procede al siguiente chequeo
    console.error('Error parsing URL:', e.message);
  }
  // Si viene con un slash inicial, lo elimina
  return inputClient.startsWith('/') ? inputClient.slice(1) : inputClient;
}

// Define FormattedEndpoint type
interface FormattedEndpoint {
  key: string;
  inputs: Partial<InputItem>[];
  outputs: Partial<OutputItem>[];
}

// Simplified type for the app config
interface AppConfig {
  app_reference: string;
  config: {
    components: Array<{
      id: number;
      type: string;
      props: {
        label?: string;
        value?: any;
        [key: string]: any;
      };
      api_info: {
        type: string;
        items?: { type: string; enum?: string[] };
        properties?: { path: { type: string } };
        description?: string;
      };
    }>;
    dependencies: Array<{
      id: number;
      api_name: string;
      inputs: number[];
      outputs: number[];
    }>;
  };
}

/**
 * Maps Gradio component type to InputItem.component or OutputItem.component
 */
function mapComponent(type: string): InputItem['component'] | OutputItem['component'] {
  const lowerType = type.toLowerCase();
  switch (lowerType) {
    case 'textbox': return 'Textbox';
    case 'dropdown': return 'dropdown';
    case 'slider': return 'slider';
    case 'checkbox': return 'checkbox';
    case 'audio': return 'audio';
    case 'number': return 'number';
    case 'checkboxgroup': return 'checkboxgroup';
    default: return 'Textbox'; // Fallback for inputs
  }
}

/**
 * Maps Gradio api_info.type to InputItem.type or OutputItem.type
 */
function mapType(apiInfo: any): InputItem['type'] | OutputItem['type'] {
  if (apiInfo.type === 'boolean') return 'boolean';
  if (apiInfo.type === 'number') return 'integer'; // Map "number" to "integer" for InputItem
  if (apiInfo.type === 'string') return 'string';
  if (apiInfo.type === 'array') return 'array';
  if (apiInfo.type === 'object' && apiInfo.properties?.path) return 'string'; // FileData as string
  return 'string'; // Fallback
}

/**
 * Formats endpoints from /gradio_api/info or view_api() response
 */
function formatEndpointsFromApiInfo(apiInfo: any): FormattedEndpoint[] {
  const formattedEndpoints: FormattedEndpoint[] = [];
  const { named_endpoints } = apiInfo;

  for (const [key, valueObject] of Object.entries(named_endpoints)) {
    const inputs: InputItem[] = (valueObject as any).parameters.map((item: any) => ({
      key: item.parameter_name,
      component: mapComponent(item.component) as InputItem['component'],
      type: mapType(item.type) as InputItem['type'],
      label: item.label || item.parameter_name,
      value: item.parameter_default,
      description: item.type.description || item.python_type.description || undefined,
      show: true,
      required: !item.parameter_has_default,
    }));

    const outputs: OutputItem[] = (valueObject as any).returns.map((item: any, index: number) => ({
      key: item.label ? item.label.toLowerCase().replace(/\s+/g, '_') : `output_${index}`,
      component: mapComponent(item.component) as OutputItem['component'],
      type: mapType(item.type) as OutputItem['type'],
      title: item.label || `Output ${index}`,
      show: true,
      formatItem: item.python_type.type,
    }));

    formattedEndpoints.push({ key, inputs, outputs });
  }

  return formattedEndpoints;
}

/**
 * Constructs the Gradio Space API URL from client string
 */
function constructApiUrl(client: string): string {
  const spaceName = client.toLowerCase().replace('/', '-');
  return `https://${spaceName}.hf.space/gradio_api/info`;
}

function formatEndpointsFromConfig(appConfig: AppConfig): FormattedEndpoint[] {
  const { config } = appConfig;

  const componentMap = new Map<number, AppConfig["config"]["components"][0]>();
  config.components.forEach(comp => componentMap.set(comp.id, comp));

  const generateKey = (label: string | undefined, index: number): string => {
    if (!label) return `param_${index}`;
    return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  const formattedEndpoints: FormattedEndpoint[] = [];

  config.dependencies
    .filter(dep => dep.api_name)
    .forEach(dep => {
      const endpointPath = `/${dep.api_name}`;

      // Format inputs
      const inputs: InputItem[] = dep.inputs.map((id, index) => {
        const comp = componentMap.get(id);
        if (!comp) {
          console.warn(`Component ID ${id} not found`);
          return {
            key: `param_${index}`,
            component: 'Textbox',
            type: 'string',
            label: `Input ${id}`,
            value: null,
            show: true,
          };
        }

        const { type: componentType, props, api_info } = comp;
        const label = props.label || `Input ${id}`;
        const value = 'value' in props ? props.value : null;

        return {
          key: generateKey(props.label, index),
          component: mapComponent(componentType) as InputItem['component'],
          type: mapType(api_info) as InputItem['type'],
          label,
          value,
          description: api_info.description || undefined,
          show: true,
        };
      });

      // Format outputs
      const outputs: OutputItem[] = dep.outputs.map((id, index) => {
        const comp = componentMap.get(id);
        if (!comp) {
          console.warn(`Component ID ${id} not found`);
          return {
            key: `output_${index}`,
            component: 'number',
            type: 'number',
            title: `Output ${id}`,
            show: true,
          };
        }

        const { type: componentType, props, api_info } = comp;
        const title = props.label || `Output ${id}`;

        return {
          key: generateKey(props.label, index),
          component: mapComponent(componentType) as OutputItem['component'],
          type: mapType(api_info) as OutputItem['type'],
          title,
          show: true,
          formatItem: api_info.type,
        };
      });

      formattedEndpoints.push({
        key: endpointPath,
        inputs,
        outputs,
      });
    });

  return formattedEndpoints;
}

/**
 * Converts Gradio API info or app config into formatted endpoints with multiple fallbacks
 */
async function convertToIO({ app_info, app, client }: { app_info: any; app?: any, client: string }): Promise<FormattedEndpoint[] | null> {
  // Try /gradio_api/info first
  let apiUrl = app?.config.root ? `${app.config.root}/gradio_api/info` : constructApiUrl(client);
  if (apiUrl) {
    try {
      console.log(`Fetching ${app.root}/gradio_api/info`);
      const response = await fetch(`${app.root}/gradio_api/info`);
      if (response.ok) {
        const apiInfo = await response.json();
        if (apiInfo.named_endpoints && Object.keys(apiInfo.named_endpoints).length > 0) {
          console.log("Using /gradio_api/info data");
          return formatEndpointsFromApiInfo(apiInfo);
        }
      }
      console.log("/gradio_api/info fetch succeeded but returned no useful data");
    } catch (error) {
      console.error("Failed to fetch /gradio_api/info:", error);
    }
  }

  // Fallback to app_info from view_api()
  if (app_info && app_info.named_endpoints && Object.keys(app_info.named_endpoints).length > 0) {
    console.log("Falling back to app.view_api() data");
    return formatEndpointsFromApiInfo(app_info);
  }

  // Final fallback to app.config
  if (app && app.config) {
    console.log("Falling back to app.config");
    return formatEndpointsFromConfig(app as AppConfig);
  }

  console.log("No valid data source available");
  return null;
}