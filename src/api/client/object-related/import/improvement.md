# Import Module - Improvement Analysis

## Executive Summary

This document provides a comprehensive analysis of the import module with actionable improvement recommendations. The module handles CSV imports with support for object creation/updating, field mapping, draft field promotion, and association linking.

---

## Table of Contents

1. [Architecture Improvements](#1-architecture-improvements)
2. [Performance Optimizations](#2-performance-optimizations)
3. [Error Handling Enhancements](#3-error-handling-enhancements)
4. [Security Hardening](#4-security-hardening)
5. [Code Quality & Maintainability](#5-code-quality--maintainability)
6. [Feature Gaps](#6-feature-gaps)
7. [Testing Strategy](#7-testing-strategy)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [UX Improvements](#9-ux-improvements)
10. [Quick Wins](#10-quick-wins)

---

## 1. Architecture Improvements

### 1.1 Separate Read/Write Concerns (CQRS Pattern)

**Current State:**
`ImportService` acts as a facade delegating to repositories, mixing read and write operations.

**Recommendation:**
Split into `ImportQueryService` and `ImportCommandService`:

```typescript
// Query service - all read operations
@Injectable()
export class ImportQueryService {
  getSession(id: string): Promise<ImportSessionDto>;
  getJob(sessionId: string, jobId: string): Promise<ImportJobDto>;
  getResults(sessionId: string, query: ImportResultsQueryDto): Promise<ImportRowResultListResponseDto>;
}

// Command service - all write operations
@Injectable()
export class ImportCommandService {
  createSession(dto: CreateImportSessionDto): Promise<ImportSessionDto>;
  validateSession(sessionId: string): Promise<void>;
  createJob(sessionId: string): Promise<ImportJobDto>;
}
```

**Benefits:**
- Clearer responsibility separation
- Independent scaling of read/write paths
- Better testability

---

### 1.2 Introduce Domain Events

**Current State:**
Session state changes happen directly in repositories without notification.

**Recommendation:**
Emit domain events for key state transitions:

```typescript
// Events
class ImportSessionValidatedEvent {
  constructor(public readonly sessionId: string, public readonly promotedFields: string[]) {}
}

class ImportJobCompletedEvent {
  constructor(public readonly jobId: string, public readonly stats: ImportJobStats) {}
}

// Usage
this.eventEmitter.emit('import.session.validated', new ImportSessionValidatedEvent(sessionId, promotedFieldIds));
```

**Benefits:**
- Decoupled side effects (notifications, analytics, audit logs)
- Easier integration with external systems
- Better audit trail

---

### 1.3 State Machine for Session Lifecycle

**Current State:**
Session status transitions are implicit and scattered across methods.

**Recommendation:**
Implement explicit state machine:

```typescript
const sessionStateMachine = {
  DRAFT: {
    validate: 'VALIDATED',
  },
  VALIDATED: {
    startJob: 'RUNNING',
  },
  RUNNING: {
    complete: 'COMPLETED',
    fail: 'FAILED',
  },
};

// Guard invalid transitions
transition(session: ImportSession, action: string): ImportSessionStatus {
  const nextState = sessionStateMachine[session.status]?.[action];
  if (!nextState) {
    throw new BadRequestException(`Cannot ${action} session in ${session.status} status`);
  }
  return nextState;
}
```

**Benefits:**
- Prevents invalid state transitions
- Self-documenting state flow
- Easier debugging

---

### 1.4 Extract Storage Layer Abstraction

**Current State:**
`ImportStorageService` directly uses AWS S3 SDK.

**Recommendation:**
Create `ImportStoragePort` interface for provider flexibility:

```typescript
interface ImportStoragePort {
  createUploadUrl(filename: string, contentType: string): Promise<UploadUrlResult>;
  getFileStream(storageKey: string): Promise<Readable>;
  deleteFile(storageKey: string): Promise<void>;
}

// Implementations
@Injectable()
export class S3ImportStorage implements ImportStoragePort { }

@Injectable()
export class GCSImportStorage implements ImportStoragePort { }

@Injectable()
export class LocalImportStorage implements ImportStoragePort { } // For testing
```

**Benefits:**
- Cloud provider flexibility
- Easier local development/testing
- Clean dependency inversion

---

## 2. Performance Optimizations

### 2.1 Streaming CSV Processing

**Current State:**
CSV is streamed but all rows are inserted via batch inserts of 500 rows.

**Recommendation:**
Implement backpressure-aware streaming with parallel batch processing:

```typescript
async parseRowsFromStorage(sessionId: string): Promise<void> {
  const stream = await this.storageService.getFileStream(storageKey);
  const parser = stream.pipe(parse({ /* options */ }));

  const batchProcessor = new BatchProcessor({
    batchSize: 1000,
    concurrency: 3,
    onBatch: async (rows) => {
      await this.importRowRepo.insertBatch(rows);
    }
  });

  for await (const record of parser) {
    await batchProcessor.add(record);
  }

  await batchProcessor.flush();
}
```

**Estimated Impact:** 2-3x faster row parsing for large files

---

### 2.2 Implement Row Hash Deduplication

**Current State:**
`rowHash` column exists but is nullable and not utilized.

**Recommendation:**
Calculate and use row hashes for deduplication:

```typescript
// During parsing
const rowHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(rawData))
  .digest('hex');

// Check for duplicates
const existing = await this.importRowRepo.findByHash(sessionId, rowHash);
if (existing) {
  // Skip or mark as duplicate
}
```

**Benefits:**
- Prevent duplicate processing
- Resume interrupted imports
- Better error recovery

---

### 2.3 Lazy Load Sample Rows

**Current State:**
`sampleRows` stored directly in `ImportFile` entity.

**Recommendation:**
Store in separate table or fetch on-demand:

```typescript
// Option 1: Separate entity
@Entity()
export class ImportFileSample {
  @ManyToOne(() => ImportFile)
  file: ImportFile;

  @Column('jsonb')
  rows: any[][];
}

// Option 2: On-demand from S3
async getSampleRows(fileId: string, count: number = 5): Promise<any[][]> {
  const file = await this.fileRepo.findOne(fileId);
  return this.storageService.readFirstNRows(file.storageKey, count);
}
```

**Benefits:**
- Smaller entity payloads
- Faster file metadata queries
- Reduced memory usage

---

### 2.4 Add Database Indexes

**Current State:**
Limited indexing (only ImportRow and ImportRowResult have explicit indexes).

**Recommendation:**
Add indexes for common query patterns:

```sql
-- ImportSession
CREATE INDEX idx_import_session_company_status ON import_session(company_id, status);
CREATE INDEX idx_import_session_created_at ON import_session(created_at DESC);

-- ImportJob
CREATE INDEX idx_import_job_session_status ON import_job(import_session_id, status);

-- ImportFieldMap
CREATE INDEX idx_import_field_map_object_map ON import_field_map(object_map_id);

-- ImportDraftField
CREATE INDEX idx_import_draft_field_session ON import_draft_field(import_session_id);
CREATE INDEX idx_import_draft_field_apiname ON import_draft_field(company_id, api_name) WHERE api_name IS NOT NULL;
```

**Estimated Impact:** 5-10x faster queries on large datasets

---

### 2.5 Implement Connection Pooling for S3

**Current State:**
New S3Client created per request (inferred from service structure).

**Recommendation:**
Use singleton S3Client with connection pooling:

```typescript
@Injectable()
export class ImportStorageService {
  private readonly s3Client: S3Client;

  constructor(configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.get('AWS_REGION'),
      maxAttempts: 3,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5000,
        socketTimeout: 30000,
        httpsAgent: new https.Agent({
          keepAlive: true,
          maxSockets: 50,
        }),
      }),
    });
  }
}
```

**Estimated Impact:** 30-50% reduction in S3 latency

---

## 3. Error Handling Enhancements

### 3.1 Structured Error Responses

**Current State:**
Generic exceptions with string messages.

**Recommendation:**
Implement domain-specific error codes:

```typescript
// Error codes enum
enum ImportErrorCode {
  SESSION_NOT_FOUND = 'IMPORT_001',
  INVALID_SESSION_STATUS = 'IMPORT_002',
  FILE_NOT_FOUND = 'IMPORT_003',
  INVALID_FILE_TYPE = 'IMPORT_004',
  MATCH_FIELDS_REQUIRED = 'IMPORT_005',
  DUPLICATE_API_NAME = 'IMPORT_006',
  FIELD_NOT_FOUND = 'IMPORT_007',
  S3_UPLOAD_FAILED = 'IMPORT_008',
  CSV_PARSE_ERROR = 'IMPORT_009',
  VALIDATION_FAILED = 'IMPORT_010',
}

// Custom exception
class ImportException extends BadRequestException {
  constructor(
    public readonly code: ImportErrorCode,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super({ code, message, details });
  }
}

// Usage
throw new ImportException(
  ImportErrorCode.MATCH_FIELDS_REQUIRED,
  'Match fields are required for UPDATE behavior',
  { objectMapId: map.id, behavior: map.matchBehavior }
);
```

**Benefits:**
- Machine-parseable errors for frontend
- Better debugging information
- Consistent error format

---

### 3.2 Partial Success Handling

**Current State:**
Transactions are all-or-nothing for batch operations.

**Recommendation:**
Support partial success for non-critical operations:

```typescript
interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: string }>;
}

async upsertObjectMaps(maps: UpsertImportObjectMapDto[]): Promise<BatchResult<ImportObjectMapDto>> {
  const results: BatchResult<ImportObjectMapDto> = { successful: [], failed: [] };

  for (const map of maps) {
    try {
      const result = await this.processObjectMap(map);
      results.successful.push(result);
    } catch (error) {
      results.failed.push({ item: map, error: error.message });
    }
  }

  return results;
}
```

**Benefits:**
- Better UX for bulk operations
- Clearer error attribution
- Resume capability

---

### 3.3 Row-Level Error Tracking

**Current State:**
`ImportRowResult.error` is JSONB but structure is undefined.

**Recommendation:**
Define consistent error structure:

```typescript
interface ImportRowError {
  code: string;
  message: string;
  field?: string;           // Which field caused the error
  sourceValue?: any;        // Original value
  expectedType?: string;    // Expected type/format
  validationRule?: string;  // Which rule failed
  suggestion?: string;      // How to fix
}

// Example
const error: ImportRowError = {
  code: 'FIELD_VALIDATION_FAILED',
  message: 'Invalid email format',
  field: 'email',
  sourceValue: 'not-an-email',
  expectedType: 'email',
  validationRule: 'RFC5322',
  suggestion: 'Provide a valid email address (e.g., user@example.com)'
};
```

---

### 3.4 Retry Logic for Transient Failures

**Current State:**
No retry mechanism for S3 or database operations.

**Recommendation:**
Implement retry with exponential backoff:

```typescript
import { retry } from 'retry';

async getFileStream(storageKey: string): Promise<Readable> {
  return retry(
    async () => {
      const response = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey })
      );
      return response.Body as Readable;
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        this.logger.warn(`S3 retry attempt ${attempt}: ${error.message}`);
      },
    }
  );
}
```

---

## 4. Security Hardening

### 4.1 File Content Validation

**Current State:**
Only MIME type is validated; file content not verified.

**Recommendation:**
Validate actual file content:

```typescript
async validateFileContent(stream: Readable): Promise<ValidationResult> {
  const chunks: Buffer[] = [];
  let totalSize = 0;
  const maxSize = 100 * 1024 * 1024; // 100MB limit

  for await (const chunk of stream) {
    totalSize += chunk.length;
    if (totalSize > maxSize) {
      throw new ImportException(ImportErrorCode.FILE_TOO_LARGE, 'File exceeds 100MB limit');
    }
    chunks.push(chunk);
  }

  const content = Buffer.concat(chunks);

  // Check for malicious content
  if (this.containsFormulas(content)) {
    throw new ImportException(ImportErrorCode.MALICIOUS_CONTENT, 'CSV contains formula injection');
  }

  return { valid: true, size: totalSize };
}

private containsFormulas(content: Buffer): boolean {
  const dangerous = ['=', '+', '-', '@', '\t', '\r'].map(c => c.charCodeAt(0));
  // Check if cells start with formula characters
  // Implementation details...
}
```

**Benefits:**
- Prevent CSV injection attacks
- Enforce size limits
- Validate encoding (UTF-8)

---

### 4.2 Rate Limiting

**Current State:**
No rate limiting on import endpoints.

**Recommendation:**
Implement per-company rate limits:

```typescript
@Controller('object-import')
@UseGuards(UserAuthGuard)
export class ImportController {

  @Post('files/upload-url')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async createUploadUrl(@Body() dto: CreateImportPresignDto) { }

  @Post('sessions/:id/jobs')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 jobs per hour
  async createJob(@Param('id') sessionId: string) { }
}
```

---

### 4.3 Audit Logging

**Current State:**
No audit trail for import operations.

**Recommendation:**
Log all import actions:

```typescript
interface ImportAuditLog {
  timestamp: Date;
  companyId: string;
  userId: string;
  action: ImportAuditAction;
  sessionId?: string;
  jobId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

enum ImportAuditAction {
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_VALIDATED = 'SESSION_VALIDATED',
  JOB_STARTED = 'JOB_STARTED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_FAILED = 'JOB_FAILED',
  FIELD_PROMOTED = 'FIELD_PROMOTED',
  ASSOCIATION_PROMOTED = 'ASSOCIATION_PROMOTED',
}
```

---

### 4.4 Presigned URL Security

**Current State:**
10-minute URL expiry, basic content-type validation.

**Recommendation:**
Enhance presigned URL security:

```typescript
async createUploadUrl(filename: string, contentType: string): Promise<UploadUrlResult> {
  const storageKey = this.generateStorageKey(filename);

  const command = new PutObjectCommand({
    Bucket: this.bucket,
    Key: storageKey,
    ContentType: contentType,
    // Add security constraints
    Metadata: {
      'x-amz-meta-company-id': this.companyContext.currentCompanyId,
      'x-amz-meta-upload-timestamp': Date.now().toString(),
    },
  });

  const url = await getSignedUrl(this.s3Client, command, {
    expiresIn: 300, // Reduce to 5 minutes
    signableHeaders: new Set(['content-type', 'content-length']),
  });

  // Also validate max content-length
  return { url, storageKey, maxSize: 100 * 1024 * 1024 };
}
```

---

### 4.5 Input Sanitization

**Current State:**
Limited input validation on DTOs.

**Recommendation:**
Add comprehensive sanitization:

```typescript
// In CreateImportDraftFieldDto
@IsString()
@Matches(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/, {
  message: 'apiName must start with letter, contain only alphanumeric and underscore, max 64 chars'
})
@Transform(({ value }) => value?.trim().toLowerCase())
apiName?: string;

// In CreateImportFileDto
@IsString()
@MaxLength(255)
@Transform(({ value }) => sanitizeFilename(value))
filename: string;

// Sanitization helper
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s.-]/g, '')  // Remove special chars
    .replace(/\s+/g, '_')        // Replace spaces
    .substring(0, 255);          // Truncate
}
```

---

## 5. Code Quality & Maintainability

### 5.1 Repository Method Complexity

**Current State:**
Some repository methods (e.g., `validateSession`, `upsertObjectMaps`) are 100+ lines.

**Recommendation:**
Extract into smaller, testable units:

```typescript
// Before: One large method
async validateSession(sessionId: string): Promise<void> {
  // 150 lines of mixed concerns
}

// After: Composed from smaller methods
async validateSession(sessionId: string): Promise<void> {
  const session = await this.findSessionOrThrow(sessionId);
  this.assertSessionStatus(session, ImportSessionStatus.DRAFT);

  const objectMaps = await this.getObjectMaps(sessionId);
  this.validateObjectMaps(objectMaps);

  await this.promoteDraftFields(session);
  await this.promoteDraftAssociations(session);

  await this.updateSessionStatus(session, ImportSessionStatus.VALIDATED);
}
```

---

### 5.2 Extract Validation Logic

**Current State:**
Validation scattered across repositories.

**Recommendation:**
Create dedicated validator classes:

```typescript
@Injectable()
export class ImportSessionValidator {
  validateForPromotion(session: ImportSession, objectMaps: ImportObjectMap[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (objectMaps.length === 0) {
      errors.push({ field: 'objectMaps', message: 'At least one object map required' });
    }

    for (const map of objectMaps) {
      if (map.matchBehavior !== ImportMatchBehavior.CREATE) {
        if (!map.matchRule?.matchFields?.length) {
          errors.push({
            field: `objectMaps[${map.id}].matchFields`,
            message: `Match fields required for ${map.matchBehavior} behavior`
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

---

### 5.3 Consistent Naming Conventions

**Current Issues:**
- Mixed use of `create` vs `add` vs `upsert`
- Inconsistent DTO naming (`CreateImportPresignDto` vs `CreateImportFileDto`)

**Recommendation:**
Standardize naming:

```typescript
// DTOs
CreateImportFileRequestDto    // Request DTOs end with RequestDto
ImportFileResponseDto         // Response DTOs end with ResponseDto

// Methods
create*()   // New entity, fails if exists
upsert*()   // Create or update
update*()   // Update existing, fails if not exists
delete*()   // Remove
find*()     // Query, returns null if not found
get*()      // Query, throws if not found
list*()     // Query multiple
```

---

### 5.4 DTO Validation Decorators

**Current State:**
DTOs have class-validator decorators but some are missing or incomplete.

**Recommendation:**
Add comprehensive validation:

```typescript
export class UpsertImportFieldMapDto {
  @IsUUID()
  @IsNotEmpty()
  objectMapId: string;

  @IsInt()
  @Min(0)
  @Max(1000)  // Limit columns
  sourceIndex: number;

  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.draftFieldId)
  targetFieldId?: string;

  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.targetFieldId)
  draftFieldId?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultValueDto)
  defaultValue?: DefaultValueDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => TransformRuleDto)
  transformRule?: TransformRuleDto;
}
```

---

### 5.5 Add JSDoc Documentation

**Current State:**
Limited inline documentation.

**Recommendation:**
Add JSDoc for public APIs:

```typescript
/**
 * Validates an import session and promotes draft entities to permanent ones.
 *
 * @param sessionId - The import session ID to validate
 * @throws {BadRequestException} If session is not in DRAFT status
 * @throws {BadRequestException} If no object maps are configured
 * @throws {BadRequestException} If UPDATE/SKIP behaviors lack match fields
 * @returns Promise<void>
 *
 * @example
 * // After configuring object maps and field maps
 * await importService.validateSession('session-uuid');
 * // Session is now VALIDATED and draft fields are promoted
 */
async validateSession(sessionId: string): Promise<void> { }
```

---

## 6. Feature Gaps

### 6.1 Import Preview/Dry Run

**Current State:**
No way to preview import results before execution.

**Recommendation:**
Add dry run capability:

```typescript
@Post('sessions/:id/preview')
async previewImport(
  @Param('id') sessionId: string,
  @Query('limit') limit: number = 10
): Promise<ImportPreviewDto> {
  const session = await this.importService.getSession(sessionId);
  const rows = await this.importService.getRows(sessionId, { limit });

  const preview = await Promise.all(
    rows.map(row => this.importService.simulateRowImport(session, row))
  );

  return {
    sampleResults: preview,
    estimatedCreates: preview.filter(p => p.action === 'CREATE').length,
    estimatedUpdates: preview.filter(p => p.action === 'UPDATE').length,
    estimatedSkips: preview.filter(p => p.action === 'SKIP').length,
    potentialErrors: preview.filter(p => p.error),
  };
}
```

---

### 6.2 Import Templates

**Current State:**
Each import requires full configuration.

**Recommendation:**
Support reusable import templates:

```typescript
@Entity()
export class ImportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column()
  name: string;

  @Column('jsonb')
  objectMaps: ImportObjectMapConfig[];

  @Column('jsonb')
  fieldMaps: ImportFieldMapConfig[];

  @Column('jsonb')
  linkRules: ImportLinkRuleConfig[];
}

// Usage
@Post('sessions')
async createSession(
  @Body() dto: CreateImportSessionDto
): Promise<ImportSessionDto> {
  if (dto.templateId) {
    return this.importService.createSessionFromTemplate(dto.fileId, dto.templateId);
  }
  return this.importService.createSession(dto.fileId);
}
```

---

### 6.3 Scheduled/Recurring Imports

**Current State:**
Only manual one-time imports.

**Recommendation:**
Support scheduled imports:

```typescript
@Entity()
export class ImportSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ImportTemplate)
  template: ImportTemplate;

  @Column()
  cronExpression: string;  // e.g., "0 2 * * *" (daily at 2 AM)

  @Column()
  sourceType: 'S3' | 'SFTP' | 'URL';

  @Column('jsonb')
  sourceConfig: SourceConfig;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastRunAt: Date;

  @Column({ nullable: true })
  nextRunAt: Date;
}
```

---

### 6.4 Import Progress Tracking

**Current State:**
Job status is QUEUED → RUNNING → COMPLETED/FAILED.

**Recommendation:**
Add granular progress tracking:

```typescript
interface ImportJobProgress {
  status: ImportJobStatus;
  phase: 'PARSING' | 'VALIDATING' | 'IMPORTING' | 'LINKING' | 'FINALIZING';
  totalRows: number;
  processedRows: number;
  percentComplete: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;  // seconds
  throughput: number;              // rows per second
}

// Real-time updates via WebSocket or SSE
@Sse('sessions/:id/jobs/:jobId/progress')
async streamProgress(
  @Param('id') sessionId: string,
  @Param('jobId') jobId: string
): Observable<MessageEvent> {
  return this.importService.getProgressStream(sessionId, jobId);
}
```

---

### 6.5 Undo/Rollback Support

**Current State:**
No way to undo a completed import.

**Recommendation:**
Track imported objects for potential rollback:

```typescript
// Store created object IDs
@Entity()
export class ImportRowResult {
  // ... existing fields

  @Column('jsonb', { nullable: true })
  createdObjectIds: string[];  // All objects created from this row

  @Column('jsonb', { nullable: true })
  previousValues: Record<string, any>;  // For UPDATE operations
}

// Rollback endpoint
@Post('sessions/:id/jobs/:jobId/rollback')
async rollbackJob(
  @Param('id') sessionId: string,
  @Param('jobId') jobId: string
): Promise<RollbackResultDto> {
  return this.importService.rollbackJob(sessionId, jobId);
}
```

---

### 6.6 Excel Support

**Current State:**
Only CSV files supported.

**Recommendation:**
Add Excel file support:

```typescript
// In ImportStorageService
private readonly supportedMimeTypes = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
];

