'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react'
import { getSchoolBySlug } from '@/lib/auth'
import { ComprehensiveAdmissionForm } from '@/components/comprehensive-admission-form'
import Link from 'next/link'

export default function ApplicationPage({ params }: { params: { schoolSlug: string } }) {
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

  const handleSuccess = () => {
    setSuccess(true)
  }

  const resetForm = () => {
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

  if (error) {
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

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">School not found</p>
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
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admission Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your admission application has been successfully submitted. The school administration will review your application and contact you regarding the next steps.
            </p>
            <div className="space-y-3">
              <Button
                onClick={resetForm}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Submit Another Application
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/${params.schoolSlug}`}
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-4">Admission Application</h1>
          <p className="text-gray-600">
            Apply for admission to {school.name}. No login required.
          </p>
        </div>
<ComprehensiveAdmissionForm
          schoolId={school.id}
          schoolSlug={params.schoolSlug}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}