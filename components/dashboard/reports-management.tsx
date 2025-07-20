'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Download, 
  Users, 
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  PieChart,
  Activity,
  Award,
  DollarSign,
  BookOpen,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart as RechartsPieChart, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer
} from 'recharts'

interface ReportsManagementProps {
  schoolId: string
  userRole?: string
}

interface StudentStats {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  classwiseDistribution: Array<{ class: string; count: number }>
  genderDistribution: Array<{ gender: string; count: number }>
  admissionTrends: Array<{ month: string; count: number }>
}

interface TeacherStats {
  totalTeachers: number
  regularTeachers: number
  auditTeachers: number
  subjectDistribution: Array<{ subject: string; count: number }>
}

interface AcademicStats {
  totalResults: number
  averageGrade: string
  subjectPerformance: Array<{ subject: string; average: number; count: number }>
  gradeDistribution: Array<{ grade: string; count: number }>
  examTypeStats: Array<{ examType: string; count: number }>
}

interface ApplicationStats {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  monthlyApplications: Array<{ month: string; count: number }>
  classPreferences: Array<{ class: string; count: number }>
}

interface FinancialStats {
  totalFees: number
  collectedFees: number
  pendingFees: number
  overdueFees: number
  monthlyCollection: Array<{ month: string; amount: number }>
  feeTypeBreakdown: Array<{ feeType: string; amount: number }>
}

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#ea580c', '#9333ea', '#0891b2', '#ca8a04']

