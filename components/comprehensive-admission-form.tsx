'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  User, 
  Users, 
  MapPin, 
  GraduationCap, 
  Award,
  MessageSquare,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ComprehensiveAdmissionFormProps {
  schoolId: string
  schoolSlug: string
  onSuccess: () => void
}

interface FormData {
  // Student Photo
  student_photo_url: string
  
  // Student Basic Information
  full_name_bangla: string
  full_name_english: string
  father_name: string
  mother_name: string
  religion: string
  date_of_birth: string
  gender: string
  national_id_birth_cert: string
  father_nid: string
  mother_nid: string
  father_phone: string
  mother_phone: string
  father_occupation: string
  mother_occupation: string
  email: string
  
  // Present Address
  present_village_ward: string
  present_post_office_code: string
  present_upazila: string
  present_district: string
  
  // Permanent Address
  permanent_same_as_present: boolean
  permanent_village_ward: string
  permanent_post_office_code: string
  permanent_upazila: string
  permanent_district: string
  
  // Guardian Information
  has_different_guardian: boolean
  guardian_name: string
  guardian_nid: string
  guardian_phone: string
  guardian_relation: string
  guardian_status: string
  
  // Previous Education
  last_school_name: string
  last_class: string
  year_passed: string
  education_board: string
  previous_school_eiin: string
  tc_ssc_roll: string
  
  // Exam Results
  jsc_ssc_group: string
  gpa: string
  result_education_board: string
  has_scholarship: boolean
  technical_other_details: string
  
  // Communication Preferences
  contact_via_sms: boolean
  contact_via_email: boolean
  contact_via_phone: boolean
  contact_via_post: boolean
  
  // Class and Group Preferences
  desired_class: string
  desired_group: string
  desired_section: string
  
  // Consent
  terms_accepted: boolean
}

