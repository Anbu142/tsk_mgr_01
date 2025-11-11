/*
  # Add Vector Search Function for Tasks

  1. New Functions
    - `match_tasks` - Performs vector similarity search on tasks table
      - Parameters:
        - `query_embedding` (vector) - The embedding vector to search for
        - `match_threshold` (float) - Minimum similarity score (0-1)
        - `match_count` (int) - Maximum number of results to return
        - `user_id` (uuid) - Filter results to specific user's tasks
      - Returns: Tasks with similarity scores above threshold
  
  2. Security
    - Function respects RLS policies on tasks table
    - Only returns tasks belonging to the specified user
  
  3. Important Notes
    - Uses cosine similarity for vector comparison
    - Results are ordered by similarity (highest first)
    - Only returns tasks that have embeddings generated
*/

CREATE OR REPLACE FUNCTION match_tasks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  status text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tasks.id,
    tasks.title,
    tasks.priority,
    tasks.status,
    tasks.created_at,
    1 - (tasks.embedding <=> query_embedding) AS similarity
  FROM tasks
  WHERE 
    tasks.user_id = match_tasks.user_id
    AND tasks.embedding IS NOT NULL
    AND 1 - (tasks.embedding <=> query_embedding) > match_threshold
  ORDER BY tasks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;