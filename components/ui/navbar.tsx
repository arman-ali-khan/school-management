'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, School, LogIn, FileText, MessageSquare } from 'lucide-react'
import { Button } from './button'

interface NavbarProps {
  schoolSlug: string
  schoolName: string
}

export function Navbar({ schoolSlug, schoolName }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={`/${schoolSlug}`} className="flex items-center space-x-2">
              <School className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">{schoolName}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href={`/${schoolSlug}`} className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href={`/${schoolSlug}#about`} className="text-gray-700 hover:text-green-600 transition-colors">
              About
            </Link>
            <Link href={`/${schoolSlug}#gallery`} className="text-gray-700 hover:text-green-600 transition-colors">
              Gallery
            </Link>
            <Link href={`/${schoolSlug}#notices`} className="text-gray-700 hover:text-green-600 transition-colors">
              Notices
            </Link>
            <Link href={`/${schoolSlug}/application`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            </Link>
            <Link href={`/${schoolSlug}/complaint`}>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Complaint
              </Button>
            </Link>
            <Link href={`/${schoolSlug}/login`}>
              <Button variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-gray-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              href={`/${schoolSlug}`}
              className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href={`/${schoolSlug}#about`}
              className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href={`/${schoolSlug}#gallery`}
              className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Gallery
            </Link>
            <Link
              href={`/${schoolSlug}#notices`}
              className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Notices
            </Link>
            <div className="px-3 py-2 space-y-2">
              <Link href={`/${schoolSlug}/application`} className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              </Link>
              <Link href={`/${schoolSlug}/complaint`} className="block">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Complaint
                </Button>
              </Link>
              <Link href={`/${schoolSlug}/login`} className="block">
                <Button variant="outline" className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}