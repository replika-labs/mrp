'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function Sidebar({ menuItems }) {
    const pathname = usePathname()

    return (
        <div className="w-72 h-screen bg-base-100 border-r border-gray-300 flex flex-col shadow-lg">
            {/* Logo Section */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-300 flex-shrink-0">
                {/* <div className="avatar">
                    <div className="w-8 rounded-lg">
                        <img src="/logo.png" alt="WMS Logo" className="w-8 h-8 object-contain" />
                    </div>
                </div> */}
                <div className="flex flex-col">
                    <span className="font-bold text-lg text-primary">Roselover</span>
                    <span className="text-xs text-base-content/60">Hijab Garment Production</span>
                </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto p-4">
                <ul className="menu p-0 space-y-2">
                    {menuItems.map((category) => (
                        <li key={category.category}>
                            {/* Category Header */}
                            <div className="menu-title text-xs text-base-content/60 font-semibold uppercase tracking-wider px-2 py-2">
                                {category.category}
                            </div>
                            
                            {/* Category Items */}
                            <ul className="space-y-1">
                                {category.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`
                                                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-gray-200/90 backdrop-blur-xl shadow-xl font-bold text-gray-900'
                                                        : 'hover:bg-gray-200/70 hover:backdrop-blur-xl hover:shadow-lg hover:text-gray-800 text-base-content/80'
                                                    }
                                                `}
                                            >
                                                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-gray-900' : 'text-base-content/60 group-hover:text-gray-800'}`} />
                                                <span className="flex-1">{item.label}</span>
                                                {isActive && (
                                                    <div className="w-2 h-2 bg-gray-900 rounded-full opacity-80 flex-shrink-0"></div>
                                                )}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300 flex-shrink-0">
                <div className="text-center">
                    <div className="text-xs text-base-content/40 mt-1">
                        Garment Production Planning
                    </div>
                    <div className="text-xs text-base-content/50">
                        © 2024 
                    </div>
                </div>
            </div>
        </div>
    )
}