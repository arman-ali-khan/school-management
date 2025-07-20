'use client'

import { useState, useEffect } from 'react'
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
  MessageSquare, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  User,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react'
import { getSchoolBySlug } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface FormData {
  complainant_name: string
  complainant_email: string
  complainant_phone: string
  complainant_relation: string
  complaint_type: string
  against_type: string
  target_name: string
  target_class: string
  target_department: string
  subject: string
  description: string
  incident_date: string
  incident_location: string
  evidence_urls: string
  witnesses: string
  anonymous_submission: boolean
}

export default function ComplaintPage({ params }: { params: { schoolSlug: string } }) {
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    complainant_name: '',
    complainant_email: '',
    complainant_phone: '',
    complainant_relation: '',
    complaint_type: '',
    against_type: '',
    target_name: '',
    target_class: '',
    target_department: '',
    subject: '',
    description: '',
    incident_date: '',
    incident_location: '',
    evidence_urls: '',
    witnesses: '',
    anonymous_submission: false
  })

  const complainantRelations = [
    'Student',
    'Parent', 
    'Teacher',
    'Staff',
    'Alumni',
    'Community Member',
    'Anonymous'
  ]

  const complaintTypes = [
    'Academic Issue',
    'Behavioral Issue', 
    'Bullying',
    'Harassment',
    'Discrimination',
    'Safety Concern',
    'Facility Issue',
    'Administrative Issue',
    'Teacher Conduct',
    'Student Conduct',
    'Other'
  ]

  const againstTypes = [
    'Student',
    'Teacher',
    'Staff',
    'Administration',
    'Facility',
    'Other'
  ]

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const schoolData = await getSchoolBySlug(params.schoolSlug)
        setSchool(schoolData)
      } catch (err: any) {
        setError('School not found')
      } finally {
        setLoading(false)
      }
    }
    fetchSchool()
  }, [params.schoolSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.subject || !formData.description || !formData.complaint_type || !formData.against_type) {
        throw new Error('Please fill in all required fields')
      }

      if (!formData.anonymous_submission && !formData.complainant_name) {
        throw new Error('Complainant name is required for non-anonymous complaints')
      }

      // Prepare complaint data
      const complaintData = {
        school_id: school.id,
        complainant_name: formData.anonymous_submission ? 'Anonymous' : formData.complainant_name,
        complainant_email: formData.anonymous_submission ? null : formData.complainant_email,
        complainant_phone: formData.anonymous_submission ? null : formData.complainant_phone,
        complainant_relation: formData.anonymous_submission ? 'Anonymous' : formData.complainant_relation,
        complaint_type: formData.complaint_type,
        against_type: formData.against_type,
        target_name: formData.target_name || null,
        target_class: formData.target_class || null,
        target_department: formData.target_department || null,
        subject: formData.subject,
        description: formData.description,
        incident_date: formData.incident_date || null,
        incident_location: formData.incident_location || null,
        evidence_urls: formData.evidence_urls ? formData.evidence_urls.split(',').map(url => url.trim()) : null,
        witnesses: formData.witnesses || null,
        status: 'pending',
        priority: 'medium'
      }

      const { error: insertError } = await supabase
        .from('complaints')
        .insert(complaintData)

      if (insertError) throw insertError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      complainant_name: '',
      complainant_email: '',
      complainant_phone: '',
      complainant_relation: '',
      complaint_type: '',
      against_type: '',
      target_name: '',
      target_class: '',
      target_department: '',
      subject: '',
      description: '',
      incident_date: '',
      incident_location: '',
      evidence_urls: '',
      witnesses: '',
      anonymous_submission: false
    })
    setSuccess(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline">Back to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your complaint has been submitted and will be reviewed by the school administration. 
              You will be contacted if additional information is needed.
            </p>
            <div className="space-y-3">
              <Button
                onClick={resetForm}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Submit Another Complaint
              </Button>
              <Link href={`/${params.schoolSlug}`}>
                <Button variant="outline" className="w-full">
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/${params.schoolSlug}`}
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Complaint</h1>
          <p className="text-gray-600">
            Report concerns or issues to {school.name} administration. All complaints are taken seriously and handled confidentially.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Anonymous Submission Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Submission Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous_submission"
                  checked={formData.anonymous_submission}
                  onCheckedChange={(checked) => updateFormData('anonymous_submission', checked as boolean)}
                />
                <Label htmlFor="anonymous_submission">
                  Submit this complaint anonymously
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Anonymous complaints will be investigated, but we may not be able to provide updates on the resolution.
              </p>
            </CardContent>
          </Card>

          {/* Complainant Information */}
          {!formData.anonymous_submission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complainant_name">Full Name *</Label>
                    <Input
                      id="complainant_name"
                      value={formData.complainant_name}
                      onChange={(e) => updateFormData('complainant_name', e.target.value)}
                      placeholder="Your full name"
                      required={!formData.anonymous_submission}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complainant_relation">Your Relation to School *</Label>
                    <Select
                      value={formData.complainant_relation}
                      onValueChange={(value) => updateFormData('complainant_relation', value)}
                      required={!formData.anonymous_submission}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {complainantRelations.filter(rel => rel !== 'Anonymous').map((relation) => (
                          <SelectItem key={relation} value={relation}>{relation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complainant_email">Email Address</Label>
                    <Input
                      id="complainant_email"
                      type="email"
                      value={formData.complainant_email}
                      onChange={(e) => updateFormData('complainant_email', e.target.value)}
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complainant_phone">Phone Number</Label>
                    <Input
                      id="complainant_phone"
                      type="tel"
                      value={formData.complainant_phone}
                      onChange={(e) => updateFormData('complainant_phone', e.target.value)}
                      placeholder="+880-XXX-XXXXXX"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Complaint Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complaint_type">Type of Complaint *</Label>
                  <Select
                    value={formData.complaint_type}
                    onValueChange={(value) => updateFormData('complaint_type', value)}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select complaint type" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="against_type">Complaint Against *</Label>
                  <Select
                    value={formData.against_type}
                    onValueChange={(value) => updateFormData('against_type', value)}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                      {againstTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => updateFormData('subject', e.target.value)}
                  placeholder="Brief summary of the complaint"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Please provide a detailed description of the incident or issue..."
                  rows={6}
                  required
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Target Information (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_name">Name of Person/Entity</Label>
                  <Input
                    id="target_name"
                    value={formData.target_name}
                    onChange={(e) => updateFormData('target_name', e.target.value)}
                    placeholder="Name (if applicable)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="target_class">Class/Grade (if student)</Label>
                  <Input
                    id="target_class"
                    value={formData.target_class}
                    onChange={(e) => updateFormData('target_class', e.target.value)}
                    placeholder="Class 10, Section A"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="target_department">Department (if staff/teacher)</Label>
                <Input
                  id="target_department"
                  value={formData.target_department}
                  onChange={(e) => updateFormData('target_department', e.target.value)}
                  placeholder="Mathematics, Administration, etc."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Incident Details (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incident_date">Date of Incident</Label>
                  <Input
                    id="incident_date"
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => updateFormData('incident_date', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="incident_location">Location of Incident</Label>
                  <Input
                    id="incident_location"
                    value={formData.incident_location}
                    onChange={(e) => updateFormData('incident_location', e.target.value)}
                    placeholder="Classroom, playground, etc."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="witnesses">Witnesses</Label>
                <Textarea
                  id="witnesses"
                  value={formData.witnesses}
                  onChange={(e) => updateFormData('witnesses', e.target.value)}
                  placeholder="Names of any witnesses to the incident..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="evidence_urls">Evidence URLs (Optional)</Label>
                <Textarea
                  id="evidence_urls"
                  value={formData.evidence_urls}
                  onChange={(e) => updateFormData('evidence_urls', e.target.value)}
                  placeholder="Comma-separated URLs to photos, documents, or other evidence..."
                  rows={2}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple URLs with commas. Upload files to a cloud service and paste the links here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Important Information
            </h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• All complaints are treated seriously and investigated thoroughly</li>
              <li>• Your information will be kept confidential to the extent possible</li>
              <li>• False or malicious complaints may result in disciplinary action</li>
              <li>• You may be contacted for additional information during the investigation</li>
              <li>• Anonymous complaints are accepted but may limit our ability to investigate</li>
              <li>• For urgent safety concerns, please contact the school directly</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Complaint...
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 mr-2" />
                Submit Complaint
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}