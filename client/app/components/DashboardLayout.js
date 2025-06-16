'use client'

import Navbar from './layout/Navbar'

export default function DashboardLayout({ children }) {
    return (<div className="flex flex-col h-full w-full">
        <Navbar />

        <div className="flex-1 overflow-auto w-full">
            <main className="h-full w-full p-6 lg:px-8">
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    </div>
    )
}
