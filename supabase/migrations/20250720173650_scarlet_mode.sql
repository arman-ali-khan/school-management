/*
  # Create Complaints System

  1. New Tables
    - `complaints` - Store complaint submissions
      - Basic info: complainant details, complaint type, subject
      - Target info: against_type (student/teacher/other), target_details
      - Content: description, evidence_urls
      - Status: pending, under_review, resolved, dismissed
      - Priority: low, medium, high, urgent

  2. Security
    - Enable RLS on complaints table
    - Allow public insertion for complaints
    - School owners can manage complaints for their school

  3. Indexes
    - Add indexes for better query performance
*/

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  
  -- Complainant Information
  complainant_name text NOT NULL,
  complainant_email text,
  complainant_phone text,
  complainant_relation text NOT NULL CHECK (complainant_relation IN (
    'Student', 'Parent', 'Teacher', 'Staff', 'Alumni', 'Community Member', 'Anonymous'
  )),
  
  -- Complaint Details
  complaint_type text NOT NULL CHECK (complaint_type IN (
    'Academic Issue', 'Behavioral Issue', 'Bullying', 'Harassment', 
    'Discrimination', 'Safety Concern', 'Facility Issue', 'Administrative Issue',
    'Teacher Conduct', 'Student Conduct', 'Other'
  )),
  
  -- Target Information
  against_type text NOT NULL CHECK (against_type IN ('Student', 'Teacher', 'Staff', 'Administration', 'Facility', 'Other')),
  target_name text,
  target_class text,
  target_department text,
  
  -- Complaint Content
  subject text NOT NULL,
  description text NOT NULL,
  incident_date date,
  incident_location text,
  evidence_urls text[], -- Array of URLs to evidence files
  witnesses text,
  
  -- Status and Priority
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Admin Response
  admin_response text,
  admin_notes text,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can submit complaints"
  ON complaints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "School owners can view their school complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = complaints.school_id
      AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "School owners can update their school complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = complaints.school_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_complaints_school_id ON complaints(school_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_type ON complaints(complaint_type);
CREATE INDEX IF NOT EXISTS idx_complaints_against_type ON complaints(against_type);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();