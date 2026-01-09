/**
 * Protection levels for template-created items
 */
export enum TemplateItemProtection {
  /** Cannot delete, cannot modify core attributes */
  FULL = 'full',

  /** Cannot delete, but can modify (add fields, change config) */
  DELETE_PROTECTED = 'delete_protected',

  /** No restrictions - treat as user-created */
  NONE = 'none',
}

export const TemplateItemProtectionEnumName = 'TemplateItemProtection';
