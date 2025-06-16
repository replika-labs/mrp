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
import DashboardLayout from '../components/DashboardLayout'
import Sidebar from '../components/Sidebar'
import AuthWrapper from '../components/AuthWrapper'

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
                label: 'Materials',
                href: '/dashboard/materials',
                icon: Package,
                adminOnly: false
            },
            {
                label: 'Products',
                href: '/dashboard/products',
                icon: Shirt,
                adminOnly: false
            },
            {
                label: 'Material Movement',
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
                label: 'Purchase Logs',
                href: '/dashboard/purchase-logs',
                icon: ShoppingCart,
                adminOnly: false
            },
            {
                label: 'Orders Management',
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
                label: 'Contacts',
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

    return (<AuthWrapper>
        <div className="h-screen flex overflow-hidden">
            {/* Sidebar - hidden on mobile, shown on desktop */}
            <div className="hidden lg:block flex-shrink-0">
                <Sidebar menuItems={filteredMenuItems} />
            </div>

            {/* Mobile drawer */}
            <div className="drawer lg:hidden flex-1">
                <input id="drawer-left" type="checkbox" className="drawer-toggle" />

                {/* Drawer content */}                <div className="drawer-content flex flex-col h-screen w-full">
                    <DashboardLayout>
                        {children}
                    </DashboardLayout>
                </div>

                {/* Drawer sidebar */}
                <div className="drawer-side">
                    <label htmlFor="drawer-left" aria-label="close sidebar" className="drawer-overlay"></label>
                    <Sidebar menuItems={filteredMenuItems} />
                </div>
            </div>

            {/* Desktop content */}
            <div className="hidden lg:flex flex-1 h-screen w-full">
                <DashboardLayout>
                    {children}
                </DashboardLayout>
            </div>
        </div>
    </AuthWrapper>
    )
} 