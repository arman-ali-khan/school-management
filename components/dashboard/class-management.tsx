'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  User,
  Save,
  X,
  Search,
  GraduationCap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Class {
  id: string
  name: string
  section: string
  academic_year: string
  class_teacher_id?: string
  class_teacher?: {
    full_name: string
    email: string
  }
  capacity: number
  current_students: number
  room_number?: string
  schedule: any
  status: string
  created_at: string
}

interface Teacher {
  id: string
  full_name: string
  email: string
  subject?: string
}

interface ClassEditFormData {
  name: string
  section: string
  academic_year: string
  class_teacher_id: string
  capacity: string
  room_number: string
  status: string
}

interface ClassManagementProps {
  schoolId: string
  section: 'classes' | 'create-class'
}

export function ClassManagement({ schoolId, section }: ClassManagementProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [editingClass, setEditingClass] = useState<string | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    academic_year: new Date().getFullYear().toString(),
    class_teacher_id: 'unassigned',
    capacity: '50',
    room_number: '',
    status: 'active'
  })

  const [editFormData, setEditFormData] = useState<ClassEditFormData | null>(null)

  const classNames = [
    'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ]

  const sections = ['A', 'B', 'C', 'D', 'E', 'F']

  useEffect(() => {
    if (section === 'classes') {
      fetchClasses()
    }
    fetchTeachers()
  }, [schoolId, section])

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_teacher:users(full_name, email)
        `)
        .eq('school_id', schoolId)
        .order('academic_year', { ascending: false })
        .order('name')
        .order('section')

      if (error) throw error
      setClasses(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, subject')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .order('full_name')

      if (error) throw error
      setTeachers(data || [])
    } catch (err: any) {
      console.error('Failed to fetch teachers:', err)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if class already exists
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', formData.name)
        .eq('section', formData.section)
        .eq('academic_year', formData.academic_year)

      if (existingClass && existingClass.length > 0) {
        throw new Error('Class with this name and section already exists for this academic year')
      }

      const { error } = await supabase
        .from('classes')
        .insert({
          school_id: schoolId,
          name: formData.name,
          section: formData.section,
          academic_year: formData.academic_year,
          class_teacher_id: formData.class_teacher_id === 'unassigned' ? null : formData.class_teacher_id,
          capacity: parseInt(formData.capacity),
          room_number: formData.room_number,
          status: formData.status
        })

      if (error) throw error

      // Reset form
      setFormData({
        name: '',
        section: '',
        academic_year: new Date().getFullYear().toString(),
        class_teacher_id: 'unassigned',
        capacity: '50',
        room_number: '',
        status: 'active'
      })

      toast({
        title: "Class Created",
        description: `${formData.name}${formData.section ? ` - ${formData.section}` : ''} has been successfully created.`,
      })

      // Refresh classes list if on classes page
      if (section === 'classes') {
        fetchClasses()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem.id)
    setEditFormData({
      name: classItem.name,
      section: classItem.section,
      academic_year: classItem.academic_year,
      class_teacher_id: classItem.class_teacher_id || 'unassigned',
      capacity: classItem.capacity.toString(),
      room_number: classItem.room_number || '',
      status: classItem.status
    })
  }

  const handleSaveEdit = async (classId: string) => {
    if (!editFormData) {
      setError('No form data available')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: editFormData.name,
          section: editFormData.section,
          academic_year: editFormData.academic_year,
          class_teacher_id: editFormData.class_teacher_id === 'unassigned' ? null : editFormData.class_teacher_id,
          capacity: parseInt(editFormData.capacity),
          room_number: editFormData.room_number,
          status: editFormData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', classId)

      if (error) throw error

      setEditingClass(null)
      setEditFormData(null)
      fetchClasses()

      toast({
        title: "Class Updated",
        description: "Class information has been successfully updated.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update class')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete ${className}? This action cannot be undone.`)) return

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error

      setClasses(prev => prev.filter(c => c.id !== classId))
      
      toast({
        title: "Class Deleted",
        description: `${className} has been successfully deleted.`,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to delete class')
    }
  }

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = !filterYear || classItem.academic_year === filterYear
    return matchesSearch && matchesYear
  })

  const uniqueYears = [...new Set(classes.map(c => c.academic_year))].sort().reverse()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (section === 'create-class') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create New Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateClass} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Class Name *</Label>
                <Select
                  value={formData.name}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classNames.map(className => (
                      <SelectItem key={className} value={className}>{className}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                  placeholder="2024"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="class_teacher_id">Class Teacher</Label>
                <Select
                  value={formData.class_teacher_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, class_teacher_id: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No Teacher</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name} {teacher.subject && `(${teacher.subject})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="capacity">Student Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="50"
                  min="1"
                  max="100"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                  placeholder="Room 101"
                  className="mt-1"
                />
              </div>
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
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Class Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Classes help organize students by grade level and section</li>
                <li>• Assign a class teacher to manage the class</li>
                <li>• Set student capacity to control class size</li>
                <li>• Room numbers help with scheduling and organization</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Creating Class...' : 'Create Class'}
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
            <BookOpen className="h-5 w-5 mr-2" />
            Manage Classes ({filteredClasses.length})
          </CardTitle>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
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
            <p className="text-gray-600">Loading classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No classes found</p>
            <p className="text-sm">
              {searchTerm || filterYear ? 'Try adjusting your filters' : 'Use "Create Class" to add classes'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {editingClass === classItem.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Class Name</Label>
                          <Select
                            value={editFormData?.name}
                            onValueChange={(value) => setEditFormData(prev => prev ? ({ ...prev, name: value }) : null)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {classNames.map(className => (
                                <SelectItem key={className} value={className}>{className}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Section</Label>
                          <Select
                            value={editFormData?.section || "none"}
                            onValueChange={(value) => setEditFormData(prev => prev ? ({ ...prev, section: value === "none" ? "" : value }) : null)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Section</SelectItem>
                              {sections.map(section => (
                                <SelectItem key={section} value={section}>{section}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Class Teacher</Label>
                          <Select
                            value={editFormData?.class_teacher_id}
                            onValueChange={(value) => setEditFormData(prev => prev ? ({ ...prev, class_teacher_id: value }) : null)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">No Teacher</SelectItem>
                              {teachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            value={editFormData?.capacity}
                            onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, capacity: e.target.value }) : null)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Room Number</Label>
                          <Input
                            value={editFormData?.room_number}
                            onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, room_number: e.target.value }) : null)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select
                            value={editFormData?.status}
                            onValueChange={(value) => setEditFormData(prev => prev ? ({ ...prev, status: value }) : null)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingClass(null)
                            setEditFormData(null)
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveEdit(classItem.id)}
                          disabled={loading}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display View
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {classItem.name}{classItem.section && ` - ${classItem.section}`}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">Year: {classItem.academic_year}</Badge>
                              <Badge className={getStatusColor(classItem.status)}>
                                {classItem.status}
                              </Badge>
                              {classItem.room_number && (
                                <Badge variant="secondary">Room: {classItem.room_number}</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          {classItem.class_teacher && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>Teacher: {classItem.class_teacher.full_name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Students: {classItem.current_students}/{classItem.capacity}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(classItem.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClass(classItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClass(classItem.id, `${classItem.name}${classItem.section ? ` - ${classItem.section}` : ''}`)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}