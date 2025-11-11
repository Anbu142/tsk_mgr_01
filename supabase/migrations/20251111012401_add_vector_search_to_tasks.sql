/*
  # Add Vector Search Support to Tasks

  1. Extensions
    - Enable `vector` extension for pgvector support
  
  2. Schema Changes
    - Add `embedding` column to `tasks` table (vector type with 384 dimensions for gte-small model)
    - Create HNSW index on embedding column for efficient similarity search
  
  3. Important Notes
    - Using 384 dimensions for Supabase's gte-small embedding model
    - HNSW index provides fast approximate nearest neighbor search
    - Embeddings will be generated via Edge Function and stored for each task
*/

CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE tasks ADD COLUMN embedding vector(384);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING hnsw (embedding vector_cosine_ops);