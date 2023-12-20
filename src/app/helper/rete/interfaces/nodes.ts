import { ISettings } from "src/app/schemas/graph";

export interface InputOption {
  name: string;
  value: string;
}

export interface IOutputDefinition {
  name: string;
  type: string;

  index: number;

  group?: boolean;
  group_initial?: number;

  exec?: boolean;

  description: string;
  default?: unknown;
}

export interface IInputDefinition {
  name: string;
  type: string;

  index: number;

  group?: boolean;
  group_initial?: number;

  exec?: boolean;

  description: string;
  default?: unknown;
  required?: boolean;
  options?: InputOption[];

  // for type "string"
  multiline?: boolean;
  hint?: string;

  // for type "number"
  step?: number;
}

export interface Verified {
  name: string;
  url: string;
}

export interface INodeTypeDefinitionBasic {
  id: string;
  name: string;
  icon: string;
  entry: boolean;
  avatar: string;
  description: string;
  compact: boolean;
  verified?: Verified;
  registry?: string; // if not set, then it is a builtin node
}
export interface INodeTypeDefinitionFull extends INodeTypeDefinitionBasic {
  style?: {
    header?: {
      background?: string;
    }
    body?: {
      background?: string;
    }
  }

  outputs: {
    [key: string]: IOutputDefinition;
  };

  inputs: {
    [key: string]: IInputDefinition;
  };

  settings?: ISettings;
}