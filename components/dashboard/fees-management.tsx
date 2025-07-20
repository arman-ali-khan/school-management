'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  DollarSign, 
  Plus, 
  Save, 
  Download, 
  Upload,
  Calculator,
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Student {
  id: string
  roll_number: string
  full_name: string
  class: string
  section?: string
}

interface FeeRecord {
  id: string
  student_id: string
  fee_type: string
  amount: number
  month: number
  year: number
  status: 'pending' | 'paid' | 'overdue'
  payment_date?: string
  payment_method?: string
  notes?: string
}

interface FeeRow {
  student: Student
  fees: Record<string, FeeRecord>
  total: number
}

interface FeesManagementProps {
  schoolId: string
  userRole?: string
}

const FEE_TYPES = [
  'Monthly Fee',
  'Exam Fee', 
  'Sports Fee',
  'Development Fee',
  'Practical Fee',
  'Registration Fee',
  'Form Fill-up',
  'Others'
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function FeesManagement({ schoolId, userRole }: FeesManagementProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedClass, setSelectedClass] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const [bulkFeeData, setBulkFeeData] = useState<Record<string, number>>({
    'Monthly Fee': 0,
    'Exam Fee': 0,
    'Sports Fee': 0,
    'Development Fee': 0,
    'Practical Fee': 0,
    'Registration Fee': 0,
    'Form Fill-up': 0,
    'Others': 0
  })

  useEffect(() => {
    fetchStudents()
    fetchFeeRecords()
  }, [schoolId, selectedMonth, selectedYear])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, roll_number, full_name, class, section')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('class')
        .order('roll_number')

      if (error) throw error
      setStudents(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students')
    }
  }

  const fetchFeeRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('school_id', schoolId)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)

      if (error) throw error
      setFeeRecords(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch fee records')
    } finally {
      setLoading(false)
    }
  }

  const updateFeeAmount = async (studentId: string, feeType: string, amount: number) => {
    if (userRole === 'audit_teacher') {
      setError('Audit teachers do not have permission to modify fees')
      return
    }

    try {
      const existingRecord = feeRecords.find(
        r => r.student_id === studentId && r.fee_type === feeType
      )

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('student_fees')
          .update({ 
            amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)

        if (error) throw error

        setFeeRecords(prev => prev.map(record =>
          record.id === existingRecord.id ? { ...record, amount } : record
        ))
      } else if (amount > 0) {
        // Create new record
        const { data, error } = await supabase
          .from('student_fees')
          .insert({
            school_id: schoolId,
            student_id: studentId,
            fee_type: feeType,
            amount,
            month: selectedMonth,
            year: selectedYear,
            status: 'pending'
          })
          .select()
          .single()

        if (error) throw error

        setFeeRecords(prev => [...prev, data])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update fee')
    }
  }

  const updatePaymentStatus = async (recordId: string, status: 'pending' | 'paid' | 'overdue', paymentMethod?: string) => {
    if (userRole === 'audit_teacher') {
      setError('Audit teachers do not have permission to modify payment status')
      return
    }

    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString().split('T')[0]
        updateData.payment_method = paymentMethod || 'Cash'
      } else {
        updateData.payment_date = null
        updateData.payment_method = null
      }

      const { error } = await supabase
        .from('student_fees')
        .update(updateData)
        .eq('id', recordId)

      if (error) throw error

      setFeeRecords(prev => prev.map(record =>
        record.id === recordId ? { ...record, ...updateData } : record
      ))

      toast({
        title: "Payment Status Updated",
        description: `Fee marked as ${status}`,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update payment status')
    }
  }

  const handleBulkUpdate = async () => {
    if (userRole === 'audit_teacher') {
      setError('Audit teachers do not have permission to perform bulk updates')
      return
    }

    if (selectedStudents.size === 0) {
      setError('Please select at least one student')
      return
    }

    setSaving(true)
    setError('')

    try {
      const updates = []
      
      for (const studentId of selectedStudents) {
        for (const [feeType, amount] of Object.entries(bulkFeeData)) {
          if (amount > 0) {
            const existingRecord = feeRecords.find(
              r => r.student_id === studentId && r.fee_type === feeType
            )

            if (existingRecord) {
              updates.push(
                supabase
                  .from('student_fees')
                  .update({ amount })
                  .eq('id', existingRecord.id)
              )
            } else {
              updates.push(
                supabase
                  .from('student_fees')
                  .insert({
                    school_id: schoolId,
                    student_id: studentId,
                    fee_type: feeType,
                    amount,
                    month: selectedMonth,
                    year: selectedYear,
                    status: 'pending'
                  })
              )
            }
          }
        }
      }

      await Promise.all(updates)
      await fetchFeeRecords()

      toast({
        title: "Bulk Update Completed",
        description: `Updated fees for ${selectedStudents.size} students`,
      })

      setShowBulkUpdate(false)
      setSelectedStudents(new Set())
      setBulkFeeData({
        'Monthly Fee': 0,
        'Exam Fee': 0,
        'Sports Fee': 0,
        'Development Fee': 0,
        'Practical Fee': 0,
        'Registration Fee': 0,
        'Form Fill-up': 0,
        'Others': 0
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update fees')
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Roll Number', 'Student Name', 'Class', ...FEE_TYPES, 'Total', 'Status']
    const csvData = [headers]

    filteredFeeRows.forEach(row => {
      const rowData = [
        row.student.roll_number,
        row.student.full_name,
        `${row.student.class}${row.student.section ? ` - ${row.student.section}` : ''}`,
        ...FEE_TYPES.map(feeType => row.fees[feeType]?.amount || 0),
        row.total,
        getOverallStatus(row.fees)
      ]
      csvData.push(rowData)
    })

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fees_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getOverallStatus = (fees: Record<string, FeeRecord>) => {
    const feeValues = Object.values(fees)
    if (feeValues.length === 0) return 'No Fees'
    
    const allPaid = feeValues.every(fee => fee.status === 'paid')
    const anyOverdue = feeValues.some(fee => fee.status === 'overdue')
    
    if (allPaid) return 'Paid'
    if (anyOverdue) return 'Overdue'
    return 'Pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />
      case 'overdue': return <AlertTriangle className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  // Create fee rows for display (Excel-like structure)
  const feeRows: FeeRow[] = students.map(student => {
    const studentFees = feeRecords.filter(record => record.student_id === student.id)
    const fees: Record<string, FeeRecord> = {}
    
    studentFees.forEach(fee => {
      fees[fee.fee_type] = fee
    })

    const total = studentFees.reduce((sum, fee) => sum + fee.amount, 0)

    return { student, fees, total }
  })

  // Filter fee rows
  const filteredFeeRows = feeRows.filter(row => {
    const matchesSearch = row.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === 'all' || !selectedClass || row.student.class === selectedClass
    return matchesSearch && matchesClass
  })

  const uniqueClasses = [...new Set(students.map(s => s.class))].filter(Boolean)

  // Calculate totals for each fee type
  const columnTotals = FEE_TYPES.reduce((totals, feeType) => {
    totals[feeType] = filteredFeeRows.reduce((sum, row) => 
      sum + (row.fees[feeType]?.amount || 0), 0
    )
    return totals
  }, {} as Record<string, number>)

  const grandTotal = Object.values(columnTotals).reduce((sum, amount) => sum + amount, 0)

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading fees data...</p>
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
              <DollarSign className="h-5 w-5 mr-2" />
              Student Fees Management
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {userRole !== 'audit_teacher' && (
              <Dialog open={showBulkUpdate} onOpenChange={setShowBulkUpdate}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Fee Update</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {FEE_TYPES.map(feeType => (
                        <div key={feeType}>
                          <Label>{feeType}</Label>
                          <Input
                            type="number"
                            value={bulkFeeData[feeType]}
                            onChange={(e) => setBulkFeeData(prev => ({
                              ...prev,
                              [feeType]: parseFloat(e.target.value) || 0
                            }))}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <Label>Select Students ({selectedStudents.size} selected)</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 mt-1">
                        {students.map(student => (
                          <div key={student.id} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedStudents)
                                if (checked) {
                                  newSelected.add(student.id)
                                } else {
                                  newSelected.delete(student.id)
                                }
                                setSelectedStudents(newSelected)
                              }}
                            />
                            <span className="text-sm">
                              {student.roll_number} - {student.full_name} ({student.class})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowBulkUpdate(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkUpdate} disabled={saving}>
                        {saving ? 'Updating...' : 'Update Fees'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="ml-auto">
              {filteredFeeRows.length} Students
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

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fees for {MONTHS[selectedMonth - 1]} {selectedYear}</span>
            <Badge variant="secondary">
              <Calculator className="h-3 w-3 mr-1" />
              Total: ৳{grandTotal.toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              {/* Header */}
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Roll</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Student Name</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Class</th>
                  {FEE_TYPES.map(feeType => (
                    <th key={feeType} className="border border-gray-300 p-2 text-center font-semibold min-w-24">
                      {feeType.replace(' Fee', '')}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center font-semibold bg-blue-50">Total</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Status</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {filteredFeeRows.map((row) => (
                  <tr key={row.student.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">
                      {row.student.roll_number}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {row.student.full_name}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {row.student.class}{row.student.section && ` - ${row.student.section}`}
                    </td>
                    {FEE_TYPES.map(feeType => {
                      const fee = row.fees[feeType]
                      return (
                        <td key={feeType} className="border border-gray-300 p-1">
                          <div className="flex flex-col space-y-1">
                            <Input
                              type="number"
                              value={fee?.amount || ''}
                              onChange={(e) => {
                                if (userRole === 'audit_teacher') return
                                const amount = parseFloat(e.target.value) || 0
                                updateFeeAmount(row.student.id, feeType, amount)
                              }}
                              placeholder="0"
                              className="h-8 text-center text-xs"
                              disabled={userRole === 'audit_teacher'}
                            />
                            {fee && fee.amount > 0 && (
                              <div className="flex justify-center">
                                <Badge 
                                  className={`${getStatusColor(fee.status)} text-xs px-1 py-0 cursor-pointer`}
                                  onClick={() => {
                                    if (userRole === 'audit_teacher') return
                                    const newStatus = fee.status === 'paid' ? 'pending' : 'paid'
                                    updatePaymentStatus(fee.id, newStatus)
                                  }}
                                >
                                  {getStatusIcon(fee.status)}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 p-2 text-center font-semibold bg-blue-50">
                      ৳{row.total.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <Badge className={getStatusColor(getOverallStatus(row.fees))}>
                        {getOverallStatus(row.fees)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Footer Totals */}
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-gray-300 p-2" colSpan={3}>
                    <strong>TOTAL</strong>
                  </td>
                  {FEE_TYPES.map(feeType => (
                    <td key={feeType} className="border border-gray-300 p-2 text-center">
                      ৳{columnTotals[feeType].toLocaleString()}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-2 text-center bg-blue-100">
                    <strong>৳{grandTotal.toLocaleString()}</strong>
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {filteredFeeRows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No students found</p>
              <p className="text-sm">
                {searchTerm || selectedClass ? 'Try adjusting your filters' : 'No students available for fee management'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to Use Fees Management</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {userRole === 'audit_teacher' ? (
                <>
                  <li>• You have read-only access to view fee information</li>
                  <li>• Contact school administrators to make changes</li>
                  <li>• You can export data for reporting purposes</li>
                </>
              ) : (
                <>
                  <li>• Enter fee amounts directly in the table cells</li>
                  <li>• Click on status badges to toggle between Pending/Paid</li>
                  <li>• Use Bulk Update to set fees for multiple students at once</li>
                  <li>• Export to CSV for external processing</li>
                  <li>• Totals are calculated automatically</li>
                  <li>• Green = Paid, Yellow = Pending, Red = Overdue</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}