export function ReportsManagement({ schoolId, userRole }: ReportsManagementProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const { toast } = useToast()

  const [studentStats, setStudentStats] = useState<StudentStats>({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    classwiseDistribution: [],
    genderDistribution: [],
    admissionTrends: []
  })

  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    totalTeachers: 0,
    regularTeachers: 0,
    auditTeachers: 0,
    subjectDistribution: []
  })

  const [academicStats, setAcademicStats] = useState<AcademicStats>({
    totalResults: 0,
    averageGrade: 'N/A',
    subjectPerformance: [],
    gradeDistribution: [],
    examTypeStats: []
  })

  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    monthlyApplications: [],
    classPreferences: []
  })

  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalFees: 0,
    collectedFees: 0,
    pendingFees: 0,
    overdueFees: 0,
    monthlyCollection: [],
    feeTypeBreakdown: []
  })

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  useEffect(() => {
    fetchAllReports()
  }, [schoolId, selectedYear, selectedMonth, selectedClass])

  const fetchAllReports = async () => {
    setLoading(true)
    setError('')

    try {
      await Promise.all([
        fetchStudentStats(),
        fetchTeacherStats(),
        fetchAcademicStats(),
        fetchApplicationStats(),
        fetchFinancialStats()
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentStats = async () => {
    try {
      // Get total students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)

      if (studentsError) throw studentsError

      const totalStudents = students?.length || 0
      const activeStudents = students?.filter(s => s.status === 'active').length || 0
      const inactiveStudents = totalStudents - activeStudents

      // Class-wise distribution
      const classDistribution = students?.reduce((acc: any, student) => {
        const className = student.class || 'Unknown'
        acc[className] = (acc[className] || 0) + 1
        return acc
      }, {})

      const classwiseDistribution = Object.entries(classDistribution || {}).map(([class_, count]) => ({
        class: class_,
        count: count as number
      }))

      // Gender distribution
      const genderDistribution = students?.reduce((acc: any, student) => {
        const gender = student.gender || 'Not specified'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      }, {})

      const genderData = Object.entries(genderDistribution || {}).map(([gender, count]) => ({
        gender: gender,
        count: count as number
      }))

      // Admission trends (last 12 months)
      const admissionTrends = months.map(month => {
        const monthIndex = months.indexOf(month) + 1
        const count = students?.filter(s => {
          if (!s.admission_date) return false
          const admissionDate = new Date(s.admission_date)
          return admissionDate.getMonth() + 1 === monthIndex && 
                 admissionDate.getFullYear().toString() === selectedYear
        }).length || 0
        
        return { month, count }
      })

      setStudentStats({
        totalStudents,
        activeStudents,
        inactiveStudents,
        classwiseDistribution,
        genderDistribution: genderData,
        admissionTrends
      })
    } catch (err: any) {
      console.error('Failed to fetch student stats:', err)
    }
  }

  const fetchTeacherStats = async () => {
    try {
      const { data: teachers, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .in('role', ['teacher', 'audit_teacher'])

      if (error) throw error

      const totalTeachers = teachers?.length || 0
      const regularTeachers = teachers?.filter(t => t.role === 'teacher').length || 0
      const auditTeachers = teachers?.filter(t => t.role === 'audit_teacher').length || 0

      // Subject distribution
      const subjectDistribution = teachers?.reduce((acc: any, teacher) => {
        const subject = teacher.subject || 'Not specified'
        acc[subject] = (acc[subject] || 0) + 1
        return acc
      }, {})

      const subjectData = Object.entries(subjectDistribution || {}).map(([subject, count]) => ({
        subject,
        count: count as number
      }))

      setTeacherStats({
        totalTeachers,
        regularTeachers,
        auditTeachers,
        subjectDistribution: subjectData
      })
    } catch (err: any) {
      console.error('Failed to fetch teacher stats:', err)
    }
  }

  const fetchAcademicStats = async () => {
    try {
      let query = supabase
        .from('results')
        .select('*')
        .eq('school_id', schoolId)

      // Apply filters
      if (selectedClass) {
        query = query.eq('class', selectedClass)
      }

      const { data: results, error } = await query

      if (error) throw error

      const totalResults = results?.length || 0

      // Calculate average grade
      const gradePoints: { [key: string]: number } = {
        'A+': 5, 'A': 4, 'A-': 3.5, 'B': 3, 'C': 2, 'D': 1, 'F': 0
      }

      const totalPoints = results?.reduce((sum, result) => {
        return sum + (gradePoints[result.grade] || 0)
      }, 0) || 0

      const averagePoints = totalResults > 0 ? totalPoints / totalResults : 0
      const averageGrade = Object.entries(gradePoints).find(([_, points]) => 
        Math.abs(points - averagePoints) < 0.25
      )?.[0] || 'N/A'

      // Subject performance
      const subjectPerformance = results?.reduce((acc: any, result) => {
        const subject = result.subject
        if (!acc[subject]) {
          acc[subject] = { total: 0, count: 0 }
        }
        acc[subject].total += (result.marks / result.total_marks) * 100
        acc[subject].count += 1
        return acc
      }, {})

      const subjectData = Object.entries(subjectPerformance || {}).map(([subject, data]: [string, any]) => ({
        subject,
        average: Math.round(data.total / data.count),
        count: data.count
      }))

      // Grade distribution
      const gradeDistribution = results?.reduce((acc: any, result) => {
        const grade = result.grade || 'Unknown'
        acc[grade] = (acc[grade] || 0) + 1
        return acc
      }, {})

      const gradeData = Object.entries(gradeDistribution || {}).map(([grade, count]) => ({
        grade,
        count: count as number
      }))

      // Exam type stats
      const examTypeStats = results?.reduce((acc: any, result) => {
        const examType = result.exam_type || 'Unknown'
        acc[examType] = (acc[examType] || 0) + 1
        return acc
      }, {})

      const examTypeData = Object.entries(examTypeStats || {}).map(([examType, count]) => ({
        examType,
        count: count as number
      }))

      setAcademicStats({
        totalResults,
        averageGrade,
        subjectPerformance: subjectData,
        gradeDistribution: gradeData,
        examTypeStats: examTypeData
      })
    } catch (err: any) {
      console.error('Failed to fetch academic stats:', err)
    }
  }

  const fetchApplicationStats = async () => {
    try {
      const { data: applications, error } = await supabase
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId)

      if (error) throw error

      const totalApplications = applications?.length || 0
      const pendingApplications = applications?.filter(a => a.application_status === 'pending').length || 0
      const approvedApplications = applications?.filter(a => a.application_status === 'approved').length || 0
      const rejectedApplications = applications?.filter(a => a.application_status === 'rejected').length || 0

      // Monthly applications
      const monthlyApplications = months.map(month => {
        const monthIndex = months.indexOf(month) + 1
        const count = applications?.filter(a => {
          const createdDate = new Date(a.created_at)
          return createdDate.getMonth() + 1 === monthIndex && 
                 createdDate.getFullYear().toString() === selectedYear
        }).length || 0
        
        return { month, count }
      })

      // Class preferences
      const classPreferences = applications?.reduce((acc: any, app) => {
        const desiredClass = app.desired_class || 'Unknown'
        acc[desiredClass] = (acc[desiredClass] || 0) + 1
        return acc
      }, {})

      const classData = Object.entries(classPreferences || {}).map(([class_, count]) => ({
        class: class_,
        count: count as number
      }))

      setApplicationStats({
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        monthlyApplications,
        classPreferences: classData
      })
    } catch (err: any) {
      console.error('Failed to fetch application stats:', err)
    }
  }

  const fetchFinancialStats = async () => {
    try {
      let query = supabase
        .from('student_fees')
        .select('*')
        .eq('school_id', schoolId)

      // Apply year filter
      if (selectedYear) {
        query = query.eq('year', parseInt(selectedYear))
      }

      const { data: fees, error } = await query

      if (error) throw error

      const totalFees = fees?.reduce((sum, fee) => sum + fee.amount, 0) || 0
      const collectedFees = fees?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0) || 0
      const pendingFees = fees?.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0) || 0
      const overdueFees = fees?.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0) || 0

      // Monthly collection
      const monthlyCollection = months.map((month, index) => {
        const monthIndex = index + 1
        const amount = fees?.filter(f => f.month === monthIndex && f.status === 'paid')
          .reduce((sum, fee) => sum + fee.amount, 0) || 0
        
        return { month, amount }
      })

      // Fee type breakdown
      const feeTypeBreakdown = fees?.reduce((acc: any, fee) => {
        const feeType = fee.fee_type || 'Unknown'
        acc[feeType] = (acc[feeType] || 0) + fee.amount
        return acc
      }, {})

      const feeTypeData = Object.entries(feeTypeBreakdown || {}).map(([feeType, amount]) => ({
        feeType,
        amount: amount as number
      }))

      setFinancialStats({
        totalFees,
        collectedFees,
        pendingFees,
        overdueFees,
        monthlyCollection,
        feeTypeBreakdown: feeTypeData
      })
    } catch (err: any) {
      console.error('Failed to fetch financial stats:', err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllReports()
    setRefreshing(false)
    toast({
      title: "Reports Refreshed",
      description: "All report data has been updated with the latest information.",
    })
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvData = [headers, ...data.map(row => headers.map(header => row[header]))]
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${selectedYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderStudentReports = () => (
    <div className="space-y-6">
      {/* Student Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {studentStats.activeStudents} active, {studentStats.inactiveStudents} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{studentStats.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              {studentStats.totalStudents > 0 ? 
                Math.round((studentStats.activeStudents / studentStats.totalStudents) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.classwiseDistribution.length}</div>
            <p className="text-xs text-muted-foreground">
              Different class levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Class-wise Distribution
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(studentStats.classwiseDistribution, 'class_distribution')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Students",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={studentStats.classwiseDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Students",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <RechartsPieChart data={studentStats.genderDistribution} dataKey="count" nameKey="gender">
                  {studentStats.genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Admission Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Admission Trends ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Admissions",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={studentStats.admissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTeacherReports = () => (
    <div className="space-y-6">
      {/* Teacher Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherStats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Active teaching staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{teacherStats.regularTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Full access teachers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Teachers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{teacherStats.auditTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Read-only access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Subject-wise Teacher Distribution
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToCSV(teacherStats.subjectDistribution, 'teacher_subjects')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Teachers",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[400px]"
          >
            <BarChart data={teacherStats.subjectDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="subject" type="category" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )

  const renderAcademicReports = () => (
    <div className="space-y-6">
      {/* Academic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicStats.totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Exam results recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{academicStats.averageGrade}</div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicStats.subjectPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              Different subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Types</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicStats.examTypeStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Different exam types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Subject Performance (Average %)
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(academicStats.subjectPerformance, 'subject_performance')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                average: {
                  label: "Average %",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={academicStats.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="average" fill="var(--color-average)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Students",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <RechartsPieChart data={academicStats.gradeDistribution} dataKey="count" nameKey="grade">
                  {academicStats.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderApplicationReports = () => (
    <div className="space-y-6">
      {/* Application Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationStats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              All time applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{applicationStats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{applicationStats.approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{applicationStats.rejectedApplications}</div>
            <p className="text-xs text-muted-foreground">
              Not approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Applications ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Applications",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={applicationStats.monthlyApplications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Class Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Class Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Applications",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={applicationStats.classPreferences}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderFinancialReports = () => (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{financialStats.totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total fee amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{financialStats.collectedFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {financialStats.totalFees > 0 ? 
                Math.round((financialStats.collectedFees / financialStats.totalFees) * 100) : 0}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">৳{financialStats.pendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{financialStats.overdueFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Past due amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Fee Collection ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount (৳)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={financialStats.monthlyCollection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Fee Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount (৳)",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <RechartsPieChart data={financialStats.feeTypeBreakdown} dataKey="amount" nameKey="feeType">
                  {financialStats.feeTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reports...</p>
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
              <BarChart3 className="h-5 w-5 mr-2" />
              School Reports & Analytics
            </CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filters:</Label>
            </div>

            <div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Months</SelectItem>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {studentStats.classwiseDistribution.map(cls => (
                    <SelectItem key={cls.class} value={cls.class}>{cls.class}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="ml-auto">
              Data as of {new Date().toLocaleDateString()}
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

      {/* Reports Tabs */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>Teachers</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Academic</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Financial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          {renderStudentReports()}
        </TabsContent>

        <TabsContent value="teachers">
          {renderTeacherReports()}
        </TabsContent>

        <TabsContent value="academic">
          {renderAcademicReports()}
        </TabsContent>

        <TabsContent value="applications">
          {renderApplicationReports()}
        </TabsContent>

        <TabsContent value="financial">
          {renderFinancialReports()}
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to Use Reports</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {userRole === 'audit_teacher' ? (
                <>
                  <li>• You have read-only access to view all reports and analytics</li>
                  <li>• Use filters to narrow down data by year, month, or class</li>
                  <li>• Export data to CSV for external analysis</li>
                  <li>• Contact school administrators for detailed insights</li>
                </>
              ) : (
                <>
                  <li>• Use the tabs to switch between different report categories</li>
                  <li>• Apply filters to view data for specific time periods or classes</li>
                  <li>• Click "Export" buttons to download data as CSV files</li>
                  <li>• Use "Refresh" to update reports with the latest data</li>
                  <li>• Charts are interactive - hover for detailed information</li>
                  <li>• All data is automatically calculated from your school's records</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}