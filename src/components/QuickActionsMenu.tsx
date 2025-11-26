'use client'

import { MoreVertical, Edit, Trash2, Check, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface QuickActionsMenuProps {
  isCompleted: boolean
  canEdit: boolean
  onToggleComplete: () => void
  onEdit: () => void
  onDelete: () => void
  onViewComments: () => void
  commentCount?: number
}

export default function QuickActionsMenu({
  isCompleted,
  canEdit,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewComments,
  commentCount = 0,
}: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onToggleComplete}>
          <Check className="mr-2 h-4 w-4" />
          <span>{isCompleted ? 'Mark Incomplete' : 'Mark Complete'}</span>
        </DropdownMenuItem>

        {canEdit && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onViewComments}>
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>
            Comments
            {commentCount > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                {commentCount}
              </span>
            )}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