async parseFile(storageKey: string, mimeType: string): Promise<ParsedFile> {
  if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel')) {
    return this.parseExcel(storageKey);
  }
  return this.parseCsv(storageKey);
}

private async parseExcel(storageKey: string): Promise<ParsedFile> {
  const stream = await this.getFileStream(storageKey);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(stream);

  const sheet = workbook.worksheets[0];
  return {
    columns: sheet.getRow(1).values as string[],
    rows: sheet.getRows(2, sheet.rowCount).map(row => row.values),
  };
}
```

---

### 6.7 Field Value Transformations

**Current State:**
`transformRule` exists but structure undefined.

**Recommendation:**
Implement transformation DSL:

```typescript
interface TransformRule {
  type: TransformType;
  config: TransformConfig;
}

enum TransformType {
  TRIM = 'TRIM',
  UPPERCASE = 'UPPERCASE',
  LOWERCASE = 'LOWERCASE',
  DATE_FORMAT = 'DATE_FORMAT',
  NUMBER_FORMAT = 'NUMBER_FORMAT',
  REGEX_REPLACE = 'REGEX_REPLACE',
  LOOKUP = 'LOOKUP',
  SPLIT = 'SPLIT',
  CONCAT = 'CONCAT',
  CONDITIONAL = 'CONDITIONAL',
}

