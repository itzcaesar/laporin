-- ── Add Performance Indexes ──
-- Optimizes common query patterns and prevents N+1 queries

-- Reports table indexes for common filters
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_region_code ON reports(region_code);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category_status ON reports(category_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_agency_status ON reports(agency_id, status) WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_assigned_officer ON reports(assigned_officer_id) WHERE assigned_officer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_priority_score_status ON reports(priority_score DESC, status);
CREATE INDEX IF NOT EXISTS idx_reports_tracking_code_lower ON reports(LOWER(tracking_code));

-- Full-text search index for reports
CREATE INDEX IF NOT EXISTS idx_reports_title_search ON reports USING gin(to_tsvector('indonesian', title));
CREATE INDEX IF NOT EXISTS idx_reports_description_search ON reports USING gin(to_tsvector('indonesian', description));

-- Media table indexes
CREATE INDEX IF NOT EXISTS idx_media_report_id ON media(report_id);
CREATE INDEX IF NOT EXISTS idx_media_report_created ON media(report_id, created_at);

-- Status history indexes
CREATE INDEX IF NOT EXISTS idx_status_history_report_id ON status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_status_history_report_created ON status_history(report_id, created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_report_id ON comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_report_created ON comments(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id) WHERE author_id IS NOT NULL;

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_report_id ON votes(report_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_report_id ON bookmarks(report_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Satisfaction ratings indexes
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_report_id ON satisfaction_ratings(report_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_user_id ON satisfaction_ratings(user_id);

-- AI analysis cache indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_report_id ON ai_analysis_cache(report_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_duplicate ON ai_analysis_cache(is_duplicate, duplicate_of_id) WHERE is_duplicate = true;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_agency_role ON users(agency_id, role) WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Refresh tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE is_revoked = false;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reports_list_query ON reports(status, category_id, region_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_gov_dashboard ON reports(agency_id, status, priority, created_at DESC) WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_citizen_list ON reports(reporter_id, status, created_at DESC) WHERE reporter_id IS NOT NULL;

-- Partial indexes for specific use cases
CREATE INDEX IF NOT EXISTS idx_reports_active ON reports(created_at DESC) WHERE status IN ('new', 'verified', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_reports_completed ON reports(completed_at DESC) WHERE status IN ('completed', 'verified_complete', 'closed');
CREATE INDEX IF NOT EXISTS idx_reports_sla_breach ON reports(estimated_end) WHERE status IN ('new', 'verified', 'in_progress') AND estimated_end IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE reports;
ANALYZE media;
ANALYZE status_history;
ANALYZE comments;
ANALYZE votes;
ANALYZE bookmarks;
ANALYZE notifications;
ANALYZE users;
ANALYZE audit_logs;
