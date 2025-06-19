import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";
import { InputItem, OutputItem } from '@/types';

export async function POST(request: Request) {
  const { type, client, model, version, endpoint_id } = await request.json();
  
  console.log('🔍 [DEBUG] Request data:', { type, client, model, version, endpoint_id });
  
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

      console.log({'client': fixedClient, app: !!app});
      
      const app_info = await app.view_api();
      console.log({view_api: app_info});
      console.log(JSON.stringify(app_info, null, 2));
      
      const convertResult = await convertToIO({app_info, app, client: fixedClient});
      if (!convertResult) {
        throw new Error('Failed to convert to IO');
      }
      const { formattedEndpoints, api_info } = convertResult;

      return NextResponse.json({ formattedEndpoints, api_info, view_api: !!app_info }, { status: 200 });
    } else if (type === 'huggingface') { } 
    else if (type === 'fal') {
      if (!endpoint_id) {
        throw new Error('endpoint_id is required for FAL');
      }

      console.log('Fetching FAL schema for endpoint:', endpoint_id);
      
      // Fetch OpenAPI schema from FAL
      const schemaUrl = `https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${endpoint_id}`;
      const schemaResponse = await fetch(schemaUrl);
      
      if (!schemaResponse.ok) {
        throw new Error(`Failed to fetch FAL schema: ${schemaResponse.status} ${schemaResponse.statusText}`);
      }
      
      const schema = await schemaResponse.json();
      console.log('FAL schema received:', JSON.stringify(schema, null, 2));
      
      // Parse input schema
      const inputSchemaKey = Object.keys(schema.components?.schemas || {}).find(key => 
        key.toLowerCase().includes('input')
      );
      const outputSchemaKey = Object.keys(schema.components?.schemas || {}).find(key => 
        key.toLowerCase().includes('output') || key.toLowerCase().includes('response')
      );
      
      if (!inputSchemaKey || !outputSchemaKey) {
        console.error('Available schema keys:', Object.keys(schema.components?.schemas || {}));
        throw new Error('Could not find input/output schemas in FAL OpenAPI spec');
      }
      
      const inputSchema = schema.components.schemas[inputSchemaKey];
      const outputSchema = schema.components.schemas[outputSchemaKey];
      
      console.log('Input schema:', inputSchema);
      console.log('Output schema:', outputSchema);
      
      // Helper functions for FAL schema mapping
      const mapFALTypeToComponent = (type: string, key: string): InputItem['component'] => {
        if (key.includes('image') || key.includes('video_url')) return 'image';
        if (key.includes('audio')) return 'audio';
        if (type === 'boolean') return 'checkbox';
        if (type === 'number' || type === 'integer') return 'number';
        return 'prompt';
      };
      
      const mapFALTypeToInputType = (type: string): InputItem['type'] => {
        if (type === 'boolean') return 'boolean';
        if (type === 'number' || type === 'integer') return 'integer';
        if (type === 'array') return 'array';
        return 'string';
      };

      const mapFALTypeToOutputType = (type: string): OutputItem['type'] => {
        if (type === 'boolean') return 'boolean';
        if (type === 'number' || type === 'integer') return 'number';
        if (type === 'array') return 'array';
        return 'string';
      };
      
      // Convert to InputItem[] and OutputItem[]
      const inputs: InputItem[] = Object.entries(inputSchema.properties || {}).map(
        ([key, prop]: [string, any]) => ({
          component: mapFALTypeToComponent(prop.type, key),
          key,
          type: mapFALTypeToInputType(prop.type),
          value: prop.default !== undefined ? prop.default : null,
          show: !inputSchema.required?.includes(key), // Show non-required fields for editing
          placeholder: prop.description || '',
          label: prop.title || key,
          required: inputSchema.required?.includes(key) || false
        })
      );
      
      const outputs: OutputItem[] = Object.entries(outputSchema.properties || {}).map(
        ([key, prop]: [string, any]) => ({
          component: mapFALTypeToComponent(prop.type, key) as OutputItem['component'],
          key,
          type: mapFALTypeToOutputType(prop.type),
          show: true,
          title: prop.title || key,
          placeholder: prop.description || ''
        })
      );
      
      console.log('Parsed inputs:', inputs);
      console.log('Parsed outputs:', outputs);
      
      return NextResponse.json({
        endpoint_id,
        inputs,
        outputs,
        schema: { input: inputSchema, output: outputSchema }
      });
    }
  } catch (error: any) {
    console.error('Error fetching model details:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function fixClient(inputClient: string): string {
  // First check if it looks like a URL
  if (inputClient.includes('://') || inputClient.startsWith('http')) {
    try {
      const url = new URL(inputClient);
      if (url.hostname === "huggingface.co") {
        const parts = url.pathname.split('/').filter(Boolean);
        // Handle both direct model paths and spaces paths
        if (parts[0] === "spaces" && parts.length > 1) {
          return parts.slice(1).join('/');
        } else if (parts.length >= 2) {
          return parts.join('/');
        }
      }
    } catch (e) {
      console.debug('Input is not a valid URL, proceeding as plain client name');
    }
  }
  
  // Clean up non-URL inputs
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
      description: item.type?.description || item.python_type?.description || undefined,
      show: true,
      required: !item.parameter_has_default,
    }));

    const outputs: OutputItem[] = (valueObject as any).returns.map((item: any, index: number) => ({
      key: item.label ? item.label.toLowerCase().replace(/\s+/g, '_') : `output_${index}`,
      component: mapComponent(item.component) as OutputItem['component'],
      type: mapType(item.type) as OutputItem['type'],
      title: item.label || `Output ${index}`,
      show: true,
      formatItem: item.python_type?.type,
    }));

    formattedEndpoints.push({ key, inputs, outputs });
  }

  return formattedEndpoints;
}

