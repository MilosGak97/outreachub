/**
 * Template-specific error codes
 *
 * For generic errors (auth, validation, server), use CommonErrorCode.
 * These are domain-specific errors for template management operations.
 *
 * @example
 * throw new ConflictException(TemplateErrorCode.SLUG_TAKEN);
 * // Response: { message: "A template with this slug already exists" }
 */
export enum TemplateErrorCode {
  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE ERRORS
  // ═══════════════════════════════════════════════════════════════

  TEMPLATE_NOT_FOUND = 'Template not found',
  SLUG_TAKEN = 'A template with this slug already exists',
  SLUG_INVALID = 'Slug must contain only lowercase letters, numbers, underscores, and hyphens',
  TEMPLATE_IN_USE = 'Cannot modify or delete template while it is installed by companies',
  TEMPLATE_INACTIVE = 'Template is not active and cannot be installed',

  // ═══════════════════════════════════════════════════════════════
  // MODULE ERRORS
  // ═══════════════════════════════════════════════════════════════

  MODULE_NOT_FOUND = 'Module not found',
  MODULE_SLUG_TAKEN = 'A module with this slug already exists in this template',
  MODULE_IN_USE = 'Cannot modify or delete module while it is installed by companies',
  CORE_MODULE_REQUIRED = 'Core modules cannot be uninstalled',
  MODULE_DEPENDENCY_MISSING = 'Required dependency modules must be installed first',
  MODULE_CONFLICT = 'This module conflicts with an already installed module',
  MAX_MODULES_EXCEEDED = 'Maximum number of modules per template exceeded (limit: 50)',

  // ═══════════════════════════════════════════════════════════════
  // BLUEPRINT OBJECT ERRORS
  // ═══════════════════════════════════════════════════════════════

  OBJECT_NOT_FOUND = 'Blueprint object not found',
  OBJECT_API_NAME_TAKEN = 'An object with this API name already exists in this module',
  OBJECT_PROTECTED = 'This object is protected and cannot be modified',
  MAX_OBJECTS_EXCEEDED = 'Maximum number of objects per module exceeded (limit: 100)',

  // ═══════════════════════════════════════════════════════════════
  // BLUEPRINT FIELD ERRORS
  // ═══════════════════════════════════════════════════════════════

  FIELD_NOT_FOUND = 'Blueprint field not found',
  FIELD_API_NAME_TAKEN = 'A field with this API name already exists in this object',
  FIELD_PROTECTED = 'This field is protected and cannot be modified',
  INVALID_FIELD_TYPE = 'Invalid field type provided',
  INVALID_FIELD_CONFIG = 'Field configuration is invalid for this field type',
  MAX_FIELDS_EXCEEDED = 'Maximum number of fields per object exceeded (limit: 200)',
  BULK_LIMIT_EXCEEDED = 'Bulk create limit exceeded (limit: 50 fields per request)',

  // ═══════════════════════════════════════════════════════════════
  // BLUEPRINT ASSOCIATION ERRORS
  // ═══════════════════════════════════════════════════════════════

  ASSOCIATION_NOT_FOUND = 'Blueprint association not found',
  ASSOCIATION_API_NAME_TAKEN = 'An association with this API name already exists in this module',
  ASSOCIATION_SOURCE_NOT_FOUND = 'Source object does not exist',
  ASSOCIATION_TARGET_NOT_FOUND = 'Target object does not exist',
  CIRCULAR_ASSOCIATION = 'Association would create a circular reference',
  ASSOCIATION_PROTECTED = 'This association is protected and cannot be modified',
  ASSOCIATION_DUPLICATE = 'An association between these objects already exists',

  // ═══════════════════════════════════════════════════════════════
  // INSTALLATION ERRORS
  // ═══════════════════════════════════════════════════════════════

  ALREADY_INSTALLED = 'This company already has a template installed',
  NOT_INSTALLED = 'This company does not have a template installed',
  MODULE_ALREADY_INSTALLED = 'This module is already installed for this company',
  MODULE_NOT_INSTALLED = 'This module is not installed for this company',
  MODULE_HAS_DATA = 'Cannot uninstall module with existing data. Use force option to delete all data.',
  COMPANY_NOT_FOUND = 'Company not found',
  INSTALLATION_FAILED = 'Installation failed. All changes have been rolled back.',
  UNINSTALLATION_FAILED = 'Uninstallation failed. All changes have been rolled back.',

  // ═══════════════════════════════════════════════════════════════
  // REORDER ERRORS
  // ═══════════════════════════════════════════════════════════════

  REORDER_INVALID_IDS = 'One or more IDs in the reorder array are invalid',
  REORDER_DUPLICATE_IDS = 'Reorder array contains duplicate IDs',
}

/**
 * HTTP status codes for template errors
 */
export const TemplateErrorStatus = {
  // Template
  TEMPLATE_NOT_FOUND: 404,
  SLUG_TAKEN: 409,
  SLUG_INVALID: 400,
  TEMPLATE_IN_USE: 409,
  TEMPLATE_INACTIVE: 400,

  // Module
  MODULE_NOT_FOUND: 404,
  MODULE_SLUG_TAKEN: 409,
  MODULE_IN_USE: 409,
  CORE_MODULE_REQUIRED: 400,
  MODULE_DEPENDENCY_MISSING: 400,
  MODULE_CONFLICT: 409,
  MAX_MODULES_EXCEEDED: 400,

  // Object
  OBJECT_NOT_FOUND: 404,
  OBJECT_API_NAME_TAKEN: 409,
  OBJECT_PROTECTED: 403,
  MAX_OBJECTS_EXCEEDED: 400,

  // Field
  FIELD_NOT_FOUND: 404,
  FIELD_API_NAME_TAKEN: 409,
  FIELD_PROTECTED: 403,
  INVALID_FIELD_TYPE: 400,
  INVALID_FIELD_CONFIG: 400,
  MAX_FIELDS_EXCEEDED: 400,
  BULK_LIMIT_EXCEEDED: 400,

  // Association
  ASSOCIATION_NOT_FOUND: 404,
  ASSOCIATION_API_NAME_TAKEN: 409,
  ASSOCIATION_SOURCE_NOT_FOUND: 400,
  ASSOCIATION_TARGET_NOT_FOUND: 400,
  CIRCULAR_ASSOCIATION: 400,
  ASSOCIATION_PROTECTED: 403,
  ASSOCIATION_DUPLICATE: 409,

  // Installation
  ALREADY_INSTALLED: 409,
  NOT_INSTALLED: 400,
  MODULE_ALREADY_INSTALLED: 409,
  MODULE_NOT_INSTALLED: 400,
  MODULE_HAS_DATA: 400,
  COMPANY_NOT_FOUND: 404,
  INSTALLATION_FAILED: 500,
  UNINSTALLATION_FAILED: 500,

  // Reorder
  REORDER_INVALID_IDS: 400,
  REORDER_DUPLICATE_IDS: 400,
} as const;
