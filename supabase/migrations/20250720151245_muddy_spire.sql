/*
  # Create Student Fees Management System

  1. New Tables
    - `student_fees` - Store fee records for students
      - Basic info: student_id, fee_type, amount, month, year
      - Payment status: paid, pending, overdue
      - Payment details: payment_date, payment_method

  2. Security
    - Enable RLS on student_fees table
    - School owners can manage fees in their school
    - Maintain data isolation between schools

  3. Indexes
    - Add indexes for better query performance
    - Unique constraint on student + fee_type + month + year
*/

-- Create student_fees table
CREATE TABLE IF NOT EXISTS student_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  fee_type text NOT NULL CHECK (fee_type IN (
    'Monthly Fee', 'Exam Fee', 'Sports Fee', 'Development Fee', 
    'Practical Fee', 'Registration Fee', 'SSC Form Fill-up', 'Others'
  )),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  month integer CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_date date,
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, fee_type, month, year)
);

-- Enable RLS
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "School owners can manage their school student fees"
  ON student_fees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = student_fees.school_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_student_fees_school_id ON student_fees(school_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_month_year ON student_fees(month, year);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_fee_type ON student_fees(fee_type);

-- Add trigger for updated_at
CREATE TRIGGER update_student_fees_updated_at BEFORE UPDATE ON student_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for fee summary
CREATE OR REPLACE VIEW student_fees_summary AS
SELECT 
  sf.school_id,
  sf.student_id,
  s.roll_number,
  s.full_name,
  s.class,
  s.section,
  sf.month,
  sf.year,
  SUM(CASE WHEN sf.fee_type = 'Monthly Fee' THEN sf.amount ELSE 0 END) as monthly_fee,
  SUM(CASE WHEN sf.fee_type = 'Exam Fee' THEN sf.amount ELSE 0 END) as exam_fee,
  SUM(CASE WHEN sf.fee_type = 'Sports Fee' THEN sf.amount ELSE 0 END) as sports_fee,
  SUM(CASE WHEN sf.fee_type = 'Development Fee' THEN sf.amount ELSE 0 END) as development_fee,
  SUM(CASE WHEN sf.fee_type = 'Practical Fee' THEN sf.amount ELSE 0 END) as practical_fee,
  SUM(CASE WHEN sf.fee_type = 'Registration Fee' THEN sf.amount ELSE 0 END) as registration_fee,
  SUM(CASE WHEN sf.fee_type = 'SSC Form Fill-up' THEN sf.amount ELSE 0 END) as ssc_form_fee,
  SUM(CASE WHEN sf.fee_type = 'Others' THEN sf.amount ELSE 0 END) as others_fee,
  SUM(sf.amount) as total_amount,
  COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count
FROM student_fees sf
JOIN students s ON sf.student_id = s.id
GROUP BY sf.school_id, sf.student_id, s.roll_number, s.full_name, s.class, s.section, sf.month, sf.year;