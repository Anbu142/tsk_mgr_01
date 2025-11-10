/*
  # Create subtasks table

  1. New Tables
    - `subtasks`
      - `id` (uuid, primary key) - Unique identifier for each subtask
      - `task_id` (uuid, foreign key) - References the parent task
      - `user_id` (uuid, foreign key) - References the user who owns the subtask
      - `title` (text) - The subtask title/description
      - `completed` (boolean) - Whether the subtask is completed
      - `created_at` (timestamptz) - Timestamp when subtask was created
      
  2. Security
    - Enable RLS on `subtasks` table
    - Add policy for users to view their own subtasks
    - Add policy for users to insert their own subtasks
    - Add policy for users to update their own subtasks
    - Add policy for users to delete their own subtasks
    
  3. Important Notes
    - Subtasks are linked to both a parent task and a user
    - Users can only access subtasks they own
    - Foreign key constraints ensure data integrity
*/

CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);