// Example usage
const transformRule: TransformRule = {
  type: TransformType.DATE_FORMAT,
  config: {
    inputFormat: 'MM/DD/YYYY',
    outputFormat: 'YYYY-MM-DD',
    timezone: 'UTC',
  }
};
```

---

### 6.8 Export Generated Error Report

**Current State:**
`errorReportKey` exists but implementation unclear.

**Recommendation:**
Generate downloadable error reports:

```typescript
@Get('sessions/:id/jobs/:jobId/error-report')
async getErrorReport(
  @Param('id') sessionId: string,
  @Param('jobId') jobId: string,
  @Res() res: Response
): Promise<void> {
  const job = await this.importService.getJob(sessionId, jobId);

  if (!job.errorReportKey) {
    throw new NotFoundException('No error report available');
  }

  const reportUrl = await this.storageService.createDownloadUrl(job.errorReportKey);
  res.redirect(reportUrl);
}

// Error report format (CSV)
// Row Number, Field, Original Value, Error Code, Error Message, Suggestion
```

---

## 7. Testing Strategy

### 7.1 Unit Test Coverage Gaps

**Recommended Test Cases:**

```typescript
describe('ImportSessionValidator', () => {
  it('should reject session without object maps');
  it('should reject UPDATE behavior without match fields');
  it('should reject SKIP behavior without match fields');
  it('should accept CREATE behavior without match fields');
  it('should validate apiName uniqueness for draft fields');
});

