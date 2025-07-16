'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard,
  FileText,
  Edit,
  Image,
  Bell,
  Users,
  GraduationCap,
  UserPlus,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  School,
  BookOpen,
  Award,
  Menu,
  X,
  Globe
} from 'lucide-react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  schoolName: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  schoolSlug?: string
}

const menuItems = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: LayoutDashboard,
    category: 'main'
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: FileText,
    category: 'main'
  },
  {
    id: 'about-section',
    label: 'About Section',
    icon: Edit,
    category: 'content'
  },
  {
    id: 'gallery',
    label: 'Manage Gallery',
    icon: Image,
    category: 'content'
  },
  {
    id: 'notices',
    label: 'Update Notices',
    icon: Bell,
    category: 'content'
  },
  {
    id: 'featured-students',
    label: 'Featured Students',
    icon: Award,
    category: 'content'
  },
  {
    id: 'teachers',
    label: 'Manage Teachers',
    icon: Users,
    category: 'management'
  },
  {
    id: 'create-teacher',
    label: 'Add Teacher',
    icon: UserPlus,
    category: 'management'
  },
  {
    id: 'students',
    label: 'Manage Students',
    icon: GraduationCap,
    category: 'management'
  },
  {
    id: 'create-student',
    label: 'Add Student',
    icon: UserPlus,
    category: 'management'
  },
  {
    id: 'results',
    label: 'Create Results',
    icon: BarChart3,
    category: 'academic'
  },
  {
    id: 'settings',
    label: 'Site Settings',
    icon: Settings,
    category: 'system'
  }
]

const categories = {
  main: 'Dashboard',
  content: 'Content Management',
  management: 'User Management',
  academic: 'Academic',
  system: 'System'
}

// Mobile bottom navigation items
const mobileNavItems = [
  {
    id: 'site',
    label: 'Site',
    icon: Globe,
    isExternal: true
  },
  {
    id: 'overview',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: FileText
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings
  }
]

export function Sidebar({ 
  activeSection, 
  onSectionChange, 
  schoolName, 
  collapsed = false,
  onToggleCollapse,
  schoolSlug 
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  const handleMobileNavClick = (itemId: string, isExternal?: boolean) => {
    if (isExternal && schoolSlug) {
      window.open(`/${schoolSlug}`, '_blank')
    } else {
      onSectionChange(itemId)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex bg-white border-r border-gray-200 flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <School className="h-6 w-6 text-green-600" />
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm truncate">
                    {schoolName}
                  </h2>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            {collapsed && (
              <School className="h-6 w-6 text-green-600 mx-auto" />
            )}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="p-1 h-6 w-6"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {!collapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {categories[category as keyof typeof categories]}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    const isHovered = hoveredItem === item.id

                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-9 px-3 text-sm font-medium transition-colors",
                          collapsed ? "px-2" : "px-3",
                          isActive 
                            ? "bg-green-100 text-green-700 hover:bg-green-100" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={() => onSectionChange(item.id)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <Icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          collapsed ? "mx-auto" : "mr-3",
                          isActive ? "text-green-600" : "text-gray-500"
                        )} />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        
                        {/* Tooltip for collapsed state */}
                        {collapsed && isHovered && (
                          <div className="absolute left-16 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Mobile Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-xl">
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <School className="h-6 w-6 text-green-600" />
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">
                      {schoolName}
                    </h2>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <ScrollArea className="flex-1 px-3 py-4 h-full">
              <nav className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {categories[category as keyof typeof categories]}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id

                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-9 px-3 text-sm font-medium transition-colors",
                              isActive 
                                ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            )}
                            onClick={() => {
                              onSectionChange(item.id)
                              setMobileMenuOpen(false)
                            }}
                          >
                            <Icon className={cn(
                              "h-4 w-4 flex-shrink-0 mr-3",
                              isActive ? "text-green-600" : "text-gray-500"
                            )} />
                            <span className="truncate">{item.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id && !item.isExternal

            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex flex-col items-center space-y-1 h-auto py-2 px-3",
                  isActive 
                    ? "text-green-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => handleMobileNavClick(item.id, item.isExternal)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}