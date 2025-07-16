'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GraduationCap, 
  UserPlus, 
  Edit,
  Eye, 
  Trash2, 
  Phone, 
  MapPin,
  Calendar,
  Users,
  Search,
  Upload,
  User,
  BookOpen,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { StudentDetails } from './student-details'
import { StudentEdit } from './student-edit'

interface Student {
  id: string
  roll_number: string
  full_name: string
  class: string
  section?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  address?: string
  father_name?: string
  father_phone?: string
  father_occupation?: string
  mother_name?: string
  mother_phone?: string
  mother_occupation?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_relation?: string
  admission_date?: string
  status: string
  created_at: string
}

interface StudentManagementProps {
  schoolId: string
  section: 'students' | 'create-student' | 'student-details' | 'student-edit'
  studentId?: string
}

export function StudentManagement({ schoolId, section, studentId }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'edit'>('list')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    // Student Photo
    student_photo_url: '',
    
    // Basic Information
    roll_number: '',
    full_name: '',
    full_name_bangla: '',
    father_name: '',
    mother_name: '',
    religion: '',
    date_of_birth: '',
    gender: '',
    national_id_birth_cert: '',
    father_nid: '',
    mother_nid: '',
    
    // Contact Information
    phone: '',
    email: '',
    father_phone: '',
    mother_phone: '',
    father_occupation: '',
    mother_occupation: '',
    
    // Address Information
    present_village_ward: '',
    present_post_office_code: '',
    present_upazila: '',
    present_district: '',
    permanent_same_as_present: false,
    permanent_village_ward: '',
    permanent_post_office_code: '',
    permanent_upazila: '',
    permanent_district: '',
    
    // Guardian Information
    has_different_guardian: false,
    guardian_name: '',
    guardian_nid: '',
    guardian_phone: '',
    guardian_relation: '',
    guardian_status: '',
    
    // Previous Education
    last_school_name: '',
    last_class: '',
    year_passed: '',
    education_board: '',
    previous_school_eiin: '',
    tc_ssc_roll: '',
    
    // Academic Information
    class: '',
    section: '',
    desired_group: '',
    jsc_ssc_group: '',
    gpa: '',
    result_education_board: '',
    has_scholarship: false,
    technical_other_details: '',
    
    // Admission Details
    admission_date: new Date().toISOString().split('T')[0],
    status: 'active'
  })

  const religions = ['Islam', 'Hindu', 'Christian', 'Buddhist', 'Other']
  const occupations = ['Farmer', 'Doctor', 'Teacher', 'Business', 'Engineer', 'Government Service', 'Private Service', 'Housewife', 'None', 'Other']
  const guardianRelations = ['Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other']
  const guardianStatuses = ['Alive', 'Dead', 'Abroad', 'Not applicable']
  const groups = ['Science', 'Commerce', 'Arts']
  const boards = ['Dhaka', 'Chittagong', 'Comilla', 'Jessore', 'Rajshahi', 'Barisal', 'Sylhet', 'Dinajpur', 'Madrasah', 'Technical']

  useEffect(() => {
    if (section === 'students') {
      fetchStudents()
    }
  }, [schoolId, section])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if roll number already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('roll_number', formData.roll_number)

      if (existingStudent && existingStudent.length > 0) {
        throw new Error('Roll number already exists')
      }

      const { error } = await supabase
        .from('students')
        .insert({
          ...formData,
          school_id: schoolId
        })

      if (error) throw error

      // Reset form
      setFormData({
        student_photo_url: '',
        roll_number: '',
        full_name: '',
        full_name_bangla: '',
        father_name: '',
        mother_name: '',
        religion: '',
        date_of_birth: '',
        gender: '',
        national_id_birth_cert: '',
        father_nid: '',
        mother_nid: '',
        phone: '',
        email: '',
        father_phone: '',
        mother_phone: '',
        father_occupation: '',
        mother_occupation: '',
        present_village_ward: '',
        present_post_office_code: '',
        present_upazila: '',
        present_district: '',
        permanent_same_as_present: false,
        permanent_village_ward: '',
        permanent_post_office_code: '',
        permanent_upazila: '',
        permanent_district: '',
        has_different_guardian: false,
        guardian_name: '',
        guardian_nid: '',
        guardian_phone: '',
        guardian_relation: '',
        guardian_status: '',
        last_school_name: '',
        last_class: '',
        year_passed: '',
        education_board: '',
        previous_school_eiin: '',
        tc_ssc_roll: '',
        class: '',
        section: '',
        desired_group: '',
        jsc_ssc_group: '',
        gpa: '',
        result_education_board: '',
        has_scholarship: false,
        technical_other_details: '',
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })

      toast({
        title: "Student Created",
        description: `${formData.full_name} has been successfully added to the system.`,
      })

      // Refresh students list
      fetchStudents()
    } catch (err: any) {
      setError(err.message || 'Failed to create student')
    } finally {
      setLoading(false)
    }
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setCurrentView('details')
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setCurrentView('edit')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedStudent(null)
    fetchStudents() // Refresh the list
  }

  const handleStudentSaved = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s))
    setSelectedStudent(updatedStudent)
    setCurrentView('details')
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) throw error

      setStudents(prev => prev.filter(s => s.id !== studentId))
      
      toast({
        title: "Student Deleted",
        description: "Student record has been successfully deleted.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to delete student')
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !filterClass || student.class === filterClass
    return matchesSearch && matchesClass
  })

  const uniqueClasses = [...new Set(students.map(s => s.class))].filter(Boolean)

  // Handle different views
  if (section === 'students' && currentView === 'details' && selectedStudent) {
    return (
      <StudentDetails
        studentId={selectedStudent.id}
        onBack={handleBackToList}
        onEdit={handleEditStudent}
      />
    )
  }

  if (section === 'students' && currentView === 'edit' && selectedStudent) {
    return (
      <StudentEdit
        student={selectedStudent}
        onBack={handleBackToList}
        onSave={handleStudentSaved}
      />
    )
  }

  if (section === 'create-student') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Add New Student
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateStudent} className="space-y-8">
            {/* Student Photo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Student Photo
              </h3>
              <div>
                <Label htmlFor="student_photo_url">Photo URL</Label>
                <Input
                  id="student_photo_url"
                  type="url"
                  value={formData.student_photo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_photo_url: e.target.value }))}
                  placeholder="https://images.pexels.com/..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please provide a direct link to the student's photo
                </p>
                {formData.student_photo_url && (
                  <div className="mt-3">
                    <img
                      src={formData.student_photo_url}
                      alt="Student preview"
                      className="w-24 h-24 rounded-lg object-cover border"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="roll_number">Roll Number *</Label>
                  <Input
                    id="roll_number"
                    value={formData.roll_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                    placeholder="2024001"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name (English) *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Student's full name in English"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="full_name_bangla">Full Name (Bangla)</Label>
                  <Input
                    id="full_name_bangla"
                    value={formData.full_name_bangla}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name_bangla: e.target.value }))}
                    placeholder="শিক্ষার্থীর পূর্ণ নাম"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="father_name">Father's Name *</Label>
                  <Input
                    id="father_name"
                    value={formData.father_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                    placeholder="পিতার নাম"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mother_name">Mother's Name *</Label>
                  <Input
                    id="mother_name"
                    value={formData.mother_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, mother_name: e.target.value }))}
                    placeholder="মাতার নাম"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="religion">Religion *</Label>
                  <Select
                    value={formData.religion}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, religion: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select religion" />
                    </SelectTrigger>
                    <SelectContent>
                      {religions.map((religion) => (
                        <SelectItem key={religion} value={religion}>{religion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="class">Class *</Label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                    placeholder="Class 10"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="A"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Gender *</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    className="flex space-x-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="national_id_birth_cert">National ID/Birth Certificate</Label>
                  <Input
                    id="national_id_birth_cert"
                    value={formData.national_id_birth_cert}
                    onChange={(e) => setFormData(prev => ({ ...prev, national_id_birth_cert: e.target.value }))}
                    placeholder="জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="father_nid">Father's NID</Label>
                  <Input
                    id="father_nid"
                    value={formData.father_nid}
                    onChange={(e) => setFormData(prev => ({ ...prev, father_nid: e.target.value }))}
                    placeholder="পিতার জাতীয় পরিচয়পত্র"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mother_nid">Mother's NID</Label>
                  <Input
                    id="mother_nid"
                    value={formData.mother_nid}
                    onChange={(e) => setFormData(prev => ({ ...prev, mother_nid: e.target.value }))}
                    placeholder="মাতার জাতীয় পরিচয়পত্র"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="student@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Student Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+880-XXX-XXXXXX"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="father_phone">Father's Phone *</Label>
                  <Input
                    id="father_phone"
                    type="tel"
                    value={formData.father_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, father_phone: e.target.value }))}
                    placeholder="+880-XXX-XXXXXX"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mother_phone">Mother's Phone *</Label>
                  <Input
                    id="mother_phone"
                    type="tel"
                    value={formData.mother_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, mother_phone: e.target.value }))}
                    placeholder="+880-XXX-XXXXXX"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="father_occupation">Father's Occupation</Label>
                  <Select
                    value={formData.father_occupation}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, father_occupation: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupations.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mother_occupation">Mother's Occupation</Label>
                  <Select
                    value={formData.mother_occupation}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mother_occupation: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupations.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address Information
              </h3>
              
              {/* Present Address */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Present Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="present_village_ward">Village/Ward</Label>
                    <Input
                      id="present_village_ward"
                      value={formData.present_village_ward}
                      onChange={(e) => setFormData(prev => ({ ...prev, present_village_ward: e.target.value }))}
                      placeholder="গ্রাম/ওয়ার্ড"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="present_post_office_code">Post Office + Code</Label>
                    <Input
                      id="present_post_office_code"
                      value={formData.present_post_office_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, present_post_office_code: e.target.value }))}
                      placeholder="ডাকঘর + কোড"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="present_upazila">Upazila</Label>
                    <Input
                      id="present_upazila"
                      value={formData.present_upazila}
                      onChange={(e) => setFormData(prev => ({ ...prev, present_upazila: e.target.value }))}
                      placeholder="উপজেলা"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="present_district">District</Label>
                    <Input
                      id="present_district"
                      value={formData.present_district}
                      onChange={(e) => setFormData(prev => ({ ...prev, present_district: e.target.value }))}
                      placeholder="জেলা"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="permanent_same_as_present"
                    checked={formData.permanent_same_as_present}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        permanent_same_as_present: checked as boolean,
                        ...(checked && {
                          permanent_village_ward: prev.present_village_ward,
                          permanent_post_office_code: prev.present_post_office_code,
                          permanent_upazila: prev.present_upazila,
                          permanent_district: prev.present_district
                        })
                      }))
                    }}
                  />
                  <Label htmlFor="permanent_same_as_present">
                    Permanent address is same as present address
                  </Label>
                </div>

                {!formData.permanent_same_as_present && (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-4">Permanent Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="permanent_village_ward">Village/Ward</Label>
                        <Input
                          id="permanent_village_ward"
                          value={formData.permanent_village_ward}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanent_village_ward: e.target.value }))}
                          placeholder="গ্রাম/ওয়ার্ড"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="permanent_post_office_code">Post Office + Code</Label>
                        <Input
                          id="permanent_post_office_code"
                          value={formData.permanent_post_office_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanent_post_office_code: e.target.value }))}
                          placeholder="ডাকঘর + কোড"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="permanent_upazila">Upazila</Label>
                        <Input
                          id="permanent_upazila"
                          value={formData.permanent_upazila}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanent_upazila: e.target.value }))}
                          placeholder="উপজেলা"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="permanent_district">District</Label>
                        <Input
                          id="permanent_district"
                          value={formData.permanent_district}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanent_district: e.target.value }))}
                          placeholder="জেলা"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Guardian Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Guardian Information (Optional)
              </h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="has_different_guardian"
                  checked={formData.has_different_guardian}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_different_guardian: checked as boolean }))}
                />
                <Label htmlFor="has_different_guardian">
                  I have a guardian different from parents
                </Label>
              </div>

              {formData.has_different_guardian && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardian_name">Guardian's Name</Label>
                    <Input
                      id="guardian_name"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                      placeholder="অভিভাবকের নাম"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guardian_nid">Guardian's NID</Label>
                    <Input
                      id="guardian_nid"
                      value={formData.guardian_nid}
                      onChange={(e) => setFormData(prev => ({ ...prev, guardian_nid: e.target.value }))}
                      placeholder="অভিভাবকের জাতীয় পরিচয়পত্র"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guardian_phone">Guardian's Phone</Label>
                    <Input
                      id="guardian_phone"
                      type="tel"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                      placeholder="+880-XXX-XXXXXX"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guardian_relation">Relation</Label>
                    <Select
                      value={formData.guardian_relation}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, guardian_relation: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {guardianRelations.map((relation) => (
                          <SelectItem key={relation} value={relation}>{relation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guardian_status">Guardian Status</Label>
                    <Select
                      value={formData.guardian_status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, guardian_status: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {guardianStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Previous Education */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Previous Education
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="last_school_name">Last School Name</Label>
                  <Input
                    id="last_school_name"
                    value={formData.last_school_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_school_name: e.target.value }))}
                    placeholder="শেষ বিদ্যালয়ের নাম"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="last_class">Last Class</Label>
                  <Input
                    id="last_class"
                    value={formData.last_class}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_class: e.target.value }))}
                    placeholder="Class 5"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="year_passed">Year Passed</Label>
                  <Input
                    id="year_passed"
                    value={formData.year_passed}
                    onChange={(e) => setFormData(prev => ({ ...prev, year_passed: e.target.value }))}
                    placeholder="2023"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="education_board">Education Board</Label>
                  <Select
                    value={formData.education_board}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, education_board: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map((board) => (
                        <SelectItem key={board} value={board}>{board}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="previous_school_eiin">Previous School EIIN</Label>
                  <Input
                    id="previous_school_eiin"
                    value={formData.previous_school_eiin}
                    onChange={(e) => setFormData(prev => ({ ...prev, previous_school_eiin: e.target.value }))}
                    placeholder="EIIN নম্বর"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tc_ssc_roll">TC/SSC Roll</Label>
                  <Input
                    id="tc_ssc_roll"
                    value={formData.tc_ssc_roll}
                    onChange={(e) => setFormData(prev => ({ ...prev, tc_ssc_roll: e.target.value }))}
                    placeholder="TC/SSC রোল নম্বর"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="desired_group">Group (if applicable)</Label>
                  <Select
                    value={formData.desired_group}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, desired_group: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jsc_ssc_group">JSC/SSC Group</Label>
                  <Select
                    value={formData.jsc_ssc_group}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jsc_ssc_group: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.gpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                    placeholder="4.50"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="result_education_board">Result Education Board</Label>
                  <Select
                    value={formData.result_education_board}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, result_education_board: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map((board) => (
                        <SelectItem key={board} value={board}>{board}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="has_scholarship"
                      checked={formData.has_scholarship}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_scholarship: checked as boolean }))}
                    />
                    <Label htmlFor="has_scholarship">Has Scholarship</Label>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="technical_other_details">Technical/Other Details</Label>
                <Textarea
                  id="technical_other_details"
                  value={formData.technical_other_details}
                  onChange={(e) => setFormData(prev => ({ ...prev, technical_other_details: e.target.value }))}
                  placeholder="Any technical or other educational details..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Admission & Status */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Admission & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <Input
                    id="admission_date"
                    type="date"
                    value={formData.admission_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, admission_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Student Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All fields marked with (*) are required</li>
                <li>• This form captures comprehensive student information similar to admission applications</li>
                <li>• Guardian information is optional and only needed if different from parents</li>
                <li>• Previous education details help maintain academic records</li>
                <li>• Address information can be copied from present to permanent if same</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Creating Student Record...' : 'Create Student Record'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Manage Students ({filteredStudents.length})
          </CardTitle>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No students found</p>
            <p className="text-sm">
              {searchTerm || filterClass ? 'Try adjusting your filters' : 'Use "Add Student" to create student records'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Roll: {student.roll_number}</Badge>
                            <Badge variant="secondary">{student.class}{student.section && ` - ${student.section}`}</Badge>
                            <Badge 
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                              className={student.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {student.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {student.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                        {student.father_name && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Father: {student.father_name}</span>
                          </div>
                        )}
                        {student.admission_date && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Admitted: {new Date(student.admission_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {student.address && (
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{student.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}