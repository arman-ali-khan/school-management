'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Save, 
  Globe, 
  Palette, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  Bell,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface School {
  id: string
  name: string
  slug: string
  settings: any
}

interface SettingsManagementProps {
  schoolId: string
  school: School
  onSchoolUpdate: (school: School) => void
  userRole?: string
}

export function SettingsManagement({ schoolId, school, onSchoolUpdate, userRole }: SettingsManagementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: school.name || '',
    slug: school.slug || '',
    description: school.settings?.description || '',
    theme: school.settings?.theme || 'green',
    contact: {
      email: school.settings?.contact?.email || '',
      phone: school.settings?.contact?.phone || '',
      address: school.settings?.contact?.address || '',
      website: school.settings?.contact?.website || ''
    },
    features: {
      enableApplications: school.settings?.features?.enableApplications ?? true,
      enableResults: school.settings?.features?.enableResults ?? true,
      enableGallery: school.settings?.features?.enableGallery ?? true,
      enableNotices: school.settings?.features?.enableNotices ?? true,
      enableFeaturedStudents: school.settings?.features?.enableFeaturedStudents ?? true,
      publicResults: school.settings?.features?.publicResults ?? false,
      requireApproval: school.settings?.features?.requireApproval ?? true
    },
    notifications: {
      emailNotifications: school.settings?.notifications?.emailNotifications ?? true,
      applicationAlerts: school.settings?.notifications?.applicationAlerts ?? true,
      resultAlerts: school.settings?.notifications?.resultAlerts ?? false
    },
    appearance: {
      primaryColor: school.settings?.appearance?.primaryColor || '#16a34a',
      secondaryColor: school.settings?.appearance?.secondaryColor || '#dc2626',
      logoUrl: school.settings?.appearance?.logoUrl || '',
      faviconUrl: school.settings?.appearance?.faviconUrl || ''
    }
  })

  const handleSave = async () => {
    if (userRole === 'audit_teacher') {
      setError('Audit teachers do not have permission to modify settings')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedSettings = {
        ...formData.contact && { contact: formData.contact },
        ...formData.features && { features: formData.features },
        ...formData.notifications && { notifications: formData.notifications },
        ...formData.appearance && { appearance: formData.appearance },
        theme: formData.theme,
        description: formData.description
      }

      const { data, error: updateError } = await supabase
        .from('schools')
        .update({
          name: formData.name,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId)
        .select()
        .single()

      if (updateError) throw updateError

      onSchoolUpdate({ ...school, name: formData.name, settings: updatedSettings })
      setSuccess('Settings saved successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const themeOptions = [
    { value: 'green', label: 'Green (Default)', color: '#16a34a' },
    { value: 'blue', label: 'Blue', color: '#2563eb' },
    { value: 'red', label: 'Red', color: '#dc2626' },
    { value: 'purple', label: 'Purple', color: '#9333ea' },
    { value: 'orange', label: 'Orange', color: '#ea580c' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            School Settings
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">School Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="School name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug">Website URL</Label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  schoolsaas.app/
                </span>
                <Input
                  id="slug"
                  value={formData.slug}
                  disabled
                  className="rounded-l-none bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL cannot be changed after creation
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">School Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your school..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, email: e.target.value }
                }))}
                placeholder="school@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contact: { ...prev.contact, phone: e.target.value }
                }))}
                placeholder="+880-XXX-XXXXXX"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">School Address</Label>
            <Textarea
              id="address"
              value={formData.contact.address}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, address: e.target.value }
              }))}
              placeholder="Complete school address..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              type="url"
              value={formData.contact.website}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, website: e.target.value }
              }))}
              placeholder="https://www.yourschool.com"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Appearance & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Theme Color</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme: theme.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.theme === theme.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-xs font-medium">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.appearance.logoUrl}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, logoUrl: e.target.value }
                }))}
                placeholder="https://images.pexels.com/..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                type="url"
                value={formData.appearance.faviconUrl}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, faviconUrl: e.target.value }
                }))}
                placeholder="https://images.pexels.com/..."
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Feature Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Student Applications</Label>
                <p className="text-sm text-gray-500">Allow students to submit applications</p>
              </div>
              <Switch
                checked={formData.features.enableApplications}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, enableApplications: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Result System</Label>
                <p className="text-sm text-gray-500">Enable result management and display</p>
              </div>
              <Switch
                checked={formData.features.enableResults}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, enableResults: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Photo Gallery</Label>
                <p className="text-sm text-gray-500">Show photo gallery on homepage</p>
              </div>
              <Switch
                checked={formData.features.enableGallery}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, enableGallery: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notice Board</Label>
                <p className="text-sm text-gray-500">Display notices on homepage</p>
              </div>
              <Switch
                checked={formData.features.enableNotices}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, enableNotices: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Featured Students</Label>
                <p className="text-sm text-gray-500">Show featured students section</p>
              </div>
              <Switch
                checked={formData.features.enableFeaturedStudents}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, enableFeaturedStudents: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Public Results</Label>
                <p className="text-sm text-gray-500">Allow public result checking</p>
              </div>
              <Switch
                checked={formData.features.publicResults}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, publicResults: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Application Approval</Label>
                <p className="text-sm text-gray-500">Require admin approval for applications</p>
              </div>
              <Switch
                checked={formData.features.requireApproval}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  features: { ...prev.features, requireApproval: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive email notifications</p>
            </div>
            <Switch
              checked={formData.notifications.emailNotifications}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailNotifications: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Application Alerts</Label>
              <p className="text-sm text-gray-500">Get notified of new applications</p>
            </div>
            <Switch
              checked={formData.notifications.applicationAlerts}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                notifications: { ...prev.notifications, applicationAlerts: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Result Alerts</Label>
              <p className="text-sm text-gray-500">Get notified when results are published</p>
            </div>
            <Switch
              checked={formData.notifications.resultAlerts}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                notifications: { ...prev.notifications, resultAlerts: checked }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" asChild>
          <a href={`/${school.slug}`} target="_blank" rel="noopener noreferrer">
            <Eye className="h-4 w-4 mr-2" />
            Preview Site
          </a>
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || userRole === 'audit_teacher'}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
        {userRole === 'audit_teacher' && (
          <p className="text-sm text-gray-500 mt-2">
            Audit teachers have read-only access to settings
          </p>
        )}
      </div>
    </div>
  )
}