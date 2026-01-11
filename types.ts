export enum ViewMode {
  TREE = 'TREE',
  CODE = 'CODE',
}

export interface JsonNodeProps {
  keyName?: string;
  value: any;
  isLast: boolean;
  depth?: number;
  onCopy?: (path: string, value: any) => void;
  onSelect?: (value: any) => void;
  path?: string;
  showValues?: boolean;
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface GenerationResult {
  content: string;
  error?: string;
}