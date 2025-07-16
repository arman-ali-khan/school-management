/*
  # Create Exam Types Table

  1. New Tables
    - `exam_types` - Store custom exam types for each school
      - Basic info: name, description
      - School association: school_id
      - Status: is_active for soft delete

  2. Security
    - Enable RLS on exam_types table
    - School owners can manage exam types in their school
    - Maintain data isolation between schools

  3. Indexes
    - Add indexes for better query performance
    - Unique constraint on name per school
*/

-- Create exam_types table
CREATE TABLE IF NOT EXISTS exam_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Enable RLS
ALTER TABLE exam_types ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "School owners can manage their school exam types"
  ON exam_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = exam_types.school_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_exam_types_school_id ON exam_types(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_types_name ON exam_types(name);
CREATE INDEX IF NOT EXISTS idx_exam_types_active ON exam_types(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_exam_types_updated_at BEFORE UPDATE ON exam_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();