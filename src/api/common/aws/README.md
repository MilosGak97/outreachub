## AWS Dynamo helpers

- `AwsModule` (global) registers `DynamoDBClient` using env `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`.
- `PropertiesDynamoService` wraps access to the `properties_zillow` table (configurable via `PROPERTIES_ZILLOW_TABLE` and `PROPERTIES_ZILLOW_PK`, default `zpid`).

### Provided methods
- `getByPrimaryKey(value)` → fetch a single item by the configured PK (default `zpid`).

### Usage (example)
```ts
@Controller('admin/properties')
export class AdminPropertiesController {
  constructor(private readonly propertiesDdb: PropertiesDynamoService) {}

  // ...
}
```
