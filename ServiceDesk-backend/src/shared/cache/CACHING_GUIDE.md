# Redis Caching Guide

## Overview

The caching infrastructure provides a Redis-based caching layer with automatic invalidation strategies and decorators for easy integration.

## Quick Start

### 1. Initialize Cache Manager

```typescript
import { CacheManager } from '@/shared/cache';

const cacheManager = CacheManager.getInstance();
```

### 2. Basic Cache Operations

```typescript
// Set a value (with 1 hour TTL)
await cacheManager.set('user:123', userData, 3600);

// Get a value
const user = await cacheManager.get<User>('user:123');

// Delete a value
await cacheManager.delete('user:123');

// Check if exists
const exists = await cacheManager.exists('user:123');
```

## Cache Key Patterns

Use predefined cache key patterns for consistency:

```typescript
import { CacheKeys } from '@/shared/cache';

// Form cache keys
CacheKeys.formTemplate('form_123');           // form:template:form_123
CacheKeys.formSubmission('sub_456');          // form:submission:sub_456
CacheKeys.formSubmissions('form_123', 'approved'); // form:submissions:form_123:approved

// Task cache keys
CacheKeys.task('task_789');                   // task:task_789
CacheKeys.tasks('project_123', 'completed');  // task:list:project_123:completed

// Incident cache keys
CacheKeys.incident('inc_456');                // incident:inc_456
CacheKeys.incidents('open');                  // incident:list:open

// Project cache keys
CacheKeys.project('proj_123');                // project:proj_123
CacheKeys.projectMembers('proj_123');         // project:members:proj_123

// User cache keys
CacheKeys.user('user_123');                   // user:user_123
CacheKeys.userPermissions('user_123');        // user:permissions:user_123

// Analytics cache keys
CacheKeys.dashboard('user_123');              // dashboard:user_123
CacheKeys.report('report_123');               // report:report_123
```

## Cache Invalidation

### Pattern-Based Invalidation

```typescript
import { CacheInvalidationStrategy } from '@/shared/cache';

const invalidationStrategy = CacheInvalidationStrategy.getInstance();

// Invalidate all form-related cache
await invalidationStrategy.invalidateDomain('form');

// Invalidate all cache for a specific entity
await invalidationStrategy.invalidateEntity('form', 'form_123');

// Invalidate by pattern
await invalidationStrategy.invalidatePattern('form:submission:*');

// Invalidate specific key
await invalidationStrategy.invalidate('form:template:form_123');
```

### Dependency-Based Invalidation

```typescript
// Register cache dependencies
invalidationStrategy.registerDependency(
  'form:template:form_123',
  'form:submissions:form_123'
);

// When parent is invalidated, dependent is also invalidated
await invalidationStrategy.invalidate('form:template:form_123');
// This also invalidates 'form:submissions:form_123'
```

## Using Cache Decorators

### Cacheable Decorator

```typescript
import { Cacheable, CacheKeyGenerators } from '@/shared/cache';

export class FormService {
  @Cacheable(
    (formId: string) => CacheKeyGenerators.formTemplate(formId),
    3600 // 1 hour TTL
  )
  async getFormTemplate(formId: string): Promise<FormTemplate> {
    // Expensive operation - result will be cached
    return FormTemplate.findById(formId);
  }
}
```

### CacheInvalidate Decorator

```typescript
import { CacheInvalidate, CacheKeys } from '@/shared/cache';

export class FormService {
  @CacheInvalidate([
    'form:template:*',
    'form:submissions:*'
  ])
  async updateFormTemplate(formId: string, data: unknown): Promise<void> {
    // Update logic
    // Cache will be automatically invalidated after this method
  }
}
```

## Advanced Usage

### Custom Cache Key Generators

```typescript
import { createCacheKeyGenerator } from '@/shared/cache';

// Single parameter
const userKeyGen = createCacheKeyGenerator.single('user');
userKeyGen('123'); // user:123

// Multiple parameters
const taskKeyGen = createCacheKeyGenerator.multiple('task');
taskKeyGen('proj_123', 'status', 'open'); // task:proj_123:status:open

// Object properties
const formKeyGen = createCacheKeyGenerator.object('form', 'id', 'version');
formKeyGen({ id: 'form_123', version: 2 }); // form:form_123:2

// Custom function
const customKeyGen = createCacheKeyGenerator.custom(
  (userId: string, type: string) => `custom:${userId}:${type}`
);
```

### Cache Statistics

```typescript
const stats = await cacheManager.getStats();
console.log(stats);
// { info: "..." }
```

### TTL Management

```typescript
// Get remaining TTL
const ttl = await cacheManager.getTTL('user:123');

// Set TTL for existing key
await cacheManager.setTTL('user:123', 7200);

// Increment counter
const count = await cacheManager.increment('page:visits', 1);
```

## Best Practices

1. **Use Consistent Key Patterns**: Always use `CacheKeys` for consistency
2. **Set Appropriate TTLs**: Balance between freshness and performance
3. **Register Dependencies**: Use dependency registration for related cache entries
4. **Monitor Cache Hit Rate**: Track cache effectiveness
5. **Handle Cache Misses**: Always have fallback logic for cache misses
6. **Invalidate on Updates**: Invalidate cache when data changes
7. **Use Decorators**: Leverage `@Cacheable` and `@CacheInvalidate` for cleaner code

## Configuration

Set Redis URL via environment variable:

```bash
REDIS_URL=redis://localhost:6379
```

Or pass directly:

```typescript
const cacheManager = CacheManager.getInstance('redis://custom-host:6379');
```

## Error Handling

Cache operations gracefully degrade if Redis is unavailable:

```typescript
// If Redis is down, get() returns null
const cached = await cacheManager.get('key');
if (!cached) {
  // Fetch from database
  const data = await database.get();
  // Try to cache (will fail silently if Redis unavailable)
  await cacheManager.set('key', data);
  return data;
}
return cached;
```

## Performance Considerations

- **Cache Stampede**: Use cache locks for expensive operations
- **Memory Management**: Monitor Redis memory usage
- **Eviction Policies**: Configure Redis eviction policy (LRU recommended)
- **Key Expiration**: Always set appropriate TTLs to prevent memory bloat

## Monitoring

```typescript
// Get queue statistics
const stats = cacheManager.getStats();

// Monitor cache performance
logger.info('Cache stats:', stats);
```

## Cleanup

```typescript
// Close Redis connection
await cacheManager.close();

// Clear all cache
await cacheManager.clear();
```
