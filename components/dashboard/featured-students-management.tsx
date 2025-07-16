'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye,
  EyeOff,
  Award,
  User,
  Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface FeaturedStudent {
  id: string
  name: string
  class: string
  section?: string
  achievement: string
  photo: string
  description: string
  status: 'active' | 'disabled'
  display_order: number
  created_at: string
  updated_at: string
}

interface FeaturedStudentsManagementProps {
  schoolId: string
}

export function FeaturedStudentsManagement({ schoolId }: FeaturedStudentsManagementProps) {
  const [students, setStudents] = useState<FeaturedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<FeaturedStudent | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    section: '',
    achievement: '',
    photo: '',
    description: '',
    status: 'active' as 'active' | 'disabled',
    display_order: 1
  })

  const classOptions = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ]

  const achievementOptions = [
    'Top Student',
    'Best Performance',
    'Academic Excellence',
    'Sports Champion',
    'Cultural Award',
    'Leadership Award',
    'Science Fair Winner',
    'Math Olympiad',
    'Debate Champion',
    'Art Competition Winner',
    'Perfect Attendance',
    'Community Service',
    'Other'
  ]

  useEffect(() => {
    fetchFeaturedStudents()
  }, [schoolId])

  const fetchFeaturedStudents = async () => {
    try {
      // Get current featured students from school_content
      const { data: contentData, error: contentError } = await supabase
        .from('school_content')
        .select('content')
        .eq('school_id', schoolId)
        .eq('section', 'students')
        .single()

      if (contentError && contentError.code !== 'PGRST116') {
        throw contentError
      }

      const featuredStudents = contentData?.content?.featured || []
      
      // Transform the data to include required fields
      const transformedStudents = featuredStudents.map((student: any, index: number) => ({
        id: student.id || `temp-${index}`,
        name: student.name || '',
        class: student.class || '',
        section: student.section || '',
        achievement: student.achievement || '',
        photo: student.photo || '',
        description: student.description || '',
        status: student.status || 'active',
        display_order: student.display_order || index + 1,
        created_at: student.created_at || new Date().toISOString(),
        updated_at: student.updated_at || new Date().toISOString()
      }))

      setStudents(transformedStudents)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch featured students')
    } finally {
      setLoading(false)
    }
  }

  const saveToDatabase = async (updatedStudents: FeaturedStudent[]) => {
    const { error } = await supabase
      .from('school_content')
      .upsert({
        school_id: schoolId,
        section: 'students',
        content: { featured: updatedStudents },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'school_id,section'
      })

    if (error) throw error
  }

  const resetForm = () => {
    setFormData({
      name: '',
      class: '',
      section: '',
      achievement: '',
      photo: '',
      description: '',
      status: 'active',
      display_order: students.length + 1
    })
    setEditingStudent(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let updatedStudents: FeaturedStudent[]

      if (editingStudent) {
        // Update existing student
        updatedStudents = students.map(student =>
          student.id === editingStudent.id
            ? {
                ...student,
                ...formData,
                updated_at: new Date().toISOString()
              }
            : student
        )
      } else {
        // Add new student
        const newStudent: FeaturedStudent = {
          id: `student-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        updatedStudents = [...students, newStudent]
      }

      await saveToDatabase(updatedStudents)
      setStudents(updatedStudents)

      toast({
        title: editingStudent ? "Student Updated" : "Student Added",
        description: `${formData.name} has been successfully ${editingStudent ? 'updated' : 'added'}.`,
      })

      resetForm()
    } catch (err: any) {
      setError(err.message || `Failed to ${editingStudent ? 'update' : 'create'} featured student`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student: FeaturedStudent) => {
    setFormData({
      name: student.name,
      class: student.class,
      section: student.section || '',
      achievement: student.achievement,
      photo: student.photo,
      description: student.description,
      status: student.status,
      display_order: student.display_order
    })
    setEditingStudent(student)
    setShowForm(true)
  }

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this featured student?')) return

    try {
      const updatedStudents = students.filter(s => s.id !== studentId)
      await saveToDatabase(updatedStudents)
      setStudents(updatedStudents)

      toast({
        title: "Student Deleted",
        description: "Featured student has been successfully deleted.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to delete featured student')
    }
  }

  const handleToggleStatus = async (studentId: string) => {
    try {
      const updatedStudents = students.map(student =>
        student.id === studentId
          ? {
              ...student,
              status: student.status === 'active' ? 'disabled' as const : 'active' as const,
              updated_at: new Date().toISOString()
            }
          : student
      )

      await saveToDatabase(updatedStudents)
      setStudents(updatedStudents)

      const student = students.find(s => s.id === studentId)
      const newStatus = student?.status === 'active' ? 'disabled' : 'active'

      toast({
        title: "Status Updated",
        description: `Student has been ${newStatus === 'active' ? 'enabled' : 'disabled'}.`,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update student status')
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.achievement.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.display_order - b.display_order)

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Featured Students ({filteredStudents.length})
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
              <Button onClick={() => setShowForm(true)} disabled={showForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {editingStudent ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              {editingStudent ? 'Edit Featured Student' : 'Add Featured Student'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Student Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="class">Class *</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="A, B, C..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="achievement">Achievement *</Label>
                  <Select
                    value={formData.achievement}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, achievement: value }))}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select achievement" />
                    </SelectTrigger>
                    <SelectContent>
                      {achievementOptions.map(achievement => (
                        <SelectItem key={achievement} value={achievement}>{achievement}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      status: checked ? 'active' : 'disabled' 
                    }))}
                  />
                  <Label htmlFor="status">Active Status</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="photo">Photo URL *</Label>
                <Input
                  id="photo"
                  type="url"
                  value={formData.photo}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                  placeholder="https://images.pexels.com/..."
                  required
                  className="mt-1"
                />
                {formData.photo && (
                  <div className="mt-3">
                    <img
                      src={formData.photo}
                      alt="Student preview"
                      className="w-20 h-20 rounded-full object-cover border"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description about the student's achievements..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Students List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !showForm ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading featured students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No featured students found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search' : 'Add your first featured student to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className={getStatusColor(student.status)}>
                        {student.status === 'active' ? (
                          <Eye className="h-3 w-3 mr-1" />
                        ) : (
                          <EyeOff className="h-3 w-3 mr-1" />
                        )}
                        {student.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
                          }}
                        />
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {student.name}
                      </h3>
                      
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Badge variant="outline">
                          {student.class}{student.section && ` - ${student.section}`}
                        </Badge>
                        <span className="text-xs text-gray-500">#{student.display_order}</span>
                      </div>

                      <Badge variant="secondary" className="mb-3">
                        <Award className="h-3 w-3 mr-1" />
                        {student.achievement}
                      </Badge>

                      {student.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {student.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}