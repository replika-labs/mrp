'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function Sidebar({ menuItems }) {
    const pathname = usePathname()

    return (
        <aside className="w-72 min-h-screen bg-base-100 border-r border-base-200">
            {/* Logo Section */}
            <div className="h-16 px-6 flex items-center border-b border-base-200">
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8"
                        priority
                    />
                    <span className="font-semibold text-lg">WMS</span>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto">
                <ul className="p-4 space-y-6">
                    {menuItems.map((category) => (
                        <li key={category.category}>
                            <div className="px-2 mb-2">
                                <h2 className="text-xs font-medium text-base-content/50 uppercase tracking-wider">
                                    {category.category}
                                </h2>
                            </div>
                            <ul className="space-y-1">
                                {category.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`
                                                    group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                                                    ${isActive
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                                                    }
                                                `}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                                )}
                                                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-base-content/50 group-hover:text-base-content/70'}`} />
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}