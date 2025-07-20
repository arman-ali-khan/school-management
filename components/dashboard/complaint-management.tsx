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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  MessageSquare, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  FileText,
  Search,
  Filter,
  Download,
  Mail,
  Phone
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Complaint {
  id: string
  school_id: string
  complainant_name: string
  complainant_email?: string
  complainant_phone?: string
  complainant_relation: string
  complaint_type: string
  against_type: string
  target_name?: string
  target_class?: string
  target_department?: string
  subject: string
  description: string
  incident_date?: string
  incident_location?: string
  evidence_urls?: string[]
  witnesses?: string
  status: string
  priority: string
  admin_response?: string
  admin_notes?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

interface ComplaintManagementProps {
  schoolId: string
  userRole?: string
}

export function ComplaintManagement({ schoolId, userRole }: ComplaintManagementProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchComplaints()
  }, [schoolId])

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComplaints(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaints')
    } finally {
      setLoading(false)
    }
  }

  const updateComplaintStatus = async (complaintId: string, status: string, response?: string, notes?: string) => {
    if (userRole === 'audit_teacher') {
      setError('Audit teachers do not have permission to update complaints')
      return
    }

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (response) {
        updateData.admin_response = response
      }

      if (notes) {
        updateData.admin_notes = notes
      }

      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolved_at = new Date().toISOString()
        // In a real app, you'd get the current user ID
        // updateData.resolved_by = currentUserId
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId)

      if (error) throw error

      setComplaints(prev => prev.map(complaint =>
        complaint.id === complaintId ? { ...complaint, ...updateData } : complaint
      ))

      toast({
        title: "Complaint Updated",
        description: `Complaint status changed to ${status}`,
      })

      setShowDetails(false)
      setResponseText('')
      setAdminNotes('')
    } catch (err: any) {
      setError(err.message || 'Failed to update complaint')
    }
  }

  const updateComplaintPriority = async (complaintId: string, priority: string) => {
    if (userRole === 'audit_teacher') {
      setError('Audit teachers do not have permission to update complaints')
      return
    }

    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)

      if (error) throw error

      setComplaints(prev => prev.map(complaint =>
        complaint.id === complaintId ? { ...complaint, priority } : complaint
      ))

      toast({
        title: "Priority Updated",
        description: `Complaint priority changed to ${priority}`,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update priority')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Date', 'Complainant', 'Relation', 'Type', 'Against', 'Subject', 
      'Status', 'Priority', 'Target', 'Incident Date'
    ]
    const csvData = [headers]

    filteredComplaints.forEach(complaint => {
      const rowData = [
        new Date(complaint.created_at).toLocaleDateString(),
        complaint.complainant_name,
        complaint.complainant_relation,
        complaint.complaint_type,
        complaint.against_type,
        complaint.subject,
        complaint.status,
        complaint.priority,
        complaint.target_name || 'N/A',
        complaint.incident_date || 'N/A'
      ]
      csvData.push(rowData)
    })

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `complaints_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'dismissed': return <XCircle className="h-4 w-4" />
      case 'under_review': return <Eye className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || complaint.status === filterStatus
    const matchesType = !filterType || complaint.complaint_type === filterType
    const matchesPriority = !filterPriority || complaint.priority === filterPriority
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const complaintStats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    underReview: complaints.filter(c => c.status === 'under_review').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    urgent: complaints.filter(c => c.priority === 'urgent').length
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading complaints...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Complaint Management
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaintStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{complaintStats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{complaintStats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complaintStats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complaintStats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filters:</Label>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className="ml-auto">
              {filteredComplaints.length} Complaints
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle>Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No complaints found</p>
              <p className="text-sm">
                {searchTerm || filterStatus || filterType || filterPriority 
                  ? 'Try adjusting your filters' 
                  : 'No complaints have been submitted yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{complaint.subject}</h3>
                          <Badge className={getStatusColor(complaint.status)}>
                            {getStatusIcon(complaint.status)}
                            <span className="ml-1 capitalize">{complaint.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{complaint.complainant_name} ({complaint.complainant_relation})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>{complaint.complaint_type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-gray-700 line-clamp-2">{complaint.description}</p>

                        {complaint.target_name && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Against:</strong> {complaint.target_name} 
                            {complaint.target_class && ` (${complaint.target_class})`}
                            {complaint.target_department && ` - ${complaint.target_department}`}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Dialog open={showDetails && selectedComplaint?.id === complaint.id} onOpenChange={setShowDetails}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setResponseText(complaint.admin_response || '')
                                setAdminNotes(complaint.admin_notes || '')
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Complaint Details</DialogTitle>
                            </DialogHeader>
                            {selectedComplaint && (
                              <div className="space-y-6">
                                {/* Complainant Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Complainant</Label>
                                    <p className="text-gray-900">{selectedComplaint.complainant_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Relation</Label>
                                    <p className="text-gray-900">{selectedComplaint.complainant_relation}</p>
                                  </div>
                                  {selectedComplaint.complainant_email && (
                                    <div>
                                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                                      <p className="text-gray-900">{selectedComplaint.complainant_email}</p>
                                    </div>
                                  )}
                                  {selectedComplaint.complainant_phone && (
                                    <div>
                                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                      <p className="text-gray-900">{selectedComplaint.complainant_phone}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Complaint Details */}
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Subject</Label>
                                  <p className="text-gray-900 font-semibold">{selectedComplaint.subject}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                                  <p className="text-gray-900 whitespace-pre-wrap">{selectedComplaint.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Complaint Type</Label>
                                    <p className="text-gray-900">{selectedComplaint.complaint_type}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Against</Label>
                                    <p className="text-gray-900">{selectedComplaint.against_type}</p>
                                  </div>
                                </div>

                                {/* Target Info */}
                                {(selectedComplaint.target_name || selectedComplaint.target_class || selectedComplaint.target_department) && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedComplaint.target_name && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Target Name</Label>
                                        <p className="text-gray-900">{selectedComplaint.target_name}</p>
                                      </div>
                                    )}
                                    {selectedComplaint.target_class && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Class</Label>
                                        <p className="text-gray-900">{selectedComplaint.target_class}</p>
                                      </div>
                                    )}
                                    {selectedComplaint.target_department && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Department</Label>
                                        <p className="text-gray-900">{selectedComplaint.target_department}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Incident Details */}
                                {(selectedComplaint.incident_date || selectedComplaint.incident_location) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedComplaint.incident_date && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Incident Date</Label>
                                        <p className="text-gray-900">{new Date(selectedComplaint.incident_date).toLocaleDateString()}</p>
                                      </div>
                                    )}
                                    {selectedComplaint.incident_location && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-500">Location</Label>
                                        <p className="text-gray-900">{selectedComplaint.incident_location}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Witnesses */}
                                {selectedComplaint.witnesses && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Witnesses</Label>
                                    <p className="text-gray-900">{selectedComplaint.witnesses}</p>
                                  </div>
                                )}

                                {/* Evidence */}
                                {selectedComplaint.evidence_urls && selectedComplaint.evidence_urls.length > 0 && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Evidence</Label>
                                    <div className="space-y-1">
                                      {selectedComplaint.evidence_urls.map((url, index) => (
                                        <a
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                          Evidence {index + 1}: {url}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Status and Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                                    <div className="mt-1">
                                      <Badge className={getStatusColor(selectedComplaint.status)}>
                                        {selectedComplaint.status.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Priority</Label>
                                    <div className="mt-1">
                                      <Select
                                        value={selectedComplaint.priority}
                                        onValueChange={(value) => updateComplaintPriority(selectedComplaint.id, value)}
                                        disabled={userRole === 'audit_teacher'}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Low</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Submitted</Label>
                                    <p className="text-gray-900">{new Date(selectedComplaint.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                {/* Admin Response */}
                                {userRole !== 'audit_teacher' && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="admin_response">Admin Response</Label>
                                      <Textarea
                                        id="admin_response"
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Response to complainant..."
                                        rows={4}
                                        className="mt-1"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="admin_notes">Internal Notes</Label>
                                      <Textarea
                                        id="admin_notes"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Internal notes for staff..."
                                        rows={3}
                                        className="mt-1"
                                      />
                                    </div>

                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={() => updateComplaintStatus(selectedComplaint.id, 'under_review', responseText, adminNotes)}
                                        variant="outline"
                                      >
                                        Mark Under Review
                                      </Button>
                                      <Button
                                        onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved', responseText, adminNotes)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Mark Resolved
                                      </Button>
                                      <Button
                                        onClick={() => updateComplaintStatus(selectedComplaint.id, 'dismissed', responseText, adminNotes)}
                                        variant="destructive"
                                      >
                                        Dismiss
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Existing Response */}
                                {selectedComplaint.admin_response && (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <Label className="text-sm font-medium text-gray-500">Previous Response</Label>
                                    <p className="text-gray-900 mt-1">{selectedComplaint.admin_response}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {complaint.status === 'pending' && userRole !== 'audit_teacher' && (
                          <Button
                            size="sm"
                            onClick={() => updateComplaintStatus(complaint.id, 'under_review')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Complaint Management Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {userRole === 'audit_teacher' ? (
                <>
                  <li>• You have read-only access to view complaints</li>
                  <li>• Contact school administrators to take action on complaints</li>
                  <li>• You can export complaint data for reporting purposes</li>
                </>
              ) : (
                <>
                  <li>• Review complaints promptly and update their status</li>
                  <li>• Use priority levels to organize urgent matters</li>
                  <li>• Provide clear responses to complainants when resolving issues</li>
                  <li>• Keep internal notes for documentation and follow-up</li>
                  <li>• Anonymous complaints require careful handling due to limited contact options</li>
                  <li>• Export data regularly for record-keeping and analysis</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}