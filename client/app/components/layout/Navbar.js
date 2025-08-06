'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Menu, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [user, setUser] = useState(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // Add small delay to ensure logout button click is processed first
                setTimeout(() => {
                    setIsDropdownOpen(false)
                }, 100)
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdownOpen])

    const handleLogout = () => {
        // Close dropdown immediately to prevent UI conflicts
        setIsDropdownOpen(false)
        
        try {
            // Clear localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            
            // Clear local state
            setUser(null)
            
            // Use router for client-side navigation first
            router.push('/login')
            
            // Then force a full page reload to ensure clean state
            setTimeout(() => {
                window.location.href = '/login'
            }, 100)
        } catch (error) {
            console.error('Error during logout:', error)
            // Fallback: direct browser navigation
            window.location.href = '/login'
        }
    }

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    return (
        <>
            <div className="navbar bg-base-100 shadow-sm border-b border-gray-100 px-4 min-h-16 flex justify-between items-center relative z-30">
                {/* Left Side - Logo and Mobile Menu */}
                <div className="flex items-center gap-2">
                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                        <label htmlFor="drawer-left" className="btn btn-ghost btn-circle">
                        <Menu className="h-5 w-5" />
                    </label>
                </div>

                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
                        Production Planning
                    </Link>
                </div>

                {/* Right Side - User Profile */}
                <div className="flex items-center relative" ref={dropdownRef}>
                    <div 
                        onClick={toggleDropdown}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-200 cursor-pointer transition-colors"
                    >
                        {/* User Info - Hidden on small screens */}
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-sm font-semibold text-base-content leading-tight">
                                {user?.name || 'Hijab Store Administrator'}
                            </span>
                            <span className="text-xs text-base-content/60 leading-tight">
                                {user?.email || 'admin@hijabwms.com'}
                            </span>
                        </div>
                        
                        {/* Avatar */}
                        <div className="avatar">
                            <div className="w-9 h-9 rounded-full ring-2 ring-primary/20">
                                <img 
                                    src="/avatar.png" 
                                    alt="User Avatar" 
                                    className="w-9 h-9 rounded-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'HA') + '&background=0ea5e9&color=fff&size=36'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Dropdown Arrow */}
                        <ChevronDown className={`h-4 w-4 text-base-content/50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Dropdown Overlay */}
                    {isDropdownOpen && (
                        <>
                    {/* Dropdown Menu */}
                    <div className="fixed top-16 right-4 z-60 bg-white rounded-2xl w-80 shadow-2xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                        {/* User Info Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="avatar">
                                    <div className="w-12 h-12 rounded-full ring-2 ring-blue-200">
                                        <img 
                                            src="/avatar.png" 
                                            alt="User Avatar" 
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'HA') + '&background=0ea5e9&color=fff&size=48'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900">
                                        {user?.name || 'Hijab Store Administrator'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {user?.email || 'admin@hijabwms.com'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Administrator
                                    </div>
                                </div>
                            </div>
                                </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {/* Logout */}
                                <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleLogout();
                                        }}
                                        type="button"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-red-600 w-full cursor-pointer"
                                    >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 pointer-events-none">
                                        <LogOut className="h-4 w-4 text-red-600 pointer-events-none" />
                                    </div>
                                    <div className="flex-1 text-left pointer-events-none">
                                        <div className="font-medium pointer-events-none">Logout</div>
                                        <div className="text-xs text-red-500 pointer-events-none">Sign out of your account</div>
                                    </div>
                                </button>
                                </div>
                            </div>
                        </>
                    )}
        </>
    )
}