'use client'

import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Shirt,
    Target,
    ArrowRightLeft
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AuthWrapper from '../components/AuthWrapper'
import Navbar from '../components/layout/Navbar'

const menuItems = [
    {
        category: 'Overview',
        items: [
            {
                label: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                adminOnly: false
            }
        ]
    },
    {
        category: 'Inventory',
        items: [
            {
                label: 'Fabrics',
                href: '/dashboard/materials',
                icon: Package,
                adminOnly: false
            },
            {
                label: 'Garments',
                href: '/dashboard/products',
                icon: Shirt,
                adminOnly: false
            },
            {
                label: 'Fabric Flow',
                href: '/dashboard/material-movement',
                icon: ArrowRightLeft,
                adminOnly: true
            }
        ]
    },
    {
        category: 'Operations',
        items: [
            {
                label: 'Fabric Acquisition',
                href: '/dashboard/purchase-logs',
                icon: ShoppingCart,
                adminOnly: false
            },
            {
                label: 'Production Orders',
                href: '/dashboard/orders-management',
                icon: Target,
                adminOnly: false
            }
        ]
    },
    {
        category: 'Relationships',
        items: [
            {
                label: 'Partners',
                href: '/dashboard/contacts',
                icon: Users,
                adminOnly: false
            }
        ]
    }
]

export default function DashboardRootLayout({ children }) {
    // TODO: Add authentication check and user role check
    const isAdmin = true // This should come from your auth context

    // Filter menu items based on admin status
    const filteredMenuItems = menuItems.map(category => ({
        ...category,
        items: category.items.filter(item => !item.adminOnly || isAdmin)
    })).filter(category => category.items.length > 0)

    return (
        <AuthWrapper>
            <div className="h-screen w-screen flex bg-base-200/30 relative overflow-hidden">
                {/* Desktop Sidebar - Fixed */}
                <aside className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:z-40 lg:w-72 lg:h-screen">
                <Sidebar menuItems={filteredMenuItems} />
                </aside>

                {/* Fixed Header */}
                <header className="fixed top-0 right-0 lg:left-72 left-0 h-16 bg-base-100 shadow-sm border-b border-base-200 z-30">
                    <Navbar />
                </header>

                {/* Main Content Container */}
                <main className="lg:ml-72 ml-0 mt-16 w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
                    <div className="h-full w-full overflow-auto bg-base-200/30">
                        <div className="min-h-full">
                            <div className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-6">
                                <div className="w-full">
                        {children}
                                </div>
                            </div>
                        </div>
                </div>
                </main>

                {/* Mobile Drawer */}
                <div className="lg:hidden">
                    <div className="drawer">
                        <input id="drawer-left" type="checkbox" className="drawer-toggle" />
                        <div className="drawer-side z-50">
                    <label htmlFor="drawer-left" aria-label="close sidebar" className="drawer-overlay"></label>
                            <div className="fixed top-0 left-0">
                    <Sidebar menuItems={filteredMenuItems} />
                </div>
            </div>
                    </div>
            </div>
        </div>
    </AuthWrapper>
    )
} 