/**
 * Constructs the Gradio Space API URL from client string
 */
function constructAppRoot(client: string): string {
  const spaceName = client.toLowerCase().replace('/', '-');
  return `https://${spaceName}.hf.space`;
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
interface ConvertToIOResponse {
  formattedEndpoints: FormattedEndpoint[] | null;
  api_info:{
    api: any;
    source: string;
  };
}
async function convertToIO({ app_info, app, client }: { app_info: any; app?: any, client: string }): Promise<ConvertToIOResponse | null> {
  // Try /gradio_api/info first
  const appRoot = app?.config?.root || constructAppRoot(client);
  const apiUrlGradioAPI = `${appRoot}/gradio_api/info`;
  const apiUrlInfo = `${appRoot}/info`;
  
  if (appRoot) {
    try {
      console.log(`Fetching ${apiUrlGradioAPI}`);
      const response = await fetch(apiUrlGradioAPI);
      if (response.ok) {
        const apiInfo = await response.json();
        console.log('flag4', {apiInfo});
        if (apiInfo.named_endpoints && Object.keys(apiInfo.named_endpoints).length > 0) {
          console.log("Using /gradio_api/info data");
          return {formattedEndpoints: formatEndpointsFromApiInfo(apiInfo), api_info: appRoot};
        }
      }
      console.log("/gradio_api/info fetch succeeded but returned no useful data");
    } catch (error: any) {
      console.error("Failed to fetch /gradio_api/info:", error.message);
      console.log(`Fetching ${apiUrlInfo}`);
      const response = await fetch(apiUrlInfo);
      if (response.ok) {
        const apiInfo = await response.json();
        console.log('flag5', {apiInfo});
        if (apiInfo.named_endpoints && Object.keys(apiInfo.named_endpoints).length > 0) {
          console.log("Using /info data");
          return {
            formattedEndpoints: formatEndpointsFromApiInfo(apiInfo),
            api_info: {
              api: apiInfo, 
              source: "appRoot"
            }
          };
        }
      }
    }
  }

  // Fallback to app_info from view_api()
  if (app_info && app_info.named_endpoints && Object.keys(app_info.named_endpoints).length > 0) {
    console.log("Falling back to app.view_api() data");
    return {
      formattedEndpoints: formatEndpointsFromApiInfo(app_info),
      api_info: {
        api: app_info, 
        source: "app_info"
      }
    };
  }

  // Final fallback to app.config
  if (app && app.config) {
    console.log("Falling back to app.config");
    return {
      formattedEndpoints: formatEndpointsFromConfig(app as AppConfig), 
      api_info: {
        api: app.config,
        source: "app_config"
      }};
  }

  console.log("No valid data source available");
  return null;
}
