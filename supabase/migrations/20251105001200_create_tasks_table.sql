/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key) - Unique identifier for each task
      - `user_id` (uuid, foreign key) - References auth.users, links task to user
      - `title` (text) - The task title/description
      - `priority` (text) - Task priority: 'low', 'medium', or 'high'
      - `status` (text) - Task status: 'pending', 'in-progress', or 'done'
      - `created_at` (timestamptz) - Timestamp when task was created
      - `updated_at` (timestamptz) - Timestamp when task was last updated
  
  2. Security
    - Enable RLS on `tasks` table
    - Add policy for users to read their own tasks
    - Add policy for users to insert their own tasks
    - Add policy for users to update their own tasks
    - Add policy for users to delete their own tasks
  
  3. Important Notes
    - All tasks are private to the user who created them
    - Priority values are constrained to: low, medium, high
    - Status values are constrained to: pending, in-progress, done
    - Foreign key ensures tasks are always linked to valid users
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'done')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