export function ComprehensiveAdmissionForm({ schoolId, schoolSlug, onSuccess }: ComprehensiveAdmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const totalSteps = 8

  const [formData, setFormData] = useState<FormData>({
    student_photo_url: '',
    full_name_bangla: '',
    full_name_english: '',
    father_name: '',
    mother_name: '',
    religion: '',
    date_of_birth: '',
    gender: '',
    national_id_birth_cert: '',
    father_nid: '',
    mother_nid: '',
    father_phone: '',
    mother_phone: '',
    father_occupation: '',
    mother_occupation: '',
    email: '',
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
    jsc_ssc_group: '',
    gpa: '',
    result_education_board: '',
    has_scholarship: false,
    technical_other_details: '',
    contact_via_sms: false,
    contact_via_email: false,
    contact_via_phone: false,
    contact_via_post: false,
    desired_class: '',
    desired_group: '',
    desired_section: '',
    terms_accepted: false
  })

  const religions = ['Islam', 'Hindu', 'Christian', 'Buddhist', 'Other']
  const occupations = ['Farmer', 'Doctor', 'Teacher', 'Business', 'Engineer', 'Government Service', 'Private Service', 'Housewife', 'None', 'Other']
  const guardianRelations = ['Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other']
  const guardianStatuses = ['Alive', 'Dead', 'Abroad', 'Not applicable']
  const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
  const groups = ['Science', 'Commerce', 'Arts']
  const boards = ['Dhaka', 'Chittagong', 'Comilla', 'Jessore', 'Rajshahi', 'Barisal', 'Sylhet', 'Dinajpur', 'Madrasah', 'Technical']

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes

  const handleImageUpload = async (file: File) => {
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your environment variables.')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 2MB')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'ml_default') // You may need to create an unsigned upload preset
      formData.append('folder', `school-${schoolId}/students`)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return data.secure_url
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const imageUrl = await handleImageUpload(file)
      updateFormData('student_photo_url', imageUrl)
      
      // Show success message (you can add toast here if available)
      console.log('Image uploaded successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      const requiredFields = [
        'full_name_bangla', 'full_name_english', 'father_name', 'mother_name', 
        'religion', 'date_of_birth', 'gender', 'national_id_birth_cert',
        'father_nid', 'mother_nid', 'father_phone', 'mother_phone',
        'father_occupation', 'mother_occupation', 'present_village_ward',
        'present_post_office_code', 'present_upazila', 'present_district',
        'last_school_name', 'last_class', 'year_passed', 'education_board',
        'desired_class'
      ]

      for (const field of requiredFields) {
        if (!formData[field as keyof FormData]) {
          throw new Error(`${field.replace('_', ' ')} is required`)
        }
      }

      // Validate guardian relation if guardian is specified
      if (formData.has_different_guardian && formData.guardian_name) {
        if (!formData.guardian_relation || !guardianRelations.includes(formData.guardian_relation)) {
          throw new Error('Please select a valid guardian relation')
        }
      }

      if (!formData.terms_accepted) {
        throw new Error('You must accept the school terms and conditions')
      }

      // Prepare admission data
      const admissionData = {
        school_id: schoolId,
        ...formData,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        // Ensure guardian fields are null if no guardian is specified
        guardian_name: formData.has_different_guardian ? formData.guardian_name : null,
        guardian_nid: formData.has_different_guardian ? formData.guardian_nid : null,
        guardian_phone: formData.has_different_guardian ? formData.guardian_phone : null,
        guardian_relation: formData.has_different_guardian && formData.guardian_relation ? formData.guardian_relation : null,
        guardian_status: formData.has_different_guardian && formData.guardian_status ? formData.guardian_status : null
      }

      const { error: insertError } = await supabase
        .from('admission_applications')
        .insert(admissionData)

      if (insertError) throw insertError

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to submit admission application')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-copy present address to permanent if checkbox is checked
    if (field === 'permanent_same_as_present' && value === true) {
      setFormData(prev => ({
        ...prev,
        permanent_village_ward: prev.present_village_ward,
        permanent_post_office_code: prev.present_post_office_code,
        permanent_upazila: prev.present_upazila,
        permanent_district: prev.present_district
      }))
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStudentPhotoStep()
      case 2:
        return renderBasicInfoStep()
      case 3:
        return renderAddressStep()
      case 4:
        return renderGuardianStep()
      case 5:
        return renderPreviousEducationStep()
      case 6:
        return renderExamResultsStep()
      case 7:
        return renderPreferencesStep()
      case 8:
        return renderFinalStep()
      default:
        return renderBasicInfoStep()
    }
  }

  const renderStudentPhotoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          শিক্ষার্থীর ছবি / Student Photo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File Upload Section */}
          <div>
            <Label htmlFor="photo-upload">Upload Student Photo *</Label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-4"></div>
                        <p className="text-sm text-gray-600">Uploading image...</p>
                      </>
                    ) : formData.student_photo_url ? (
                      <>
                        <img
                          src={formData.student_photo_url}
                          alt="Student preview"
                          className="w-32 h-32 rounded-lg object-cover border mb-4"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
                          }}
                        />
                        <p className="text-sm text-green-600 font-medium">Photo uploaded successfully!</p>
                        <p className="text-xs text-gray-500">Click to change photo</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mb-4 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> student photo
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 2MB</p>
                      </>
                    )}
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Progress indicator */}
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          </div>

          {/* Alternative URL Input */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or enter photo URL</span>
            </div>
          </div>

          <div>
            <Label htmlFor="student_photo_url">Photo URL (Alternative)</Label>
            <Input
              id="student_photo_url"
              type="url"
              value={formData.student_photo_url}
              onChange={(e) => updateFormData('student_photo_url', e.target.value)}
              placeholder="https://images.pexels.com/photos/..."
              className="mt-1"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can also paste a direct link to the student's photo
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Photo Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use a clear, recent photo of the student</li>
              <li>• Photo should be passport-size or similar format</li>
              <li>• Maximum file size: 2MB</li>
              <li>• Supported formats: JPG, PNG, JPEG</li>
              <li>• Photo will be used for official school records</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderBasicInfoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          শিক্ষার্থী সম্পর্কিত তথ্য / Student Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name_bangla">Full Name (Bangla) *</Label>
            <Input
              id="full_name_bangla"
              value={formData.full_name_bangla}
              onChange={(e) => updateFormData('full_name_bangla', e.target.value)}
              placeholder="শিক্ষার্থীর পূর্ণ নাম"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="full_name_english">Full Name (English) *</Label>
            <Input
              id="full_name_english"
              value={formData.full_name_english}
              onChange={(e) => updateFormData('full_name_english', e.target.value)}
              placeholder="Student's full name in English"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="father_name">Father's Name *</Label>
            <Input
              id="father_name"
              value={formData.father_name}
              onChange={(e) => updateFormData('father_name', e.target.value)}
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
              onChange={(e) => updateFormData('mother_name', e.target.value)}
              placeholder="মাতার নাম"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="religion">Religion *</Label>
            <Select
              value={formData.religion}
              onValueChange={(value) => updateFormData('religion', value)}
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
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => updateFormData('date_of_birth', e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Gender *</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => updateFormData('gender', value)}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="national_id_birth_cert">National ID/Birth Certificate *</Label>
            <Input
              id="national_id_birth_cert"
              value={formData.national_id_birth_cert}
              onChange={(e) => updateFormData('national_id_birth_cert', e.target.value)}
              placeholder="জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="father_nid">Father's NID *</Label>
            <Input
              id="father_nid"
              value={formData.father_nid}
              onChange={(e) => updateFormData('father_nid', e.target.value)}
              placeholder="পিতার জাতীয় পরিচয়পত্র"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mother_nid">Mother's NID *</Label>
            <Input
              id="mother_nid"
              value={formData.mother_nid}
              onChange={(e) => updateFormData('mother_nid', e.target.value)}
              placeholder="মাতার জাতীয় পরিচয়পত্র"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="father_phone">Father's Phone *</Label>
            <Input
              id="father_phone"
              type="tel"
              value={formData.father_phone}
              onChange={(e) => updateFormData('father_phone', e.target.value)}
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
              onChange={(e) => updateFormData('mother_phone', e.target.value)}
              placeholder="+880-XXX-XXXXXX"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="father_occupation">Father's Occupation *</Label>
            <Select
              value={formData.father_occupation}
              onValueChange={(value) => updateFormData('father_occupation', value)}
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
            <Label htmlFor="mother_occupation">Mother's Occupation *</Label>
            <Select
              value={formData.mother_occupation}
              onValueChange={(value) => updateFormData('mother_occupation', value)}
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

        <div>
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="student@example.com"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderAddressStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          ঠিকানা / Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Present Address */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Present Address *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="present_village_ward">Village/Ward *</Label>
              <Input
                id="present_village_ward"
                value={formData.present_village_ward}
                onChange={(e) => updateFormData('present_village_ward', e.target.value)}
                placeholder="গ্রাম/ওয়ার্ড"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="present_post_office_code">Post Office + Code *</Label>
              <Input
                id="present_post_office_code"
                value={formData.present_post_office_code}
                onChange={(e) => updateFormData('present_post_office_code', e.target.value)}
                placeholder="ডাকঘর + কোড"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="present_upazila">Upazila *</Label>
              <Input
                id="present_upazila"
                value={formData.present_upazila}
                onChange={(e) => updateFormData('present_upazila', e.target.value)}
                placeholder="উপজেলা"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="present_district">District *</Label>
              <Input
                id="present_district"
                value={formData.present_district}
                onChange={(e) => updateFormData('present_district', e.target.value)}
                placeholder="জেলা"
                required
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
              onCheckedChange={(checked) => updateFormData('permanent_same_as_present', checked as boolean)}
            />
            <Label htmlFor="permanent_same_as_present">
              Permanent address is same as present address
            </Label>
          </div>

          {!formData.permanent_same_as_present && (
            <>
              <h3 className="text-lg font-semibold mb-4">Permanent Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="permanent_village_ward">Village/Ward</Label>
                  <Input
                    id="permanent_village_ward"
                    value={formData.permanent_village_ward}
                    onChange={(e) => updateFormData('permanent_village_ward', e.target.value)}
                    placeholder="গ্রাম/ওয়ার্ড"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="permanent_post_office_code">Post Office + Code</Label>
                  <Input
                    id="permanent_post_office_code"
                    value={formData.permanent_post_office_code}
                    onChange={(e) => updateFormData('permanent_post_office_code', e.target.value)}
                    placeholder="ডাকঘর + কোড"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="permanent_upazila">Upazila</Label>
                  <Input
                    id="permanent_upazila"
                    value={formData.permanent_upazila}
                    onChange={(e) => updateFormData('permanent_upazila', e.target.value)}
                    placeholder="উপজেলা"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="permanent_district">District</Label>
                  <Input
                    id="permanent_district"
                    value={formData.permanent_district}
                    onChange={(e) => updateFormData('permanent_district', e.target.value)}
                    placeholder="জেলা"
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderGuardianStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          অভিভাবকের তথ্য / Guardian Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_different_guardian"
            checked={formData.has_different_guardian}
            onCheckedChange={(checked) => updateFormData('has_different_guardian', checked as boolean)}
          />
          <Label htmlFor="has_different_guardian">
            I have a guardian different from parents
          </Label>
        </div>

        {formData.has_different_guardian && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="guardian_name">Guardian Name</Label>
              <Input
                id="guardian_name"
                value={formData.guardian_name}
                onChange={(e) => updateFormData('guardian_name', e.target.value)}
                placeholder="অভিভাবকের নাম"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="guardian_nid">Guardian NID</Label>
              <Input
                id="guardian_nid"
                value={formData.guardian_nid}
                onChange={(e) => updateFormData('guardian_nid', e.target.value)}
                placeholder="অভিভাবকের জাতীয় পরিচয়পত্র"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="guardian_phone">Guardian Phone</Label>
              <Input
                id="guardian_phone"
                type="tel"
                value={formData.guardian_phone}
                onChange={(e) => updateFormData('guardian_phone', e.target.value)}
                placeholder="+880-XXX-XXXXXX"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="guardian_relation">Relation</Label>
              <Select
                value={formData.guardian_relation}
                onValueChange={(value) => updateFormData('guardian_relation', value)}
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
                onValueChange={(value) => updateFormData('guardian_status', value)}
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
      </CardContent>
    </Card>
  )

  const renderPreviousEducationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <GraduationCap className="h-5 w-5 mr-2" />
          পূর্ববর্তী শিক্ষার তথ্য / Previous Education
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="last_school_name">Last School Name *</Label>
            <Input
              id="last_school_name"
              value={formData.last_school_name}
              onChange={(e) => updateFormData('last_school_name', e.target.value)}
              placeholder="শেষ বিদ্যালয়ের নাম"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="last_class">Last Class *</Label>
            <Select
              value={formData.last_class}
              onValueChange={(value) => updateFormData('last_class', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year_passed">Year Passed *</Label>
            <Input
              id="year_passed"
              value={formData.year_passed}
              onChange={(e) => updateFormData('year_passed', e.target.value)}
              placeholder="2023"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="education_board">Board *</Label>
            <Select
              value={formData.education_board}
              onValueChange={(value) => updateFormData('education_board', value)}
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
            <Label htmlFor="previous_school_eiin">EIIN of Previous School</Label>
            <Input
              id="previous_school_eiin"
              value={formData.previous_school_eiin}
              onChange={(e) => updateFormData('previous_school_eiin', e.target.value)}
              placeholder="EIIN নম্বর"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tc_ssc_roll">TC/SSC Roll (Optional)</Label>
            <Input
              id="tc_ssc_roll"
              value={formData.tc_ssc_roll}
              onChange={(e) => updateFormData('tc_ssc_roll', e.target.value)}
              placeholder="TC/SSC রোল নম্বর"
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderExamResultsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2" />
          পরীক্ষার ফলাফল / Exam Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="jsc_ssc_group">JSC/SSC Group</Label>
            <Select
              value={formData.jsc_ssc_group}
              onValueChange={(value) => updateFormData('jsc_ssc_group', value)}
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
              onChange={(e) => updateFormData('gpa', e.target.value)}
              placeholder="4.50"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="result_education_board">Education Board</Label>
            <Select
              value={formData.result_education_board}
              onValueChange={(value) => updateFormData('result_education_board', value)}
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
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_scholarship"
            checked={formData.has_scholarship}
            onCheckedChange={(checked) => updateFormData('has_scholarship', checked as boolean)}
          />
          <Label htmlFor="has_scholarship">
            Has Scholarship
          </Label>
        </div>

        <div>
          <Label htmlFor="technical_other_details">Technical/Other Details</Label>
          <Textarea
            id="technical_other_details"
            value={formData.technical_other_details}
            onChange={(e) => updateFormData('technical_other_details', e.target.value)}
            placeholder="Any technical or other educational details..."
            rows={3}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderPreferencesStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          শাখা ও শ্রেণি পছন্দ / Class & Group Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="desired_class">Desired Class *</Label>
            <Select
              value={formData.desired_class}
              onValueChange={(value) => updateFormData('desired_class', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Class 6">Class 6</SelectItem>
                <SelectItem value="Class 7">Class 7</SelectItem>
                <SelectItem value="Class 8">Class 8</SelectItem>
                <SelectItem value="Class 9">Class 9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="desired_group">Group</Label>
            <Select
              value={formData.desired_group}
              onValueChange={(value) => updateFormData('desired_group', value)}
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
            <Label htmlFor="desired_section">Section (Optional)</Label>
            <Input
              id="desired_section"
              value={formData.desired_section}
              onChange={(e) => updateFormData('desired_section', e.target.value)}
              placeholder="A, B, C..."
              className="mt-1"
            />
          </div>
        </div>

        {/* Communication Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">যোগাযোগ মাধ্যম / Communication Preferences</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contact_via_sms"
                checked={formData.contact_via_sms}
                onCheckedChange={(checked) => updateFormData('contact_via_sms', checked as boolean)}
              />
              <Label htmlFor="contact_via_sms">SMS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="contact_via_email"
                checked={formData.contact_via_email}
                onCheckedChange={(checked) => updateFormData('contact_via_email', checked as boolean)}
              />
              <Label htmlFor="contact_via_email">Email</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="contact_via_phone"
                checked={formData.contact_via_phone}
                onCheckedChange={(checked) => updateFormData('contact_via_phone', checked as boolean)}
              />
              <Label htmlFor="contact_via_phone">Phone</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="contact_via_post"
                checked={formData.contact_via_post}
                onCheckedChange={(checked) => updateFormData('contact_via_post', checked as boolean)}
              />
              <Label htmlFor="contact_via_post">Post</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderFinalStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          চূড়ান্ত নিশ্চিতকরণ / Final Confirmation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">Application Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>Student:</strong> {formData.full_name_english} ({formData.full_name_bangla})
            </div>
            <div>
              <strong>Father:</strong> {formData.father_name}
            </div>
            <div>
              <strong>Mother:</strong> {formData.mother_name}
            </div>
            <div>
              <strong>Desired Class:</strong> {formData.desired_class}
            </div>
            <div>
              <strong>Religion:</strong> {formData.religion}
            </div>
            <div>
              <strong>Gender:</strong> {formData.gender}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms_accepted"
            checked={formData.terms_accepted}
            onCheckedChange={(checked) => updateFormData('terms_accepted', checked as boolean)}
          />
          <Label htmlFor="terms_accepted" className="text-sm">
            I accept the school terms and conditions and confirm that all information provided is accurate *
          </Label>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• All information must be accurate and complete</li>
            <li>• False information may result in application rejection</li>
            <li>• You will be contacted regarding the admission status</li>
            <li>• Keep your application reference for future communication</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-green-600 hover:bg-green-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Next'}
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || uploading || !formData.terms_accepted}
            >
              {loading || uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {uploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}