describe('ImportStorageService', () => {
  it('should reject non-CSV file types');
  it('should handle missing S3 bucket configuration');
  it('should retry on transient S3 errors');
  it('should handle empty files');
  it('should handle files with BOM');
});

describe('ImportRowRepository', () => {
  it('should batch insert rows in configurable sizes');
  it('should handle CSV with missing columns');
  it('should handle CSV with extra columns');
  it('should preserve whitespace in values');
});
```

---

### 7.2 Integration Test Scenarios

```typescript
describe('Import Flow Integration', () => {
  it('should complete full import: upload → session → configure → validate → job → results');
  it('should handle concurrent imports for same company');
  it('should handle concurrent imports across companies');
  it('should clean up on session deletion');
  it('should promote draft fields atomically');
});
```

---

### 7.3 Performance Test Thresholds

```typescript
describe('Import Performance', () => {
  it('should parse 10,000 rows in under 5 seconds');
  it('should handle CSV files up to 100MB');
  it('should maintain < 500ms response time for API endpoints');
  it('should process import job at > 100 rows/second');
});
```

---

## 8. Monitoring & Observability

### 8.1 Metrics to Track

```typescript
// Prometheus metrics
const importMetrics = {
  // Counters
  imports_started_total: new Counter('imports_started_total', 'Total imports started'),
  imports_completed_total: new Counter('imports_completed_total', 'Total imports completed'),
  imports_failed_total: new Counter('imports_failed_total', 'Total imports failed'),
  rows_imported_total: new Counter('rows_imported_total', 'Total rows imported'),

  // Histograms
  import_duration_seconds: new Histogram('import_duration_seconds', 'Import job duration'),
  row_processing_seconds: new Histogram('row_processing_seconds', 'Per-row processing time'),
  csv_parse_duration_seconds: new Histogram('csv_parse_duration_seconds', 'CSV parsing duration'),

  // Gauges
  active_import_jobs: new Gauge('active_import_jobs', 'Currently running import jobs'),
  pending_rows: new Gauge('pending_rows', 'Rows pending processing'),
};
```

---

### 8.2 Structured Logging

```typescript
// Add correlation IDs
@Injectable()
export class ImportLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || uuidv4();

    this.logger.log({
      event: 'import_request',
      correlationId,
      sessionId: request.params.id,
      action: request.path,
      companyId: request.user.companyId,
    });

    return next.handle().pipe(
      tap(() => this.logger.log({ event: 'import_response', correlationId, status: 'success' })),
      catchError(error => {
        this.logger.error({ event: 'import_error', correlationId, error: error.message });
        throw error;
      })
    );
  }
}
```

---

### 8.3 Health Check Enhancements

**Current State:**
Simple database connectivity check.

**Recommendation:**
Comprehensive health check:

```typescript
@Get('health')
async healthCheck(): Promise<ImportHealthDto> {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkS3Connectivity(),
    this.checkS3Bucket(),
    this.checkJobQueue(),
  ]);

  return {
    ok: checks.every(c => c.status === 'fulfilled'),
    database: this.mapCheckResult(checks[0]),
    s3: this.mapCheckResult(checks[1]),
    bucket: this.mapCheckResult(checks[2]),
    queue: this.mapCheckResult(checks[3]),
    timestamp: new Date().toISOString(),
  };
}
```

---

## 9. UX Improvements

### 9.1 Better Error Messages

**Current State:**
```
"Object type not found"
```

**Recommended:**
```json
{
  "code": "IMPORT_OBJECT_TYPE_NOT_FOUND",
  "message": "The object type 'contact' was not found in your account",
  "suggestion": "Check that the object type exists and you have access to it",
  "details": {
    "requestedObjectType": "contact",
    "availableObjectTypes": ["lead", "deal", "company"]
  }
}
```

---

### 9.2 API Response Consistency

**Recommendation:**
Standardize all responses:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
```

