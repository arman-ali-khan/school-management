'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  GraduationCap,
  Save,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Teacher {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  subject?: string
  qualification?: string
  experience?: string
  created_at: string
}

interface TeacherManagementProps {
  schoolId: string
  section: 'teachers' | 'create-teacher'
}

export function TeacherManagement({ schoolId, section }: TeacherManagementProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    subject: '',
    qualification: '',
    experience: '',
    password: '',
    role: 'teacher'
  })

  useEffect(() => {
    if (section === 'teachers') {
      fetchTeachers()
    }
  }, [schoolId, section])

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeachers(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call API route to create teacher
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          subject: formData.subject,
          qualification: formData.qualification,
          experience: formData.experience,
          school_id: schoolId,
          role: formData.role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create teacher')
      }

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        subject: '',
        qualification: '',
        experience: '',
        password: '',
        role: 'teacher'
      })

      toast({
        title: "Teacher Created",
        description: `${formData.full_name} has been successfully added as a teacher.`,
      })

      // Refresh teachers list
      if (section === 'teachers') {
        fetchTeachers()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    try {
      // Call API route to delete teacher
      const response = await fetch(`/api/teachers?id=${teacherId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete teacher')
      }

      setTeachers(prev => prev.filter(t => t.id !== teacherId))
      
      toast({
        title: "Teacher Deleted",
        description: "Teacher account has been successfully deleted.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to delete teacher')
    }
  }

  if (section === 'create-teacher') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Add New Teacher
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateTeacher} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Teacher's full name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="teacher@school.com"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
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
                <Label htmlFor="subject">Subject/Department</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Mathematics, English, etc."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  placeholder="B.Ed, M.A, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="5 years"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Teacher Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select teacher role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="audit_teacher">Audit Teacher</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Teachers have full access, Audit Teachers have read-only access
              </p>
            </div>

            <div>
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Temporary password for teacher"
                required
                minLength={6}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Teacher can change this password after first login
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Teacher Access</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Teacher:</strong> Can access dashboard, manage results, view applications</li>
                <li>• <strong>Audit Teacher:</strong> Read-only access to dashboard and data</li>
                <li>• Both roles cannot modify school content or settings</li>
                <li>• Only school owners can manage teachers and school settings</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Creating Teacher...' : 'Create Teacher Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Manage Teachers ({teachers.length})
        </CardTitle>
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
            <p className="text-gray-600">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No teachers added yet</p>
            <p className="text-sm">Use "Add Teacher" to create teacher accounts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{teacher.full_name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {teacher.role === 'audit_teacher' ? 'Audit Teacher' : 'Teacher'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{teacher.email}</span>
                        </div>
                        {teacher.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{teacher.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Joined: {new Date(teacher.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTeacher(teacher.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTeacher(teacher.id)}
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