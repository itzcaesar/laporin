-- Add performance indexes for audit_logs table
-- Based on BMAD research: proper indexing can dramatically speed up search operations

-- Index for filtering by action (used in audit log filtering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_created ON audit_logs(target_type, created_at DESC);

-- Index for actor-based queries (already exists but ensuring it's optimized)
-- The existing index on actorId is sufficient, but we can add a composite for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;

-- Partial index for recent logs (last 30 days) - frequently accessed
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON audit_logs(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Comment explaining the optimization strategy
COMMENT ON INDEX idx_audit_logs_action IS 'Optimizes filtering by action type';
COMMENT ON INDEX idx_audit_logs_target_created IS 'Optimizes filtering by target type with time-based sorting';
COMMENT ON INDEX idx_audit_logs_actor_created IS 'Optimizes actor-based queries with time sorting';
COMMENT ON INDEX idx_audit_logs_recent IS 'Partial index for recent logs (hot data) - reduces index size and improves query speed';
