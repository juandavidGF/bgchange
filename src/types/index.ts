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
  type: 'text' | 'image' | 'prompt' | 'checkbox' | 'number' | 'video';
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
  type: string;
  key: string;
  show: boolean;
  placeholder?: string;
  format?: string;
  title?: string;
};

export type Configuration = {
  name: string;
  type: 'gradio' | 'replicate';
  client?: string;
  path?: string;
  endpoint?: string;
  model?: `${string}/${string}` | `${string}/${string}:${string}`;
  version?: string | null;
  inputs: InputItem[];
  outputs?: OutputItem[];
};

export type Configurations = Configuration[];