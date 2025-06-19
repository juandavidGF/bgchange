/**
 * FAL API Client
 * Handles communication with FAL.ai queue-based API
 */

export interface FalQueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  request_id: string;
  response_url?: string;
  status_url?: string;
  cancel_url?: string;
  logs?: any[];
  metrics?: any;
  queue_position?: number;
  progress?: {
    percentage?: number;
  };
}

export interface FalJobResult {
  data: any;
  requestId: string;
}

export interface FalSubmissionResult {
  request_id: string;
  status_url: string;
  response_url?: string;
  cancel_url?: string;
}

export class FalClient {
  private apiKey: string;
  private baseUrl = 'https://queue.fal.run';
  private schemaBaseUrl = 'https://fal.ai/api/openapi/queue/openapi.json';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FAL_KEY || '';
    if (!this.apiKey) {
      throw new Error('FAL_KEY is required. Set it as an environment variable or pass it to the constructor.');
    }
  }

  /**
   * Fetch OpenAPI schema for a specific FAL endpoint
   */
  async fetchSchema(endpoint_id: string): Promise<any> {
    try {
      const url = `${this.schemaBaseUrl}?endpoint_id=${endpoint_id}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching FAL schema:', error);
      throw new Error(`Schema fetch failed: ${error.message}`);
    }
  }

  /**
   * Submit a job to the FAL queue
   */
  async submitJob(endpoint_id: string, input: any): Promise<FalSubmissionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Job submission failed: ${response.status} ${response.statusText} - ${errorData}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error submitting FAL job:', error);
      throw new Error(`Job submission failed: ${error.message}`);
    }
  }

  /**
   * Check the status of a running job
   */
  async checkStatus(endpoint_id: string, request_id: string, includeLogs: boolean = true): Promise<FalQueueStatus> {
    try {
      const logsParam = includeLogs ? '?logs=1' : '';
      const response = await fetch(
        `${this.baseUrl}/${endpoint_id}/requests/${request_id}/status${logsParam}`,
        {
          headers: { 
            'Authorization': `Key ${this.apiKey}` 
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error checking FAL status:', error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Get the result of a completed job
   */
  async getResult(endpoint_id: string, request_id: string): Promise<FalJobResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${endpoint_id}/requests/${request_id}`,
        {
          headers: { 
            'Authorization': `Key ${this.apiKey}` 
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Result fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data: data,
        requestId: request_id
      };
    } catch (error: any) {
      console.error('Error fetching FAL result:', error);
      throw new Error(`Result fetch failed: ${error.message}`);
    }
  }

  /**
   * Cancel a running job
   */
  async cancelJob(endpoint_id: string, request_id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${endpoint_id}/requests/${request_id}/cancel`,
        {
          method: 'PUT',
          headers: { 
            'Authorization': `Key ${this.apiKey}` 
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Job cancellation failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error cancelling FAL job:', error);
      throw new Error(`Job cancellation failed: ${error.message}`);
    }
  }
}

/**
 * Helper functions for schema parsing
 */
export class FalSchemaParser {
  /**
   * Parse OpenAPI schema to extract input and output configurations
   */
  static parseSchema(schema: any, endpoint_id: string): { inputs: any[], outputs: any[] } {
    const schemas = schema.components?.schemas;
    if (!schemas) {
      throw new Error('No schemas found in OpenAPI spec');
    }

    // Find input and output schema keys
    const inputSchemaKey = Object.keys(schemas).find(key => 
      key.toLowerCase().includes('input') || key.toLowerCase().includes('request')
    );
    const outputSchemaKey = Object.keys(schemas).find(key => 
      key.toLowerCase().includes('output') || key.toLowerCase().includes('response')
    );

    if (!inputSchemaKey || !outputSchemaKey) {
      throw new Error('Could not find input/output schemas in OpenAPI spec');
    }

    const inputSchema = schemas[inputSchemaKey];
    const outputSchema = schemas[outputSchemaKey];

    // Parse inputs
    const inputs = Object.entries(inputSchema.properties || {}).map(
      ([key, prop]: [string, any]) => ({
        component: this.mapTypeToComponent(prop.type, key),
        key,
        type: this.mapOpenAPITypeToType(prop.type),
        value: prop.default !== undefined ? prop.default : null,
        show: !inputSchema.required?.includes(key), // Show non-required fields for editing
        placeholder: prop.description || '',
        label: prop.title || this.formatLabel(key),
        required: inputSchema.required?.includes(key) || false,
        // Add constraints for number inputs
        ...(prop.minimum !== undefined && { min: prop.minimum }),
        ...(prop.maximum !== undefined && { max: prop.maximum }),
        // Add options for enum fields
        ...(prop.enum && { options: prop.enum })
      })
    );

    // Parse outputs
    const outputs = Object.entries(outputSchema.properties || {}).map(
      ([key, prop]: [string, any]) => ({
        component: this.mapTypeToComponent(prop.type, key),
        key,
        type: this.mapOpenAPITypeToType(prop.type),
        show: true,
        title: prop.title || this.formatLabel(key),
        placeholder: prop.description || '',
        // Handle array types
        ...(prop.type === 'array' && prop.items && {
          typeItem: this.mapOpenAPITypeToType(prop.items.type),
          formatItem: prop.items.format
        }),
        // Handle string formats
        ...(prop.format && { format: prop.format })
      })
    );

    return { inputs, outputs };
  }

  /**
   * Map OpenAPI types to component types
   */
  private static mapTypeToComponent(type: string, key: string): string {
    // Check key name for hints
    if (key.includes('image') || key.includes('video_url') || key.includes('file_url')) {
      return 'image';
    }
    if (key.includes('audio')) {
      return 'audio';
    }
    if (key.includes('video') && !key.includes('url')) {
      return 'video';
    }

    // Check type
    switch (type) {
      case 'boolean':
        return 'checkbox';
      case 'number':
      case 'integer':
        return 'number';
      case 'array':
        return 'checkboxgroup';
      default:
        return 'prompt';
    }
  }

  /**
   * Map OpenAPI types to internal types
   */
  private static mapOpenAPITypeToType(type: string): string {
    switch (type) {
      case 'boolean':
        return 'boolean';
      case 'number':
      case 'integer':
        return 'integer';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }

  /**
   * Format key names into readable labels
   */
  private static formatLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

/**
 * Default FAL client instance
 */
export const falClient = new FalClient();
