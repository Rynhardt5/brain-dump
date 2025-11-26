'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, Plus, X, Trash2 } from 'lucide-react'

interface ChecklistItem {
  id: string
  title: string
  isCompleted: boolean
  position: number
}

interface ChecklistSectionProps {
  itemId: string
  checklistItems: ChecklistItem[]
  onUpdate: () => void
  canEdit: boolean
}

export default function ChecklistSection({
  itemId,
  checklistItems,
  onUpdate,
  canEdit,
}: ChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const completedCount = checklistItems.filter(
    (item) => item.isCompleted
  ).length
  const totalCount = checklistItems.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const addChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim()) return

    setLoading('adding')
    try {
      const response = await fetch(`/api/items/${itemId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newItemTitle }),
      })

      if (response.ok) {
        setNewItemTitle('')
        setIsAdding(false)
        onUpdate()
      }
    } catch (error) {
      console.error('Error adding checklist item:', error)
    } finally {
      setLoading(null)
    }
  }

  const toggleChecklistItem = async (
    checklistId: string,
    isCompleted: boolean
  ) => {
    setLoading(checklistId)
    try {
      const response = await fetch(`/api/checklist/${checklistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error)
    } finally {
      setLoading(null)
    }
  }

  const deleteChecklistItem = async (checklistId: string) => {
    setLoading(checklistId)
    try {
      const response = await fetch(`/api/checklist/${checklistId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error)
    } finally {
      setLoading(null)
    }
  }

  const startEditingItem = (checklistId: string, currentTitle: string) => {
    setEditingItem(checklistId)
    setEditingText(currentTitle)
  }

  const saveEditingItem = async (checklistId: string) => {
    if (!editingText.trim()) {
      cancelEditing()
      return
    }

    setLoading(checklistId)
    try {
      const response = await fetch(`/api/checklist/${checklistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingText.trim() }),
      })

      if (response.ok) {
        setEditingItem(null)
        setEditingText('')
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating checklist item:', error)
    } finally {
      setLoading(null)
    }
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setEditingText('')
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">
              {completedCount} of {totalCount} completed
            </span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start space-x-2 group hover:bg-gray-50 p-2 rounded-md -mx-2 transition-colors"
          >
            <button
              onClick={() => toggleChecklistItem(item.id, item.isCompleted)}
              disabled={!canEdit || loading === item.id}
              className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform disabled:opacity-50"
            >
              {item.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {editingItem === item.id ? (
              <Input
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => saveEditingItem(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditingItem(item.id)
                  if (e.key === 'Escape') cancelEditing()
                }}
                className="flex-1 text-sm h-auto py-0 px-1 border-blue-300 focus:ring-blue-500"
                style={{ minHeight: 'auto', lineHeight: '1.25rem' }}
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={() =>
                  canEdit && startEditingItem(item.id, item.title)
                }
                className={`flex-1 text-sm ${
                  item.isCompleted
                    ? 'line-through text-gray-400'
                    : 'text-gray-700'
                } ${
                  canEdit
                    ? 'cursor-text hover:bg-gray-100 rounded px-1 -mx-1'
                    : ''
                }`}
                title={canEdit ? 'Double-click to edit' : ''}
              >
                {item.title}
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => deleteChecklistItem(item.id)}
                disabled={loading === item.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add New Item */}
      {canEdit && (
        <div className="pt-2 border-t">
          {isAdding ? (
            <form
              onSubmit={addChecklistItem}
              className="flex items-center space-x-2"
            >
              <Input
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 text-sm"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newItemTitle.trim() || loading === 'adding'}
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false)
                  setNewItemTitle('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add subtask
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
