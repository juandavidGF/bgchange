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

export type Slug = "createVideo" | "freshink" | "hairStyle" | "upscaler" | "livePortrait" | "tryon";

type InputItem = {
  type: string;
  placeholder?: string;
  name?: string;
  gradioName?: string;
  show?: boolean;
  label?: string;
  value?: any;
  [key: string]: any;
};

type OutputItem = {
  type: string;
  placeholder?: string;
  key: string;
  [key: string]: any;
};
type Configuration = {
  type?: string;
  client?: string;
  path?: string;
  endpoint?: string;
  model?: string;
  inputs: InputItem[];
  outputs?: OutputItem[];
  [key: string]: any;
};


export type Configurations = { [key: string]: Configuration };