---

### 9.3 Pagination Improvements

**Current State:**
Basic limit/offset pagination.

**Recommendation:**
Add cursor-based pagination for large result sets:

```typescript
interface CursorPaginatedResponse<T> {
  items: T[];
  cursor: string | null;  // Opaque cursor for next page
  hasMore: boolean;
  total?: number;         // Optional total count
}

@Get('sessions/:id/results')
async getResults(
  @Param('id') sessionId: string,
  @Query('cursor') cursor?: string,
  @Query('limit') limit: number = 50
): Promise<CursorPaginatedResponse<ImportRowResultDto>> { }
```

---

## 10. Quick Wins

These improvements can be implemented quickly with high impact:

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| 1 | Add database indexes (Section 2.4) | 1 hour | High |
| 2 | Structured error codes (Section 3.1) | 2-3 hours | High |
| 3 | S3 connection pooling (Section 2.5) | 1 hour | Medium |
| 4 | Input sanitization (Section 4.5) | 2 hours | High |
| 5 | Health check enhancement (Section 8.3) | 1 hour | Medium |
| 6 | Add JSDoc documentation (Section 5.5) | 2-3 hours | Medium |
| 7 | Rate limiting (Section 4.2) | 1 hour | High |
| 8 | Row hash implementation (Section 2.2) | 2 hours | Medium |
| 9 | File content validation (Section 4.1) | 3 hours | High |
| 10 | Error report download (Section 6.8) | 2 hours | Medium |

