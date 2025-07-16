'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { 
  Images, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye,
  EyeOff,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface CarouselSlide {
  id: string
  title: string
  description: string
  image_url: string
  button_text?: string
  button_link?: string
  status: 'active' | 'disabled'
  display_order: number
  created_at: string
  updated_at: string
}

interface CarouselManagementProps {
  schoolId: string
}

export function CarouselManagement({ schoolId }: CarouselManagementProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    status: 'active' as 'active' | 'disabled',
    display_order: 1
  })

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes

  useEffect(() => {
    fetchCarouselSlides()
  }, [schoolId])

  const fetchCarouselSlides = async () => {
    try {
      // Get current carousel slides from school_content
      const { data: contentData, error: contentError } = await supabase
        .from('school_content')
        .select('content')
        .eq('school_id', schoolId)
        .eq('section', 'hero')
        .single()

      if (contentError && contentError.code !== 'PGRST116') {
        throw contentError
      }

      const carouselSlides = contentData?.content?.images || []
      
      // Transform the data to include required fields
      const transformedSlides = carouselSlides.map((slide: any, index: number) => ({
        id: slide.id || `temp-${index}`,
        title: slide.title || '',
        description: slide.description || '',
        image_url: slide.url || '',
        button_text: slide.button_text || '',
        button_link: slide.button_link || '',
        status: slide.status || 'active',
        display_order: slide.display_order || index + 1,
        created_at: slide.created_at || new Date().toISOString(),
        updated_at: slide.updated_at || new Date().toISOString()
      }))

      setSlides(transformedSlides)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch carousel slides')
    } finally {
      setLoading(false)
    }
  }

  const saveToDatabase = async (updatedSlides: CarouselSlide[]) => {
    // Transform back to the expected format
    const transformedSlides = updatedSlides.map(slide => ({
      id: slide.id,
      url: slide.image_url,
      title: slide.title,
      description: slide.description,
      button_text: slide.button_text,
      button_link: slide.button_link,
      status: slide.status,
      display_order: slide.display_order,
      created_at: slide.created_at,
      updated_at: slide.updated_at
    }))

    const { error } = await supabase
      .from('school_content')
      .upsert({
        school_id: schoolId,
        section: 'hero',
        content: { images: transformedSlides },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'school_id,section'
      })

    if (error) throw error
  }

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
      formData.append('folder', `school-${schoolId}/carousel`)

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
      setFormData(prev => ({ ...prev, image_url: imageUrl }))
      
      toast({
        title: "Image Uploaded",
        description: "Image has been successfully uploaded to Cloudinary.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      button_text: '',
      button_link: '',
      status: 'active',
      display_order: slides.length + 1
    })
    setEditingSlide(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.image_url) {
        throw new Error('Please upload an image or provide an image URL')
      }

      let updatedSlides: CarouselSlide[]

      if (editingSlide) {
        // Update existing slide
        updatedSlides = slides.map(slide =>
          slide.id === editingSlide.id
            ? {
                ...slide,
                ...formData,
                updated_at: new Date().toISOString()
              }
            : slide
        )
      } else {
        // Add new slide
        const newSlide: CarouselSlide = {
          id: `slide-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        updatedSlides = [...slides, newSlide]
      }

      await saveToDatabase(updatedSlides)
      setSlides(updatedSlides)

      toast({
        title: editingSlide ? "Slide Updated" : "Slide Added",
        description: `Carousel slide has been successfully ${editingSlide ? 'updated' : 'added'}.`,
      })

      resetForm()
    } catch (err: any) {
      setError(err.message || `Failed to ${editingSlide ? 'update' : 'create'} carousel slide`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (slide: CarouselSlide) => {
    setFormData({
      title: slide.title,
      description: slide.description,
      image_url: slide.image_url,
      button_text: slide.button_text || '',
      button_link: slide.button_link || '',
      status: slide.status,
      display_order: slide.display_order
    })
    setEditingSlide(slide)
    setShowForm(true)
  }

  const handleDelete = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this carousel slide?')) return

    try {
      const updatedSlides = slides.filter(s => s.id !== slideId)
      await saveToDatabase(updatedSlides)
      setSlides(updatedSlides)

      toast({
        title: "Slide Deleted",
        description: "Carousel slide has been successfully deleted.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to delete carousel slide')
    }
  }

  const handleToggleStatus = async (slideId: string) => {
    try {
      const updatedSlides = slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              status: slide.status === 'active' ? 'disabled' as const : 'active' as const,
              updated_at: new Date().toISOString()
            }
          : slide
      )

      await saveToDatabase(updatedSlides)
      setSlides(updatedSlides)

      const slide = slides.find(s => s.id === slideId)
      const newStatus = slide?.status === 'active' ? 'disabled' : 'active'

      toast({
        title: "Status Updated",
        description: `Slide has been ${newStatus === 'active' ? 'enabled' : 'disabled'}.`,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update slide status')
    }
  }

  const handleMoveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === slideId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= slides.length) return

    try {
      const updatedSlides = [...slides]
      const [movedSlide] = updatedSlides.splice(currentIndex, 1)
      updatedSlides.splice(newIndex, 0, movedSlide)

      // Update display orders
      const reorderedSlides = updatedSlides.map((slide, index) => ({
        ...slide,
        display_order: index + 1,
        updated_at: new Date().toISOString()
      }))

      await saveToDatabase(reorderedSlides)
      setSlides(reorderedSlides)

      toast({
        title: "Order Updated",
        description: "Slide order has been updated.",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to reorder slides')
    }
  }

  const sortedSlides = slides.sort((a, b) => a.display_order - b.display_order)

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
              <Images className="h-5 w-5 mr-2" />
              Homepage Carousel ({sortedSlides.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {editingSlide ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              {editingSlide ? 'Edit Carousel Slide' : 'Add Carousel Slide'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Slide Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter slide title"
                    required
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter slide description"
                  rows={3}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="image">Slide Image *</Label>
                <div className="mt-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload image (max 2MB) or enter URL below
                      </p>
                    </div>
                    {uploading && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="image_url">Or Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://images.pexels.com/... or upload above"
                      className="mt-1"
                    />
                  </div>

                  {formData.image_url && (
                    <div className="mt-3">
                      <img
                        src={formData.image_url}
                        alt="Slide preview"
                        className="w-full max-w-md h-48 rounded-lg object-cover border"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button_text">Button Text (Optional)</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                    placeholder="Learn More, Apply Now, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="button_link">Button Link (Optional)</Label>
                  <Input
                    id="button_link"
                    type="url"
                    value={formData.button_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                    placeholder="https://example.com or /application"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Carousel Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use high-quality images with 16:9 aspect ratio for best results</li>
                  <li>• Keep titles concise and impactful</li>
                  <li>• Descriptions should be brief but informative</li>
                  <li>• Images are automatically optimized and cached by Cloudinary</li>
                  <li>• Maximum file size: 2MB per image</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : editingSlide ? 'Update Slide' : 'Add Slide'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Slides List */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel Slides</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !showForm ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading carousel slides...</p>
            </div>
          ) : sortedSlides.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Images className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No carousel slides found</p>
              <p className="text-sm">Add your first slide to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSlides.map((slide, index) => (
                <Card key={slide.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg'
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {slide.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {slide.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className={getStatusColor(slide.status)}>
                              {slide.status === 'active' ? (
                                <Eye className="h-3 w-3 mr-1" />
                              ) : (
                                <EyeOff className="h-3 w-3 mr-1" />
                              )}
                              {slide.status}
                            </Badge>
                            <Badge variant="outline">#{slide.display_order}</Badge>
                          </div>
                        </div>

                        {(slide.button_text || slide.button_link) && (
                          <div className="text-sm text-gray-500 mb-3">
                            Button: {slide.button_text || 'No text'} → {slide.button_link || 'No link'}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Created: {new Date(slide.created_at).toLocaleDateString()}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveSlide(slide.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveSlide(slide.id, 'down')}
                              disabled={index === sortedSlides.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(slide.id)}
                            >
                              {slide.status === 'active' ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(slide)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(slide.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
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