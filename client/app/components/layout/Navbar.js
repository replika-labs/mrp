'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Menu, LogOut, User, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [user, setUser] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-base-200 bg-base-100 shadow-sm">
            <div className="flex h-16 items-center justify-between px-4">
                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                    <label htmlFor="drawer-left" className="btn btn-ghost btn-sm">
                        <Menu className="h-5 w-5" />
                    </label>
                </div>

                {/* Logo for desktop - hidden on mobile */}
                <div className="hidden lg:flex lg:flex-1">
                    <span className="text-lg font-semibold">WMS</span>
                </div>

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-base-200 transition-colors"
                    >
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-base-300">
                            <Image
                                src="/avatar.png"
                                alt="User"
                                fill
                                className="rounded-full object-cover"
                            />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium line-clamp-1">
                                {user?.name || 'Administrator'}
                            </p>
                            <p className="text-xs text-base-content/70 line-clamp-1">
                                {user?.email || 'admin@example.com'}
                            </p>
                        </div>
                        <ChevronDown
                            className={`h-4 w-4 text-base-content/70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <>
                            {/* Overlay to capture clicks outside dropdown */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsDropdownOpen(false)}
                            />

                            {/* Dropdown content */}
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-base-100 shadow-lg z-50 overflow-hidden">
                                <div className="p-3 border-b border-base-200 md:hidden">
                                    <p className="text-sm font-medium">
                                        {user?.name || 'Administrator'}
                                    </p>
                                    <p className="text-xs text-base-content/70">
                                        {user?.email || 'admin@example.com'}
                                    </p>
                                </div>

                                <div className="p-1">

                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-error rounded-lg hover:bg-error/5 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}