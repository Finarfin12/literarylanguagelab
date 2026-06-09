-- Setup Shared Annotations (Community)
CREATE TABLE community_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    explanation TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read
CREATE POLICY "Everyone can view community annotations"
    ON community_annotations FOR SELECT
    USING (true);

-- Authenticated users can insert
CREATE POLICY "Users can insert annotations"
    ON community_annotations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own
CREATE POLICY "Users can update their own annotations"
    ON community_annotations FOR UPDATE
    USING (auth.uid() = user_id);

-- Authenticated users can delete their own
CREATE POLICY "Users can delete their own annotations"
    ON community_annotations FOR DELETE
    USING (auth.uid() = user_id);

-- Create a table to track votes so a user can only vote once per annotation
CREATE TABLE annotation_votes (
    annotation_id UUID REFERENCES community_annotations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    PRIMARY KEY (annotation_id, user_id)
);

-- Note: We will handle vote increments via Server Actions (which run securely on backend),
-- so we don't strictly need complex database functions for voting, but RLS on the votes table is good.
ALTER TABLE annotation_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own votes"
    ON annotation_votes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view votes"
    ON annotation_votes FOR SELECT
    USING (true);
