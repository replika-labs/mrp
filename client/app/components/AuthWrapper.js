'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthWrapper({ children, requiredRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use try-catch for all localStorage operations as they can fail
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // Skip authentication check if already on login or register page
      if (pathname === '/login' || pathname === '/register') {
        setLoading(false);
        return;
      }

      if (!token || !storedUser) {
        // Not authenticated, redirect to login
        console.log("No auth token found, redirecting to login");
        setLoading(false);
        router.push('/login');
        return;
      }

      // Try to parse the user data
      try {
        const user = JSON.parse(storedUser);
        
        // Validate user object has minimal required fields
        if (!user || !user.id) {
          throw new Error("Invalid user data");
        }
        
        setIsAuthenticated(true);

        // Check role if required
        if (requiredRole) {
          if (user.role === requiredRole) {
            setIsAuthorized(true);
          } else {
            // Authenticated but not authorized for this role
            console.warn(`User with role ${user.role} attempted to access route requiring ${requiredRole}`);
            // Redirect to a default authenticated page
            router.push('/dashboard');
          }
        } else {
          // No specific role required, just authenticated
          setIsAuthorized(true);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        // Data corrupted, clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (e) {
      // Handle any localStorage access errors
      console.error("Error accessing localStorage", e);
      router.push('/login');
    } finally {
      setLoading(false);
    }

  }, [router, pathname, requiredRole]);

  if (loading) {
    // Show a loading indicator while checking authentication/authorization
    return <div className="flex justify-center items-center h-screen text-black">Checking Authentication...</div>;
  }

  if (isAuthenticated && isAuthorized) {
    // User is authenticated and authorized, render children
    return <>{children}</>;
  }

  // If not loading, and not authenticated/authorized, nothing is rendered
  // because the effect hook already triggered a redirect.
  return null;
} 