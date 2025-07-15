'use client'

export default function DashboardLayout({ children }) {
    return (
        <main className="flex-1 bg-base-200/30">
            <div className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="w-full max-w-none">
                    {children}
                </div>
                </div>
            </main>
    )
}
