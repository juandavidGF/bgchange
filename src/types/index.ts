export type NavItem = {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
};

export type ImageAreaProps = {
  title: string;
  id?: number;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
};

export type Slug = "createVideo" | "freshink" | "hairStyle" | "upscaler" | "livePortrait" | "tryon"  | "EVF-SAM";

// Your type definitions
export type InputItem = {
  component: 'image' | 'prompt' | 'checkbox' | 'number' | 'video' | 'Textbox' | 'dropdown' | 'slider' | 'audio' | 'checkboxgroup';
  key: string;
  placeholder?: string;
  type: 'string' | 'array' | 'integer' | 'boolean';
  gradioName?: string;
  show?: boolean;
  label?: string;
  description?: string;
  value?: any;
  required?: boolean;
  // Properties for number and slider inputs
  min?: number;
  max?: number;
  step?: number;
  // Properties for dropdown and checkboxgroup inputs
  options?: string[];
};

export interface OutputItem {
  component: 'image' | 'prompt' | 'checkbox' | 'number' | 'video' | 'audio' | 'textbox';
  key: string;
  placeholder?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  show: boolean;
  title?: string;
  value?: string;
  typeItem?: 'string' | 'number' | 'boolean';
  format?: string;
  formatItem?: string;
}

// Function to infer component for OutputItem
const inferOutputComponent = (output: OutputItem): OutputItem => {
  if (output.type === 'array' && output.typeItem === 'string' && output.formatItem === 'string') {
    return { ...output, component: 'image' }; // Infer as image
  }
  return output; // Return unchanged if no inference
};

export type Configuration = {
  name: string;
  type: 'gradio' | 'replicate' | 'fal';
  client?: string;
  path?: string;
  endpoint?: string;
  model?: `${string}/${string}` | `${string}/${string}:${string}`;
  version?: string | null;
  // FAL-specific fields
  endpoint_id?: string;  // e.g., "fal-ai/wan-vace-14b/reframe"
  fal_endpoint?: string; // FAL base URL (default: https://queue.fal.run)
  inputs: InputItem[];
  outputs?: OutputItem[];
};

export type Configurations = Configuration[];
