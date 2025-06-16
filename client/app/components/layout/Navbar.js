'use client'

import { Bell, ChevronDown, Search, Menu } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4">
                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                    <label htmlFor="drawer-left" className="btn btn-ghost btn-sm">
                        <Menu className="h-5 w-5" />
                    </label>
                </div>

                {/* Search Bar */}
                <div className="flex flex-1 items-center">
                    <div className="relative w-full max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search anything..."
                            className="h-9 w-full rounded-md border border-input bg-background px-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                        <div className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                        </div>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                            <div className="relative h-8 w-8 rounded-full">
                                <Image
                                    src="/avatar.png"
                                    alt="User"
                                    fill
                                    className="rounded-full object-cover"
                                />
                            </div>
                            <span className="hidden md:inline font-medium">Administrator</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {/* Dropdown Menu - Using native HTML for better performance */}
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover p-1 shadow-md" hidden>
                            <div className="relative py-2 px-3">
                                <p className="text-sm font-medium">Hijab Store</p>
                                <p className="text-xs text-muted-foreground">admin@example.com</p>
                            </div>
                            <div className="h-px bg-muted/50 my-1" />
                            <a href="#" className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent">
                                Profile
                            </a>
                            <a href="#" className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent">
                                Settings
                            </a>
                            <a href="#" className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent">
                                Billing
                            </a>
                            <div className="h-px bg-muted/50 my-1" />
                            <a href="#" className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10">
                                Log out
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
} 