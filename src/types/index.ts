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

export type InputItem = {
  type: 'text' | 'image' | 'prompt' | 'checkbox' | 'number';
  key: string;
  placeholder?: string;
  gradioName?: string;
  show?: boolean;
  label?: string;
  description?: string;
  value?: any;
  component?: string;
};

export type OutputItem = {
  type: 'text' | 'image';
  key: string;
  placeholder?: string;
  show?: boolean;
};

export type Configuration = {
  type: 'gradio' | 'replicate';
  client?: string;
  path?: string;
  endpoint?: string;
  model?: `${string}/${string}` | `${string}/${string}:${string}`;
  version?: string | null;
  inputs: InputItem[];
  outputs: OutputItem[];
};

export type Configurations = { [key: string]: Configuration };