---

## Implementation Roadmap

### Phase 1: Foundation (1-2 weeks)
- Implement structured error codes
- Add database indexes
- Add input sanitization
- Implement rate limiting
- Add comprehensive health checks

### Phase 2: Performance (1-2 weeks)
- S3 connection pooling
- Streaming CSV improvements
- Row hash deduplication
- Lazy load sample rows

### Phase 3: Features (2-3 weeks)
- Import preview/dry run
- Import templates
- Progress tracking
- Error report generation
- Excel support

### Phase 4: Architecture (2-3 weeks)
- CQRS pattern implementation
- Domain events
- State machine
- Storage abstraction

### Phase 5: Advanced (3-4 weeks)
- Scheduled imports
- Field transformations DSL
- Rollback support
- Real-time progress streaming

---

## Conclusion

The import module has a solid foundation with clear separation of concerns and multi-tenancy support. The recommended improvements focus on:

1. **Reliability**: Better error handling, retry logic, and validation
2. **Performance**: Streaming optimizations, indexing, and connection pooling
3. **Security**: Content validation, rate limiting, and audit logging
4. **Features**: Preview, templates, progress tracking, and Excel support
5. **Maintainability**: Code organization, documentation, and testing

Implementing these improvements incrementally will significantly enhance the import functionality while maintaining backward compatibility.