import { Request, Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import logger from '@/utils/logger'
import { userSettingsService } from '@/services/userSettingsService'

interface RoadmapItem {
  id: string
  type: 'project' | 'technology'
  name: string
  status: 'not-started' | 'in-progress' | 'completed' | 'paused'
  meta: any
  created_at: string
  updated_at: string
}

export const getRoadmap = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!

    // Get roadmap from user settings
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Sort by created date (newest first)
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    res.json({
      success: true,
      data: {
        items,
        stats: {
          total: items.length,
          inProgress: items.filter(item => item.status === 'in-progress').length,
          completed: items.filter(item => item.status === 'completed').length,
          projects: items.filter(item => item.type === 'project').length,
          technologies: items.filter(item => item.type === 'technology').length
        }
      }
    })
  } catch (error) {
    logger.error('Error fetching roadmap:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmap'
    })
  }
}

export const addRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!
    const { type, name, status = 'not-started', meta = {} } = req.body

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Type and name are required'
      })
    }

    // Get current roadmap
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Create new item
    const newItem: RoadmapItem = {
      id: `roadmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      status,
      meta,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add to roadmap
    items.unshift(newItem)

    // Save updated roadmap
    await userSettingsService.setSetting(userId, 'roadmap', { items })

    res.json({
      success: true,
      data: newItem
    })
  } catch (error) {
    logger.error('Error adding roadmap item:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add roadmap item'
    })
  }
}

export const updateRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!
    const { itemId } = req.params
    const updates = req.body

    // Get current roadmap
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Find and update item
    const itemIndex = items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found'
      })
    }

    // Update item with nested property support
    const updatedItem = { ...items[itemIndex] }
    
    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        // Handle nested properties like 'meta.progress'
        const [parentKey, childKey] = key.split('.')
        if (parentKey && childKey) {
          if (!updatedItem[parentKey as keyof RoadmapItem]) {
            (updatedItem as any)[parentKey] = {}
          }
          ;(updatedItem as any)[parentKey][childKey] = updates[key]
        }
      } else {
        (updatedItem as any)[key] = updates[key]
      }
    })

    updatedItem.updated_at = new Date().toISOString()
    items[itemIndex] = updatedItem as RoadmapItem

    // Save updated roadmap
    await userSettingsService.setSetting(userId, 'roadmap', { items })

    res.json({
      success: true,
      data: updatedItem
    })
  } catch (error) {
    logger.error('Error updating roadmap item:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update roadmap item'
    })
  }
}

export const deleteRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!
    const { itemId } = req.params

    // Get current roadmap
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Filter out the item to delete
    const filteredItems = items.filter(item => item.id !== itemId)

    if (filteredItems.length === items.length) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found'
      })
    }

    // Save updated roadmap
    await userSettingsService.setSetting(userId, 'roadmap', { items: filteredItems })

    res.json({
      success: true,
      message: 'Roadmap item deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting roadmap item:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete roadmap item'
    })
  }
}

export const getRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!
    const { itemId } = req.params

    // Get current roadmap
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Find the item
    const item = items.find(item => item.id === itemId)
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found'
      })
    }

    res.json({
      success: true,
      data: item
    })
  } catch (error) {
    logger.error('Error fetching roadmap item:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmap item'
    })
  }
}

export const updateProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!
    const { itemId } = req.params
    const { progress, milestone, task } = req.body

    // Get current roadmap
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Find item
    const itemIndex = items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found'
      })
    }

    const item = items[itemIndex]
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found'
      })
    }

    // Update progress
    if (progress !== undefined) {
      item.meta.progress = Math.max(0, Math.min(100, progress))
    }

    // Update milestone progress
    if (milestone !== undefined) {
      if (!item.meta.milestones) item.meta.milestones = []
      const milestoneIndex = item.meta.milestones.findIndex((m: any) => m.name === milestone.name)
      if (milestoneIndex !== -1) {
        item.meta.milestones[milestoneIndex] = { ...item.meta.milestones[milestoneIndex], ...milestone }
      }
    }

    // Update task completion
    if (task !== undefined) {
      if (!item.meta.tasks) item.meta.tasks = []
      const taskIndex = item.meta.tasks.findIndex((t: any) => t.id === task.id)
      if (taskIndex !== -1) {
        item.meta.tasks[taskIndex] = { ...item.meta.tasks[taskIndex], ...task }
      }
    }

    // Update status based on progress
    if (item.meta.progress === 100) {
      item.status = 'completed'
    } else if (item.meta.progress > 0 && item.status === 'not-started') {
      item.status = 'in-progress'
    }

    item.updated_at = new Date().toISOString()
    items[itemIndex] = item

    // Save updated roadmap
    await userSettingsService.setSetting(userId, 'roadmap', { items })

    res.json({
      success: true,
      data: item
    })
  } catch (error) {
    logger.error('Error updating progress:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    })
  }
}

export const getProgressStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId } = req.user!

    // Get roadmap
    const roadmapData = await userSettingsService.getSetting(userId, 'roadmap')
    const items: RoadmapItem[] = roadmapData?.items || []

    // Calculate stats
    const totalItems = items.length
    const completedItems = items.filter(item => item.status === 'completed').length
    const inProgressItems = items.filter(item => item.status === 'in-progress').length
    
    const totalProgress = items.reduce((sum, item) => sum + (item.meta?.progress || 0), 0)
    const averageProgress = totalItems > 0 ? Math.round(totalProgress / totalItems) : 0

    // Calculate streak (consecutive days with activity)
    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (!dateStr) break

      const hasActivity = items.some(item => {
        const updatedAt = item.updated_at
        return typeof updatedAt === 'string' && updatedAt.startsWith(dateStr) && item.status === 'in-progress'
      })
      
      if (hasActivity) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    res.json({
      success: true,
      data: {
        totalItems,
        completedItems,
        inProgressItems,
        averageProgress,
        streak,
        completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
      }
    })
  } catch (error) {
    logger.error('Error fetching progress stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress stats'
    })
  }
}
