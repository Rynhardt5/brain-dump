'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Users,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Settings,
  Trash2,
  Share,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BrainDump {
  id: string
  name: string
  description: string
  isPublic: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
  ownerName: string
  isOwner: boolean
  collaboratorCount: number
}

interface Collaborator {
  userId: string
  userName: string
  userEmail: string
  canEdit: boolean
  canVote: boolean
  invitedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const user = session?.user

  // Debug logging - remove after testing
  // console.log('Session status:', status)
  // console.log('Session data:', session)
  // console.log('User data:', user)
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newBrainDump, setNewBrainDump] = useState({
    name: '',
    description: '',
    isPublic: false,
  })

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<
    'all' | 'owned' | 'shared' | 'public'
  >('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Collaborator management state
  const [manageCollaboratorsOpen, setManageCollaboratorsOpen] = useState(false)
  const [selectedBrainDump, setSelectedBrainDump] = useState<BrainDump | null>(
    null
  )
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loadingCollaborators, setLoadingCollaborators] = useState(false)
  const [updatingPermissions, setUpdatingPermissions] = useState<string | null>(
    null
  )

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermissions, setSharePermissions] = useState<{
    canEdit: boolean
    canVote: boolean
  }>({
    canEdit: false,
    canVote: true,
  })

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<Collaborator | null>(null)

  useEffect(() => {
    fetchBrainDumps()
  }, [])

  const logOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const fetchBrainDumps = async () => {
    try {
      const response = await fetch('/api/brain-dumps')
      if (response.ok) {
        const data = await response.json()
        setBrainDumps(data.brainDumps)
      }
    } catch (error) {
      console.error('Error fetching brain dumps:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBrainDump = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/brain-dumps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBrainDump),
      })

      if (response.ok) {
        const data = await response.json()
        setBrainDumps([
          ...brainDumps,
          { ...data.brainDump, ownerName: user?.name, isOwner: true },
        ])
        setNewBrainDump({ name: '', description: '', isPublic: false })
        setCreateDialogOpen(false)
        toast.success(`"${data.brainDump.name}" has been created successfully`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(
          errorData.error || 'Failed to create brain dump. Please try again.'
        )
      }
    } catch (error) {
      toast.error('An error occurred while creating the brain dump')
      console.error('Error creating brain dump:', error)
    }
  }

  // Collaborator management functions
  const openManageCollaborators = async (brainDump: BrainDump) => {
    setSelectedBrainDump(brainDump)
    setManageCollaboratorsOpen(true)
    await fetchCollaborators(brainDump.id)
  }

  const fetchCollaborators = async (brainDumpId: string) => {
    setLoadingCollaborators(true)
    try {
      const response = await fetch(
        `/api/brain-dumps/${brainDumpId}/collaborators`
      )
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data.collaborators)
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error)
    } finally {
      setLoadingCollaborators(false)
    }
  }

  const updateCollaboratorPermissions = async (
    collaboratorUserId: string,
    canEdit: boolean,
    canVote: boolean
  ) => {
    if (!selectedBrainDump) return

    // Set loading state for this specific collaborator
    setUpdatingPermissions(collaboratorUserId)

    // Optimistic update - immediately update the UI
    setCollaborators((prev) =>
      prev.map((collaborator) =>
        collaborator.userId === collaboratorUserId
          ? { ...collaborator, canEdit, canVote }
          : collaborator
      )
    )

    try {
      const response = await fetch(
        `/api/brain-dumps/${selectedBrainDump.id}/collaborators`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collaboratorUserId, canEdit, canVote }),
        }
      )

      if (!response.ok) {
        // If the request failed, revert the optimistic update
        await fetchCollaborators(selectedBrainDump.id)
        console.error('Failed to update permissions')
      }
    } catch (error) {
      // If there was an error, revert the optimistic update
      await fetchCollaborators(selectedBrainDump.id)
      console.error('Error updating collaborator permissions:', error)
    } finally {
      // Clear loading state
      setUpdatingPermissions(null)
    }
  }

  const removeCollaborator = async (collaboratorUserId: string) => {
    if (!selectedBrainDump) return

    // Store the collaborator for potential rollback
    const removedCollaborator = collaborators.find(
      (c) => c.userId === collaboratorUserId
    )
    if (!removedCollaborator) return

    // Optimistic update - immediately remove from UI
    setCollaborators((prev) =>
      prev.filter((c) => c.userId !== collaboratorUserId)
    )

    try {
      const response = await fetch(
        `/api/brain-dumps/${selectedBrainDump.id}/collaborators`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collaboratorUserId }),
        }
      )

      if (response.ok) {
        // Update the brain dump list to reflect new collaborator count
        await fetchBrainDumps()
        toast.success(
          `${removedCollaborator.userName} has been removed from the brain dump`
        )
      } else {
        // If the request failed, revert the optimistic update
        setCollaborators((prev) => [...prev, removedCollaborator])
        toast.error('Failed to remove collaborator. Please try again.')
      }
    } catch (error) {
      // If there was an error, revert the optimistic update
      setCollaborators((prev) => [...prev, removedCollaborator])
      toast.error('An error occurred while removing the collaborator')
      console.error('Error removing collaborator:', error)
    }
  }

  // Share functions
  const openShareDialog = (brainDump: BrainDump) => {
    setSelectedBrainDump(brainDump)
    setShareDialogOpen(true)
  }

  const shareBrainDump = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBrainDump) return

    try {
      const response = await fetch(
        `/api/brain-dumps/${selectedBrainDump.id}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: shareEmail, ...sharePermissions }),
        }
      )

      if (response.ok) {
        setShareEmail('')
        setShareDialogOpen(false)
        await fetchBrainDumps() // Refresh to show updated collaborator count
        toast.success(`Brain dump shared with ${shareEmail}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(
          errorData.error || 'Failed to share brain dump. Please try again.'
        )
      }
    } catch (error) {
      toast.error('An error occurred while sharing the brain dump')
      console.error('Error sharing brain dump:', error)
    }
  }

  // Filter and sort brain dumps
  const filteredAndSortedBrainDumps = brainDumps
    .filter((brainDump) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = brainDump.name.toLowerCase().includes(query)
        const matchesDescription = brainDump.description
          ?.toLowerCase()
          .includes(query)
        const matchesOwner = brainDump.ownerName?.toLowerCase().includes(query)
        if (!matchesName && !matchesDescription && !matchesOwner) {
          return false
        }
      }

      // Type filter
      switch (filterType) {
        case 'owned':
          return brainDump.isOwner && brainDump.collaboratorCount === 0
        case 'shared':
          return brainDump.isOwner && brainDump.collaboratorCount > 0
        case 'public':
          return brainDump.isPublic
        default:
          return true
      }
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated':
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please sign in to access your dashboard.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Brain Dump</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Brain Dump
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Brain Dump</DialogTitle>
                    <DialogDescription>
                      Create a new brain dump to organize your thoughts and
                      tasks.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createBrainDump} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name-desktop">Name</Label>
                      <Input
                        id="name-desktop"
                        placeholder="Enter brain dump name"
                        value={newBrainDump.name}
                        onChange={(e) =>
                          setNewBrainDump({
                            ...newBrainDump,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description-desktop">
                        Description (optional)
                      </Label>
                      <Input
                        id="description-desktop"
                        placeholder="Enter description"
                        value={newBrainDump.description}
                        onChange={(e) =>
                          setNewBrainDump({
                            ...newBrainDump,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic-desktop"
                        checked={newBrainDump.isPublic}
                        onChange={(e) =>
                          setNewBrainDump({
                            ...newBrainDump,
                            isPublic: e.target.checked,
                          })
                        }
                      />
                      <Label htmlFor="isPublic-desktop">Make public</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={logOut}>
                Logout
              </Button>
            </div>
          </div>
          {/* Mobile Layout */}
          <div className="py-4 sm:hidden">
            {/* Top row with title and logout */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Brain Dump</h1>
                <p className="text-gray-600">Welcome back, {user?.name}</p>
              </div>
              <Button variant="outline" onClick={logOut}>
                Logout
              </Button>
            </div>

            {/* Full width New Brain Dump button */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Brain Dump
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Brain Dump</DialogTitle>
                  <DialogDescription>
                    Create a new brain dump to organize your thoughts and tasks.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createBrainDump} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter brain dump name"
                      value={newBrainDump.name}
                      onChange={(e) =>
                        setNewBrainDump({
                          ...newBrainDump,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="Enter description"
                      value={newBrainDump.description}
                      onChange={(e) =>
                        setNewBrainDump({
                          ...newBrainDump,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newBrainDump.isPublic}
                      onChange={(e) =>
                        setNewBrainDump({
                          ...newBrainDump,
                          isPublic: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="isPublic">Make public</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogContent className="max-w-md mx-4 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    Share Brain Dump
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Share &quot;{selectedBrainDump?.name}&quot; with another
                    user
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={shareBrainDump} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shareEmail">Email</Label>
                    <Input
                      id="shareEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="shareCanEdit"
                        checked={sharePermissions.canEdit}
                        onChange={(e) =>
                          setSharePermissions({
                            ...sharePermissions,
                            canEdit: e.target.checked,
                          })
                        }
                      />
                      <Label htmlFor="shareCanEdit" className="text-sm">
                        Can edit items
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="shareCanVote"
                        checked={sharePermissions.canVote}
                        onChange={(e) =>
                          setSharePermissions({
                            ...sharePermissions,
                            canVote: e.target.checked,
                          })
                        }
                      />
                      <Label htmlFor="shareCanVote" className="text-sm">
                        Can vote on priorities
                      </Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShareDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Share</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      {/* Filter Bar */}
      <div className="bg-white border-b shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
            {/* Search - Full width on mobile */}
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <Input
                placeholder="Search brain dumps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Filters Row - Stacked on mobile, horizontal on desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              {/* Filter Type */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-medium whitespace-nowrap">
                    Show:
                  </Label>
                </div>
                <div className="flex space-x-1 overflow-x-auto">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'owned', label: 'Owned' },
                    { value: 'shared', label: 'Shared' },
                    { value: 'public', label: 'Public' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilterType(
                          option.value as 'all' | 'owned' | 'shared' | 'public'
                        )
                      }
                      className={`whitespace-nowrap flex-shrink-0 ${
                        filterType === option.value
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Label className="text-sm font-medium whitespace-nowrap">
                  Sort by:
                </Label>
                <div className="flex space-x-1 overflow-x-auto">
                  {[
                    { value: 'updated', label: 'Updated' },
                    { value: 'created', label: 'Created' },
                    { value: 'name', label: 'Name' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSortBy(
                          option.value as 'name' | 'created' | 'updated'
                        )
                      }
                      className={`whitespace-nowrap flex-shrink-0 ${
                        sortBy === option.value
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="text-slate-600 hover:bg-slate-50 border-slate-200 flex-shrink-0"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto py-4 sm:py-6 lg:py-8">
        {brainDumps.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-500 text-base sm:text-lg mb-4">
              No brain dumps yet
            </div>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Create your first brain dump to get started
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Brain Dump
            </Button>
          </div>
        ) : filteredAndSortedBrainDumps.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-500 text-base sm:text-lg mb-4">
              No brain dumps match your filters
            </div>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Try adjusting your search or filter criteria
            </p>
            {(searchQuery || filterType !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                }}
                className="mt-4 w-full sm:w-auto"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAndSortedBrainDumps.map((brainDump) => (
              <Link
                key={brainDump.id}
                href={`/brain-dump/${brainDump.id}`}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer pt-3 pb-0">
                  <CardHeader className="pb-2 px-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm sm:text-base leading-tight flex-1 min-w-0">
                        <span className="line-clamp-1">{brainDump.name}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {brainDump.isPublic && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1 py-0"
                          >
                            Public
                          </Badge>
                        )}
                        {!brainDump.isOwner && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            Shared
                          </Badge>
                        )}
                        {brainDump.isOwner && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openShareDialog(brainDump)
                              }}
                              className="p-1 h-5 w-5 text-slate-400 hover:text-slate-600"
                            >
                              <Share className="w-3 h-3" />
                            </Button>
                            {brainDump.collaboratorCount > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openManageCollaborators(brainDump)
                                }}
                                className="p-1 h-5 w-5 text-slate-400 hover:text-slate-600"
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span className="truncate">{brainDump.ownerName}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>
                          {new Date(brainDump.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Collaborator info - more compact */}
                    <div className="flex items-center justify-between h-4">
                      {brainDump.collaboratorCount > 0 ? (
                        <div className="text-xs text-slate-500">
                          Shared with {brainDump.collaboratorCount} user
                          {brainDump.collaboratorCount === 1 ? '' : 's'}
                        </div>
                      ) : (
                        <div></div>
                      )}

                      <div className="flex justify-end">
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      {/* Manage Collaborators Dialog */}
      <Dialog
        open={manageCollaboratorsOpen}
        onOpenChange={setManageCollaboratorsOpen}
      >
        <DialogContent className="max-w-2xl mx-2 sm:mx-4 lg:mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              Manage Collaborators
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Manage users who have access to &quot;
              {selectedBrainDump?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 max-h-[50vh] overflow-y-auto">
            {loadingCollaborators ? (
              <div className="text-center py-6 text-sm">
                Loading collaborators...
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No collaborators yet. Use the Share button to invite users.
              </div>
            ) : (
              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="p-3 sm:p-4 border rounded-lg bg-gray-50/50 space-y-3"
                  >
                    {/* User Info */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {collaborator.userName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
                          {collaborator.userEmail}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Invited{' '}
                          {new Date(
                            collaborator.invitedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Remove Button - Top Right on Mobile */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCollaboratorToDelete(collaborator)
                          setDeleteConfirmOpen(true)
                        }}
                        className="p-2 h-8 w-8 text-slate-400 hover:text-rose-600 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Permissions - Full Width on Mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                      <div className="text-xs font-medium text-gray-700 sm:hidden">
                        Permissions:
                      </div>

                      <div className="flex items-center space-x-4 sm:space-x-6">
                        {/* Edit Permission */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collaborator.canEdit}
                            disabled={
                              updatingPermissions === collaborator.userId
                            }
                            onChange={(e) =>
                              updateCollaboratorPermissions(
                                collaborator.userId,
                                e.target.checked,
                                collaborator.canVote
                              )
                            }
                            className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                              updatingPermissions === collaborator.userId
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              updatingPermissions === collaborator.userId
                                ? 'opacity-50'
                                : ''
                            }`}
                          >
                            Can Edit
                          </span>
                        </label>

                        {/* Vote Permission */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collaborator.canVote}
                            disabled={
                              updatingPermissions === collaborator.userId
                            }
                            onChange={(e) =>
                              updateCollaboratorPermissions(
                                collaborator.userId,
                                collaborator.canEdit,
                                e.target.checked
                              )
                            }
                            className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                              updatingPermissions === collaborator.userId
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              updatingPermissions === collaborator.userId
                                ? 'opacity-50'
                                : ''
                            }`}
                          >
                            Can Vote
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => setManageCollaboratorsOpen(false)}
              className="w-full sm:w-auto px-6 py-2"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Remove Collaborator
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Are you sure you want to remove{' '}
              <span className="font-medium">{collaboratorToDelete?.userName}</span>{' '}
              from this brain dump? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setCollaboratorToDelete(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (collaboratorToDelete) {
                  removeCollaborator(collaboratorToDelete.userId)
                  setDeleteConfirmOpen(false)
                  setCollaboratorToDelete(null)
                }
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
