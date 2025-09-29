'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Brain,
  Users,
  Vote,
  Share,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Brain Dump</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {session?.user ? (
                <>
                  <div className="hidden sm:flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Welcome back,{' '}
                      <span className="font-medium">
                        {session.user.name || session.user.email}
                      </span>
                    </span>
                  </div>
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 sm:space-x-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1 sm:space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 min-h-screen">
        <div className="text-center">
          {session?.user ? (
            <>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Welcome back to
                <span className="text-blue-600"> Brain Dump</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Ready to continue organizing your thoughts? Access your
                dashboard to manage your brain dumps and collaborate with your
                team.
              </p>
              <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 flex items-center justify-center space-x-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Go to Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 flex items-center justify-center space-x-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Collaborative Todo Lists
                <span className="text-blue-600"> with Priority Voting</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Create brain dumps, share them with your team, and let everyone
                vote on priorities. See what matters most to your group and get
                things done together.
              </p>
              <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3">
                    Start Brain Dumping
                  </Button>
                </Link>
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 sm:mt-20 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card className="text-center">
              <CardHeader className="pb-4">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">Collaborative</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base">
                  Share your brain dumps with team members and collaborate on
                  tasks together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-4">
                <Vote className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">Priority Voting</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base">
                  Let your team vote on task priorities to surface what&apos;s
                  most important to everyone.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-4">
                <Share className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base">
                  Share brain dumps with specific permissions - view only, edit,
                  or voting rights.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        {!session?.user && (
          <div className="mt-12 sm:mt-20 text-center px-4">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Ready to organize your thoughts?
            </h2>
            <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of teams using Brain Dump to prioritize and
              collaborate.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3">
                Create Your First Brain Dump
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm sm:text-base">&copy; 2024 Brain Dump. Built with Next.js and love.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
