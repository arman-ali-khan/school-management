'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/ui/sidebar'
import { ContentManagement } from '@/components/dashboard/content-management'
import { TeacherManagement } from '@/components/dashboard/teacher-management'
import { StudentManagement } from '@/components/dashboard/student-management'
import { ResultManagement } from '@/components/dashboard/result-management'
import { SettingsManagement } from '@/components/dashboard/settings-management'
import { ApplicationDetails } from '@/components/dashboard/application-details'
import { ApplicationEdit } from '@/components/dashboard/application-edit'
import { CarouselManagement } from '@/components/dashboard/carousel-management'
import { 
  Users, 
  FileText, 
  LogOut, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileSearch
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUser, getUserRole, signOut, getSchoolBySlug, getSchoolContent } from '@/lib/auth'
import Link from 'next/link'

export default function DashboardPage({ params }: { params: { schoolSlug: string } }) {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<any>(null)
  const [school, setSchool] = useState<any>(null)
  const [content, setContent] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'edit'>('list')
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const router = useRouter()

  const fetchSchoolData = useCallback(async () => {
    try {
      const schoolData = await getSchoolBySlug(params.schoolSlug)
      const contentData = await getSchoolContent(schoolData.id)
      setSchool(schoolData)
      setContent(contentData)
    } catch (error) {
      console.error('Failed to fetch school data:', error)
    }
  }, [params.schoolSlug])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getUser()
        if (!currentUser) {
          router.push(`/${params.schoolSlug}/login`)
          return
        }

        const role = await getUserRole(currentUser.id)
        setUser(currentUser)
        setUserRole(role)

        await fetchSchoolData()

        // Fetch applications
        const { data: appsData } = await supabase
          .from('admission_applications')
          .select('*')
          .eq('school_id', role.school_id)
          .order('created_at', { ascending: false })

        setApplications(appsData || [])
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push(`/${params.schoolSlug}/login`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [params.schoolSlug, router, fetchSchoolData])

  const handleLogout = async () => {
    await signOut()
    router.push(`/${params.schoolSlug}`)
  }

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    const { error } = await supabase
      .from('admission_applications')
      .update({ application_status: status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (!error) {
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, application_status: status } : app
        )
      )
    }
  }

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application)
    setCurrentView('details')
  }

  const handleEditApplication = (application: any) => {
    setSelectedApplication(application)
    setCurrentView('edit')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedApplication(null)
    // Refresh applications list
    fetchApplications()
  }

  const handleApplicationSaved = (updatedApplication: any) => {
    setApplications(prev => prev.map(app => 
      app.id === updatedApplication.id ? updatedApplication : app
    ))
    setSelectedApplication(updatedApplication)
    setCurrentView('details')
  }

  const fetchApplications = async () => {
    if (userRole?.school_id) {
      const { data: appsData } = await supabase
        .from('admission_applications')
        .select('*')
        .eq('school_id', userRole.school_id)
        .order('created_at', { ascending: false })

      setApplications(appsData || [])
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleContentUpdate = (section: string, newContent: any) => {
    setContent(prev => prev.map(item => 
      item.section === section ? { ...item, content: newContent } : item
    ))
  }

  const getContentBySection = (section: string) => {
    return content.find(c => c.section === section)?.content || {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 right-0 z-10" style={{ left: sidebarCollapsed ? '64px' : '256px' }}>
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="ml-12">
              <h1 className="text-lg font-bold text-gray-900 capitalize">
                {activeSection.replace('-', ' ')} {activeSection === 'overview' ? 'Dashboard' : ''}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="capitalize text-xs">
                {userRole?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeSection.replace('-', ' ')} {activeSection === 'overview' ? 'Dashboard' : ''}
                </h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.email}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="capitalize">
                  {userRole?.role?.replace('_', ' ')}
                </Badge>
                <Link href={`/${params.schoolSlug}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Site
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        schoolName={school?.name || 'School'}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        schoolSlug={params.schoolSlug}
      />

      {/* Main Content */}
      <div className="flex-1 pt-16 pb-20 md:pb-0" style={{ marginLeft: sidebarCollapsed ? '4px' : '3px' }}>
        <div className="md:hidden pt-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderMainContent()}
        </div>
      </div>
    </div>
  )

  function renderMainContent() {
    switch (activeSection) {
      case 'overview':
        return renderOverview()
      case 'applications':
        return renderApplicationsSection()
      case 'carousel':
        return <CarouselManagement schoolId={school?.id} />
      case 'about-section':
        return (
          <ContentManagement
            schoolId={school?.id}
            section="about-section"
            content={getContentBySection('about')}
            onContentUpdate={handleContentUpdate}
          />
        )
      case 'gallery':
        return (
          <ContentManagement
            schoolId={school?.id}
            section="gallery"
            content={getContentBySection('gallery')}
            onContentUpdate={handleContentUpdate}
          />
        )
      case 'notices':
        return (
          <ContentManagement
            schoolId={school?.id}
            section="notices"
            content={getContentBySection('notices')}
            onContentUpdate={handleContentUpdate}
          />
        )
      case 'featured-students':
        return (
          <ContentManagement
            schoolId={school?.id}
            section="students"
            content={getContentBySection('students')}
            onContentUpdate={handleContentUpdate}
          />
        )
      case 'teachers':
        return <TeacherManagement schoolId={school?.id} section="teachers" />
      case 'create-teacher':
        return <TeacherManagement schoolId={school?.id} section="create-teacher" />
      case 'students':
        return <StudentManagement schoolId={school?.id} section="students" />
      case 'create-student':
        return <StudentManagement schoolId={school?.id} section="create-student" />
      case 'results':
        return <ResultManagement schoolId={school?.id} />
      case 'exams':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Exam Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Exam management coming soon</p>
              </div>
            </CardContent>
          </Card>
        )
      case 'settings':
        return (
          <SettingsManagement
            schoolId={school?.id}
            school={school}
            onSchoolUpdate={setSchool}
          />
        )
      default:
        return renderOverview()
    }
  }

  function renderApplicationsSection() {
    if (currentView === 'details' && selectedApplication) {
      return (
        <ApplicationDetails
          applicationId={selectedApplication.id}
          onBack={handleBackToList}
          onEdit={handleEditApplication}
          onStatusUpdate={updateApplicationStatus}
        />
      )
    }

    if (currentView === 'edit' && selectedApplication) {
      return (
        <ApplicationEdit
          application={selectedApplication}
          onBack={handleBackToList}
          onSave={handleApplicationSaved}
        />
      )
    }

    return renderApplications()
  }
  function renderOverview() {
    return (
      <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                All time applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => app.application_status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Applications</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => app.application_status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {renderApplications()}
      </>
    )
  }

  function renderApplications() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No applications yet</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{app.full_name_english}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        Admission Application - {app.desired_class}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(app.application_status)}>
                        {getStatusIcon(app.application_status)}
                        <span className="ml-1 capitalize">{app.application_status}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-3">
                    <p>Father: {app.father_name}</p>
                    <p>Phone: {app.father_phone}</p>
                    <p>Religion: {app.religion}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewApplication(app)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FileSearch className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      {app.application_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
}