'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Plus,
  ArrowLeft,
  Share,
  ChevronUp,
  ChevronDown,
  Filter,
  Edit,
  Check,
  X,
  MessageSquare,
  Trash2,
  Search,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface BrainDumpItem {
  id: string
  title: string
  description: string
  isCompleted: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdByName: string
  avgVotePriority: number
  voteCount: number
  commentCount?: number
}

interface BrainDump {
  id: string
  name: string
  description: string
  isPublic: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
}

interface Comment {
  id: string
  content: string
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt?: string
}

const priorityLabels = {
  1: {
    label: 'Low',
    color: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
  2: {
    label: 'Medium',
    color: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  3: {
    label: 'High',
    color: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
}

export default function BrainDumpPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [brainDump, setBrainDump] = useState<BrainDump | null>(null)
  const [items, setItems] = useState<BrainDumpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  // Quick add item state
  const [quickItemText, setQuickItemText] = useState('')

  // Detect OS for keyboard shortcuts display
  const [isMac, setIsMac] = useState(false)

  // User permissions for this brain dump
  const [userPermissions, setUserPermissions] = useState({
    canEdit: false,
    canVote: false,
    isOwner: false,
  })

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])
  const [quickItemPriority, setQuickItemPriority] = useState(3) // Default to High

  // Filter state
  const [filterPriority, setFilterPriority] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all')

  // Edit item state
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editItemText, setEditItemText] = useState('')

  // Comments state
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null)

  // Brain dump editing state
  const [editingBrainDump, setEditingBrainDump] = useState(false)
  const [editBrainDumpName, setEditBrainDumpName] = useState('')
  const [editBrainDumpDescription, setEditBrainDumpDescription] = useState('')

  // Delete confirmation state
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [deleteBrainDumpDialogOpen, setDeleteBrainDumpDialogOpen] =
    useState(false)

  const [shareEmail, setShareEmail] = useState('')
  const [sharePermissions, setSharePermissions] = useState({
    canEdit: false,
    canVote: true,
  })

  // Animation state
  const [stagingItem, setStagingItem] = useState<BrainDumpItem | null>(null)
  const [isStaging, setIsStaging] = useState(false)

  const brainDumpId = params.id as string

  const fetchBrainDump = useCallback(async () => {
    try {
      const response = await fetch(`/api/brain-dumps/${brainDumpId}`)
      if (response.ok) {
        const data = await response.json()
        setBrainDump(data.brainDump)

        // Set user permissions based on brain dump data
        if (user && data.brainDump.ownerId === (user as any).id) {
          setUserPermissions({
            canEdit: true,
            canVote: true,
            isOwner: true,
          })
        } else if (user) {
          // For authenticated users on shared brain dumps, fetch specific permissions
          const permResponse = await fetch(
            `/api/brain-dumps/${brainDumpId}/permissions`
          )
          if (permResponse.ok) {
            const permData = await permResponse.json()
            setUserPermissions({
              canEdit: permData.canEdit || false,
              canVote: permData.canVote || false,
              isOwner: false,
            })
          } else {
            // If permissions fetch fails, default to view-only for public brain dumps
            setUserPermissions({
              canEdit: false,
              canVote: data.brainDump.isPublic,
              isOwner: false,
            })
          }
        } else {
          // For unauthenticated users, only allow viewing public brain dumps
          setUserPermissions({
            canEdit: false,
            canVote: false,
            isOwner: false,
          })
        }
      } else if (response.status === 404) {
        // If brain dump not found, show error instead of redirecting
        setBrainDump(null)
      } else if (response.status === 401) {
        // If unauthorized (unauthenticated user trying to access private brain dump)
        // Redirect to sign in page
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Error fetching brain dump:', error)
    } finally {
      setLoading(false)
    }
  }, [brainDumpId, user, router])

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/brain-dumps/${brainDumpId}/items`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }, [brainDumpId])

  useEffect(() => {
    fetchBrainDump()
    fetchItems()
  }, [fetchBrainDump, fetchItems])

  // Quick add item function
  const quickAddItem = async (e: React.FormEvent, priority?: number) => {
    e.preventDefault()
    if (!quickItemText.trim()) return

    const itemPriority = priority || quickItemPriority

    try {
      const response = await fetch(`/api/brain-dumps/${brainDumpId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickItemText,
          description: '',
          priority: itemPriority,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newItem = data.item

        // Stage the item at the top first
        setStagingItem(newItem)
        setIsStaging(true)
        setQuickItemText('')
        setQuickItemPriority(3) // Reset to High priority

        // After 1.5 seconds, move it to the sorted list
        setTimeout(() => {
          setItems([...items, newItem])
          setStagingItem(null)
          setIsStaging(false)
        }, 1500)
      }
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  // Complete item function
  const toggleCompleteItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(
        `/api/brain-dumps/${brainDumpId}/items/${itemId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCompleted: !isCompleted }),
        }
      )

      if (response.ok) {
        setItems(
          items.map((item) =>
            item.id === itemId ? { ...item, isCompleted: !isCompleted } : item
          )
        )
      }
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  // Edit item function
  const updateItem = async (itemId: string, newTitle: string) => {
    try {
      const response = await fetch(
        `/api/brain-dumps/${brainDumpId}/items/${itemId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        }
      )

      if (response.ok) {
        setItems(
          items.map((item) =>
            item.id === itemId ? { ...item, title: newTitle } : item
          )
        )
        setEditingItem(null)
        setEditItemText('')
      }
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  // Start editing
  const startEditing = (item: BrainDumpItem) => {
    setEditingItem(item.id)
    setEditItemText(item.title)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null)
    setEditItemText('')
  }

  // Fetch comments for an item
  const fetchComments = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  // Add comment
  const addComment = async (itemId: string, content: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        setNewComment('')

        // Update the item's comment count locally to avoid refetching
        setItems(
          items.map((item) =>
            item.id === itemId
              ? { ...item, commentCount: (item.commentCount || 0) + 1 }
              : item
          )
        )
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Start editing comment
  const startEditingComment = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditCommentText(comment.content)
  }

  // Cancel editing comment
  const cancelEditingComment = () => {
    setEditingComment(null)
    setEditCommentText('')
  }

  // Update comment
  const updateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? { ...comment, content: data.comment.content }
              : comment
          )
        )
        setEditingComment(null)
        setEditCommentText('')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  // Open delete comment dialog
  const openDeleteCommentDialog = (comment: Comment) => {
    setCommentToDelete(comment)
    setDeleteCommentDialogOpen(true)
  }

  // Delete comment
  const deleteComment = async () => {
    if (!commentToDelete) return

    try {
      const response = await fetch(`/api/comments/${commentToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(
          comments.filter((comment) => comment.id !== commentToDelete.id)
        )

        // Update the item's comment count locally if we know which item it belongs to
        if (selectedItem) {
          setItems(
            items.map((item) =>
              item.id === selectedItem
                ? {
                    ...item,
                    commentCount: Math.max((item.commentCount || 1) - 1, 0),
                  }
                : item
            )
          )
        }

        // Close dialog and reset state
        setDeleteCommentDialogOpen(false)
        setCommentToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  // Handle item selection for comments
  const handleItemSelect = (itemId: string) => {
    if (selectedItem === itemId) {
      setSelectedItem(null)
      setComments([])
    } else {
      setSelectedItem(itemId)
      fetchComments(itemId)
    }
  }

  // Brain dump editing functions
  const startEditingBrainDump = () => {
    if (brainDump) {
      setEditBrainDumpName(brainDump.name)
      setEditBrainDumpDescription(brainDump.description || '')
      setEditingBrainDump(true)
    }
  }

  const cancelEditingBrainDump = () => {
    setEditingBrainDump(false)
    setEditBrainDumpName('')
    setEditBrainDumpDescription('')
  }

  const updateBrainDump = async () => {
    if (!editBrainDumpName.trim()) return

    try {
      const response = await fetch(`/api/brain-dumps/${brainDumpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editBrainDumpName.trim(),
          description: editBrainDumpDescription.trim() || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setBrainDump(data.brainDump)
        setEditingBrainDump(false)
        setEditBrainDumpName('')
        setEditBrainDumpDescription('')
      }
    } catch (error) {
      console.error('Error updating brain dump:', error)
    }
  }

  const deleteBrainDump = async () => {
    try {
      const response = await fetch(`/api/brain-dumps/${brainDumpId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting brain dump:', error)
    }
  }

  // Item deletion functions
  const openDeleteItemDialog = (itemId: string) => {
    setItemToDelete(itemId)
    setDeleteItemDialogOpen(true)
  }

  const closeDeleteItemDialog = () => {
    setItemToDelete(null)
    setDeleteItemDialogOpen(false)
  }

  const deleteItem = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/items/${itemToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems(items.filter((item) => item.id !== itemToDelete))
        closeDeleteItemDialog()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const sharebrainDump = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/brain-dumps/${brainDumpId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, ...sharePermissions }),
      })

      if (response.ok) {
        setShareEmail('')
        setShareDialogOpen(false)
        alert('Brain dump shared successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to share brain dump')
      }
    } catch (error) {
      console.error('Error sharing brain dump:', error)
    }
  }

  const voteOnItem = async (itemId: string, priority: number) => {
    try {
      const response = await fetch(`/api/items/${itemId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })

      if (response.ok) {
        // Refresh items to get updated vote counts
        fetchItems()
      }
    } catch (error) {
      console.error('Error voting on item:', error)
    }
  }

  const getPriorityScore = (item: BrainDumpItem) => {
    if (item.voteCount > 0) {
      return Number(item.avgVotePriority)
    }
    return 2 // Default to medium priority if no votes
  }

  // Helper function to check date filter
  const isWithinDateRange = (dateString: string) => {
    const itemDate = new Date(dateString)
    const now = new Date()

    switch (dateFilter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return itemDate >= weekAgo
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return itemDate >= monthAgo
      default:
        return true
    }
  }

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      // Priority filter
      if (
        filterPriority !== null &&
        Math.round(getPriorityScore(item)) !== filterPriority
      ) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(query)
        const matchesDescription = item.description
          ?.toLowerCase()
          .includes(query)
        if (!matchesTitle && !matchesDescription) {
          return false
        }
      }

      // Date filter
      if (!isWithinDateRange(item.createdAt)) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // 1. Completed items go to the bottom
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1
      }

      // 2. For non-completed items, sort by creation date (oldest first)
      const dateDiff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (dateDiff !== 0) {
        return dateDiff
      }

      // 3. Within same date, sort by priority (highest to lowest)
      const priorityDiff = getPriorityScore(b) - getPriorityScore(a)
      return priorityDiff
    })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!brainDump) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Brain dump not found</div>
      </div>
    )
  }

  const isOwner = brainDump.ownerId === (user as any)?.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <span className="hidden sm:inline">Sign In</span>
                    <span className="sm:hidden">Sign In</span>
                  </Button>
                </Link>
              )}
              <div className="min-w-0 flex-1">
                {editingBrainDump ? (
                  <div className="space-y-3">
                    <Input
                      value={editBrainDumpName}
                      onChange={(e) => setEditBrainDumpName(e.target.value)}
                      className="text-xl sm:text-2xl font-bold border-none px-0 focus:ring-0 focus:border-none"
                      placeholder="Brain dump name..."
                    />
                    <Textarea
                      value={editBrainDumpDescription}
                      onChange={(e) =>
                        setEditBrainDumpDescription(e.target.value)
                      }
                      className="text-sm sm:text-base border-none px-0 focus:ring-0 focus:border-none resize-none"
                      placeholder="Description (optional)..."
                      rows={2}
                    />
                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" onClick={updateBrainDump}>
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingBrainDump}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-3">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                        {brainDump?.name}
                      </h1>
                      {/* Permissions Indicator */}
                      {!userPermissions.isOwner && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {userPermissions.canEdit ? 'Can Edit' : 'View Only'}
                          </Badge>
                          {userPermissions.canVote && (
                            <Badge variant="secondary" className="text-xs">
                              Can Vote
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {brainDump?.description && (
                      <p className="text-sm sm:text-base text-gray-600 mt-1">
                        {brainDump.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {isOwner && !editingBrainDump && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingBrainDump}
                    className="text-slate-600 hover:text-slate-700"
                  >
                    <Edit className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteBrainDumpDialogOpen(true)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </>
              )}
              {isOwner && (
                <Dialog
                  open={shareDialogOpen}
                  onOpenChange={setShareDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Brain Dump</DialogTitle>
                      <DialogDescription>
                        Share this brain dump with another user.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={sharebrainDump} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">User Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter user email"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="canEdit"
                            checked={sharePermissions.canEdit}
                            onChange={(e) =>
                              setSharePermissions({
                                ...sharePermissions,
                                canEdit: e.target.checked,
                              })
                            }
                          />
                          <Label htmlFor="canEdit">Can edit items</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="canVote"
                            checked={sharePermissions.canVote}
                            onChange={(e) =>
                              setSharePermissions({
                                ...sharePermissions,
                                canVote: e.target.checked,
                              })
                            }
                          />
                          <Label htmlFor="canVote">
                            Can vote on priorities
                          </Label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Delete Item Confirmation Dialog */}
      <Dialog
        open={deleteItemDialogOpen}
        onOpenChange={setDeleteItemDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={closeDeleteItemDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteItem}>
              Delete Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Brain Dump Confirmation Dialog */}
      <Dialog
        open={deleteBrainDumpDialogOpen}
        onOpenChange={setDeleteBrainDumpDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brain Dump</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entire brain dump? This will
              permanently delete all items and comments. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteBrainDumpDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteBrainDumpDialogOpen(false)
                deleteBrainDump()
              }}
            >
              Delete Brain Dump
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog
        open={deleteCommentDialogOpen}
        onOpenChange={setDeleteCommentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteCommentDialogOpen(false)
                setCommentToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteComment}>
              Delete Comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign In Banner for unauthenticated users */}
      {!user && brainDump?.isPublic && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Viewing as guest.</span> Sign
                    in to add items, vote on priorities, and collaborate.
                  </p>
                </div>
              </div>
              <Link href="/auth/signin">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Item Bar - Only show if user can edit */}
      {userPermissions.canEdit && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-2">
              {/* Input and Buttons Row */}
              <div className="flex sm:flex-row flex-col sm:items-center gap-4 items-start">
                <div className="flex-1 w-full">
                  <Input
                    type="text"
                    placeholder="Add a new item..."
                    value={quickItemText}
                    onChange={(e) => setQuickItemText(e.target.value)}
                    className="w-full"
                    onKeyDown={(e) => {
                      if (quickItemText.trim()) {
                        // Handle Enter for default medium priority
                        if (
                          e.key === 'Enter' &&
                          !e.shiftKey &&
                          !e.ctrlKey &&
                          !e.altKey &&
                          !e.metaKey
                        ) {
                          e.preventDefault()
                          quickAddItem(e as React.FormEvent, 2) // Medium priority (default)
                        }
                        // Handle Cmd/Ctrl + number for priority shortcuts
                        else if (
                          (e.metaKey || e.ctrlKey) &&
                          (e.code === 'Digit1' ||
                            e.code === 'Digit2' ||
                            e.code === 'Digit3')
                        ) {
                          e.preventDefault()
                          if (e.code === 'Digit1') {
                            quickAddItem(e as React.FormEvent, 3) // High priority
                          } else if (e.code === 'Digit2') {
                            quickAddItem(e as React.FormEvent, 2) // Medium priority
                          } else if (e.code === 'Digit3') {
                            quickAddItem(e as React.FormEvent, 1) // Low priority
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium whitespace-nowrap">
                    Add as:
                  </Label>
                  <div className="flex space-x-1">
                    {[3, 2, 1].map((priority) => (
                      <Button
                        key={priority}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (quickItemText.trim()) {
                            quickAddItem(
                              { preventDefault: () => {} } as React.FormEvent,
                              priority
                            )
                          }
                        }}
                        disabled={!quickItemText.trim()}
                        className={`${
                          priorityLabels[
                            priority as keyof typeof priorityLabels
                          ].color
                        } hover:opacity-80 disabled:opacity-50 flex-1 sm:flex-none`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        <span className="sm:inline">
                          {
                            priorityLabels[
                              priority as keyof typeof priorityLabels
                            ].label
                          }
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keyboard Tips - Desktop Only */}
              <div className="hidden lg:block">
                <div className="text-xs text-gray-500">
                  💡 Tip:{' '}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    Enter
                  </kbd>{' '}
                  for medium,{' '}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    {isMac ? '⌘' : '⊞'}+1
                  </kbd>{' '}
                  for high,{' '}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    {isMac ? '⌘' : '⊞'}+2
                  </kbd>{' '}
                  for medium,{' '}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                    {isMac ? '⌘' : '⊞'}+3
                  </kbd>{' '}
                  for low priority
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-medium whitespace-nowrap">
                Date:
              </Label>
              <div className="flex space-x-1">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDateFilter(
                        option.value as 'all' | 'today' | 'week' | 'month'
                      )
                    }
                    className={`whitespace-nowrap ${
                      dateFilter === option.value
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-medium whitespace-nowrap">
                Priority:
              </Label>
            </div>
            <div className="flex space-x-1 overflow-x-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterPriority(null)}
                className={`whitespace-nowrap ${
                  filterPriority === null
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </Button>
              {[3, 2, 1].map((priority) => (
                <Button
                  key={priority}
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterPriority(priority)}
                  className={`whitespace-nowrap ${
                    filterPriority === priority
                      ? priorityLabels[priority as keyof typeof priorityLabels]
                          .color
                      : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className=" sm:inline">
                    {
                      priorityLabels[priority as keyof typeof priorityLabels]
                        .label
                    }
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-500 text-base sm:text-lg mb-4">
              {items.length === 0
                ? 'No items yet'
                : 'No items match your filters'}
            </div>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              {items.length === 0
                ? 'Add your first item using the bar above'
                : 'Try adjusting your search, date, or priority filters'}
            </p>
            {(searchQuery ||
              dateFilter !== 'all' ||
              filterPriority !== null) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setDateFilter('all')
                  setFilterPriority(null)
                }}
                className="mt-4"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Staging Area - New item appears here first */}
            <AnimatePresence>
              {stagingItem && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.4, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    y: 20,
                    scale: 0.95,
                    transition: { duration: 0.3 },
                  }}
                  className="relative"
                >
                  {/* Subtle staging indicator */}
                  <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-blue-50 rounded-lg border border-blue-200" />
                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-medium z-10 opacity-90">
                    New
                  </div>
                  <Card
                    className={`relative bg-white border-blue-100 gap-1 p-3 ${
                      stagingItem.isCompleted ? 'opacity-60' : ''
                    } ${
                      selectedItem === stagingItem.id
                        ? 'ring-2 ring-purple-200 border-purple-200'
                        : ''
                    }`}
                  >
                    <CardHeader className="pb-3 px-1">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-2">
                            <CardTitle className="text-base sm:text-lg leading-tight text-gray-900">
                              {stagingItem.title}
                            </CardTitle>
                            {stagingItem.description && (
                              <CardDescription className="mt-1 text-sm">
                                {stagingItem.description}
                              </CardDescription>
                            )}
                          </div>

                          {/* Mobile Priority Badge - Right side */}
                          <div className="sm:hidden flex-shrink-0">
                            <Badge
                              className={`text-xs ${
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(stagingItem)
                                  ) as keyof typeof priorityLabels
                                ].color
                              }`}
                            >
                              {
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(stagingItem)
                                  ) as keyof typeof priorityLabels
                                ].label
                              }
                              {stagingItem.voteCount &&
                                stagingItem.voteCount > 0 && (
                                  <span className="ml-1">
                                    ({stagingItem.voteCount} vote
                                    {stagingItem.voteCount <= 1 ? '' : 's'})
                                  </span>
                                )}
                            </Badge>
                          </div>

                          {/* Desktop Priority Badges - Top Right */}
                          <div className="hidden sm:flex items-center space-x-2 ml-4 flex-shrink-0">
                            <Badge
                              className={`text-xs ${
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(stagingItem)
                                  ) as keyof typeof priorityLabels
                                ].color
                              }`}
                            >
                              {
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(stagingItem)
                                  ) as keyof typeof priorityLabels
                                ].label
                              }
                            </Badge>
                            {stagingItem.voteCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {stagingItem.voteCount} vote
                                {stagingItem.voteCount <= 1 ? '' : 's'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-1">
                      {/* Mobile-First Layout */}
                      <div className="space-y-3">
                        {/* Meta Info */}
                        <div className="text-xs sm:text-sm text-gray-500">
                          <span className="hidden sm:inline">
                            Created by{' '}
                            <span className="font-medium">
                              {stagingItem.createdByName}
                            </span>{' '}
                            on{' '}
                            {new Date(stagingItem.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                            {stagingItem.updatedAt !==
                              stagingItem.createdAt && (
                              <span className="ml-2">
                                • Last updated{' '}
                                {new Date(
                                  stagingItem.updatedAt
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </span>
                          <span className="sm:hidden">
                            {stagingItem.createdByName} •{' '}
                            {new Date(
                              stagingItem.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Action Row - Responsive Design */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                          {/* Left Actions */}
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                toggleCompleteItem(
                                  stagingItem.id,
                                  stagingItem.isCompleted
                                )
                              }
                              className={`p-2 sm:px-3 ${
                                stagingItem.isCompleted
                                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <Check className="w-4 h-4 sm:mr-2" />
                              <span className=" sm:inline">
                                {stagingItem.isCompleted
                                  ? 'Completed'
                                  : 'Mark Complete'}
                              </span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(stagingItem)}
                              className="p-2 sm:px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-700"
                            >
                              <Edit className="w-4 h-4 sm:mr-2" />
                              <span className=" sm:inline">Edit</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleItemSelect(stagingItem.id)}
                              className="p-2 sm:px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-700 relative"
                            >
                              <MessageSquare className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">
                                Comments
                                {stagingItem.commentCount &&
                                stagingItem.commentCount > 0
                                  ? ` (${stagingItem.commentCount})`
                                  : ''}
                              </span>
                              {/* Comment indicator dot - Mobile only */}
                              {stagingItem.commentCount &&
                                stagingItem.commentCount > 0 && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-400 rounded-full sm:hidden"></div>
                                )}
                            </Button>

                            {/* Delete button - only show for item owners or brain dump owners */}
                            {(stagingItem.createdById === (user as any)?.id ||
                              isOwner) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  openDeleteItemDialog(stagingItem.id)
                                }
                                className="p-2 sm:px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
                          </div>

                          {/* Priority Voting - Enhanced for Desktop - Only show if user can vote */}
                          {userPermissions.canVote && (
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span className="text-xs text-gray-500 mr-2 hidden sm:inline">
                                Vote Priority:
                              </span>
                              <div className="flex items-center space-x-1 sm:space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-1 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => voteOnItem(stagingItem.id, 3)}
                                  className="flex-1 sm:flex-none p-1.5 sm:px-3 text-rose-700 hover:bg-rose-50 hover:text-rose-800 rounded"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className=" sm:inline text-xs">
                                    High
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => voteOnItem(stagingItem.id, 2)}
                                  className="flex-1 sm:flex-none p-1.5 sm:px-3 text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className=" sm:inline text-xs">
                                    Medium
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => voteOnItem(stagingItem.id, 1)}
                                  className="flex-1 sm:flex-none p-1.5 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded"
                                >
                                  <ChevronDown className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className=" sm:inline text-xs">
                                    Low
                                  </span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      {selectedItem === stagingItem.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Comments</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedItem(null)
                                setComments([])
                              }}
                              className="p-1 h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3 mb-4">
                            {comments.length === 0 ? (
                              <p className="text-gray-500 text-sm">
                                No comments yet. Be the first to comment!
                              </p>
                            ) : (
                              comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-gray-50 rounded-lg p-3"
                                >
                                  {/* Comment content would go here - same as regular items */}
                                </div>
                              ))
                            )}
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              if (newComment.trim()) {
                                addComment(stagingItem.id, newComment.trim())
                              }
                            }}
                            className="flex space-x-2"
                          >
                            <Input
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!newComment.trim()}
                            >
                              Comment
                            </Button>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Regular items list with animations */}
            <AnimatePresence mode="popLayout">
              {filteredAndSortedItems.map((item: BrainDumpItem, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.3,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                >
                  <Card
                    key={item.id}
                    className={`${item.isCompleted ? 'opacity-60' : ''} ${
                      selectedItem === item.id
                        ? 'ring-2 ring-purple-200 border-purple-200'
                        : ''
                    } gap-1 p-3`}
                  >
                    <CardHeader className="pb-3 px-1">
                      <div className="space-y-2">
                        {/* Title Row - Mobile: Title + Priority, Desktop: Title + Badges */}
                        <div className="flex justify-between items-start">
                          {/* Title and Edit Mode */}
                          <div className="flex-1 min-w-0 pr-2">
                            {editingItem === item.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editItemText}
                                  onChange={(e) =>
                                    setEditItemText(e.target.value)
                                  }
                                  className="flex-1 min-h-[80px] resize-none"
                                  placeholder="Edit item title and description..."
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === 'Enter' &&
                                      (e.ctrlKey || e.metaKey)
                                    ) {
                                      updateItem(item.id, editItemText)
                                    } else if (e.key === 'Escape') {
                                      cancelEditing()
                                    }
                                  }}
                                />
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      updateItem(item.id, editItemText)
                                    }
                                    className="px-3"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                    className="px-3"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <span className="text-xs text-gray-500 ml-auto">
                                    Ctrl+Enter to save, Esc to cancel
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <CardTitle
                                className={`text-base sm:text-lg leading-tight ${
                                  item.isCompleted
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-900'
                                }`}
                              >
                                {item.title}
                              </CardTitle>
                            )}
                            {item.description && (
                              <CardDescription className="mt-1 text-sm">
                                {item.description}
                              </CardDescription>
                            )}
                          </div>

                          {/* Mobile Priority Badge - Right side */}
                          <div className="sm:hidden flex-shrink-0">
                            <Badge
                              className={`text-xs ${
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(item)
                                  ) as keyof typeof priorityLabels
                                ].color
                              }`}
                            >
                              {
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(item)
                                  ) as keyof typeof priorityLabels
                                ].label
                              }
                              {item.voteCount && item.voteCount > 0 && (
                                <span className="ml-1">
                                  ({item.voteCount} vote
                                  {item.voteCount <= 1 ? '' : 's'})
                                </span>
                              )}
                            </Badge>
                          </div>

                          {/* Desktop Priority Badges - Top Right */}
                          <div className="hidden sm:flex items-center space-x-2 ml-4 flex-shrink-0">
                            <Badge
                              className={`text-xs ${
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(item)
                                  ) as keyof typeof priorityLabels
                                ].color
                              }`}
                            >
                              {
                                priorityLabels[
                                  Math.round(
                                    getPriorityScore(item)
                                  ) as keyof typeof priorityLabels
                                ].label
                              }
                            </Badge>
                            {item.voteCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {item.voteCount} vote
                                {item.voteCount <= 1 ? '' : 's'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-1">
                      {/* Mobile-First Layout */}
                      <div className="space-y-3">
                        {/* Meta Info */}
                        <div className="text-xs sm:text-sm text-gray-500">
                          <span className="hidden sm:inline">
                            Created by{' '}
                            <span className="font-medium">
                              {item.createdByName}
                            </span>{' '}
                            on{' '}
                            {new Date(item.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                            {item.updatedAt !== item.createdAt && (
                              <span className="ml-2">
                                • Last updated{' '}
                                {new Date(item.updatedAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}
                              </span>
                            )}
                          </span>
                          <span className="sm:hidden">
                            {item.createdByName} •{' '}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Action Row - Responsive Design */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                          {/* Left Actions */}
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                toggleCompleteItem(item.id, item.isCompleted)
                              }
                              className={`p-2 sm:px-3 ${
                                item.isCompleted
                                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <Check className="w-4 h-4 sm:mr-2" />
                              <span className=" sm:inline">
                                {item.isCompleted
                                  ? 'Completed'
                                  : 'Mark Complete'}
                              </span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(item)}
                              className="p-2 sm:px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-700"
                            >
                              <Edit className="w-4 h-4 sm:mr-2" />
                              <span className=" sm:inline">Edit</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleItemSelect(item.id)}
                              className="p-2 sm:px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-700 relative"
                            >
                              <MessageSquare className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">
                                Comments
                                {item.commentCount && item.commentCount > 0
                                  ? ` (${item.commentCount})`
                                  : ''}
                              </span>
                              {/* Comment indicator dot - Mobile only */}
                              {item.commentCount && item.commentCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-400 rounded-full sm:hidden"></div>
                              )}
                            </Button>

                            {/* Delete button - only show for item owners or brain dump owners */}
                            {(item.createdById === (user as any)?.id ||
                              isOwner) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDeleteItemDialog(item.id)}
                                className="p-2 sm:px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
                          </div>

                          {/* Priority Voting - Enhanced for Desktop - Only show if user can vote */}
                          {userPermissions.canVote && (
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span className="text-xs text-gray-500 mr-2 hidden sm:inline">
                                Vote Priority:
                              </span>
                              <div className="flex items-center space-x-1 sm:space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-1 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => voteOnItem(item.id, 3)}
                                  className="flex-1 sm:flex-none p-1.5 sm:px-3 text-rose-700 hover:bg-rose-50 hover:text-rose-800 rounded"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className=" sm:inline text-xs">
                                    High
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => voteOnItem(item.id, 2)}
                                  className="flex-1 sm:flex-none p-1.5 sm:px-3 text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className=" sm:inline text-xs">
                                    Medium
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => voteOnItem(item.id, 1)}
                                  className="flex-1 sm:flex-none p-1.5 sm:px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded"
                                >
                                  <ChevronDown className="w-3.5 h-3.5 sm:mr-1" />
                                  <span className=" sm:inline text-xs">
                                    Low
                                  </span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      {selectedItem === item.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Comments</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedItem(null)
                                setComments([])
                              }}
                              className="p-1 h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3 mb-4">
                            {comments.length === 0 ? (
                              <p className="text-gray-500 text-sm">
                                No comments yet. Be the first to comment!
                              </p>
                            ) : (
                              comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-gray-50 rounded-lg p-3"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">
                                      {comment.createdByName}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          comment.createdAt
                                        ).toLocaleDateString()}
                                        {comment.updatedAt &&
                                          comment.updatedAt !==
                                            comment.createdAt && (
                                            <span className="ml-1 text-gray-400">
                                              (edited)
                                            </span>
                                          )}
                                      </span>
                                      {/* Edit/Delete buttons for comment owner */}
                                      {comment.createdById ===
                                        (user as any)?.id && (
                                        <div className="flex items-center space-x-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              startEditingComment(comment)
                                            }
                                            className="p-1 h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              openDeleteCommentDialog(comment)
                                            }
                                            className="p-1 h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Comment content - editable if editing */}
                                  {editingComment === comment.id ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={editCommentText}
                                        onChange={(e) =>
                                          setEditCommentText(e.target.value)
                                        }
                                        className="text-sm"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            updateComment(
                                              comment.id,
                                              editCommentText
                                            )
                                          } else if (e.key === 'Escape') {
                                            cancelEditingComment()
                                          }
                                        }}
                                      />
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            updateComment(
                                              comment.id,
                                              editCommentText
                                            )
                                          }
                                          className="h-7 px-2 text-xs"
                                        >
                                          <Check className="w-3 h-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={cancelEditingComment}
                                          className="h-7 px-2 text-xs"
                                        >
                                          <X className="w-3 h-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm">{comment.content}</p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              if (newComment.trim()) {
                                addComment(item.id, newComment.trim())
                              }
                            }}
                            className="flex space-x-2"
                          >
                            <Input
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!newComment.trim()}
                            >
                              Comment
                            </Button>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
