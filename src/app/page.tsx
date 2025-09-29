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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Brain Dump</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <>
                  <div className="flex items-center space-x-3">
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
                      className="flex items-center space-x-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 h-screen">
        <div className="text-center">
          {session?.user ? (
            <>
              <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
                Welcome back to
                <span className="text-blue-600"> Brain Dump</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Ready to continue organizing your thoughts? Access your
                dashboard to manage your brain dumps and collaborate with your
                team.
              </p>
              <div className="mt-10 flex justify-center space-x-4">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="px-8 py-3 flex items-center space-x-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Go to Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 flex items-center space-x-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
                Collaborative Todo Lists
                <span className="text-blue-600"> with Priority Voting</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Create brain dumps, share them with your team, and let everyone
                vote on priorities. See what matters most to your group and get
                things done together.
              </p>
              <div className="mt-10 flex justify-center space-x-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="px-8 py-3">
                    Start Brain Dumping
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="outline" size="lg" className="px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Collaborative</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share your brain dumps with team members and collaborate on
                  tasks together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Vote className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Priority Voting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Let your team vote on task priorities to surface what&apos;s
                  most important to everyone.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Share className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share brain dumps with specific permissions - view only, edit,
                  or voting rights.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        {!session?.user && (
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to organize your thoughts?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of teams using Brain Dump to prioritize and
              collaborate.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="px-8 py-3">
                Create Your First Brain Dump
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Brain Dump. Built with Next.js and love.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
