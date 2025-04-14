export type FieldValue =
  | string
  | number
  | boolean
  | Date
  | Record<string, any>
  | null;

export interface ObjectFieldValues {
  [apiName: string]: FieldValue;
}
