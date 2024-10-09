'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { nanoid } from 'nanoid'
import { Plus, X, Edit2, Check, AlertTriangle, Lock, Sun, Moon, Zap, User, Sparkles, Calendar, Clock, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import Particles from "react-particles"
import { loadSlim } from "tsparticles-slim"
import type { Engine } from "tsparticles-engine"
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Todo = {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high'
  category: 'work' | 'personal' | 'health' | 'finance'
  progress: number
  subtasks: { id: string; title: string; completed: boolean }[]
  dueDate: Date | null
  tags: string[]
}

const statusColors = {
  pending: 'bg-yellow-500',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
  blocked: 'bg-red-500',
}

const priorityColors = {
  low: 'bg-gray-400',
  medium: 'bg-orange-400',
  high: 'bg-red-400',
}

const categoryIcons = {
  work: '💼',
  personal: '🏠',
  health: '🏋️‍♂️',
  finance: '💰',
}

const AnimatedBorder = ({ children }) => (
  <div className="relative p-1 overflow-hidden rounded-lg">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 animate-gradient"></div>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 animate-gradient"
      animate={{
        rotate: [0, 360],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
    ></motion.div>
    <div className="relative bg-gray-900 rounded-lg">{children}</div>
  </div>
)

const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function LaknicekTodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'blocked'>('all')
  const { theme, setTheme } = useTheme()
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showAdminDialog, setShowAdminDialog] = useState(false)

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos, (key, value) => {
          if (key === 'dueDate' && value) return new Date(value)
          return value
        })
        setTodos(Array.isArray(parsedTodos) ? parsedTodos : [])
      } catch (error) {
        console.error('Error parsing todos from localStorage:', error)
        setTodos([])
      }
    }
    setTheme('dark')
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const addTodo = () => {
    if (newTodo.trim() !== '' && isAdmin) {
      setTodos(prevTodos => [
        ...prevTodos,
        {
          id: nanoid(),
          title: newTodo,
          status: 'pending',
          priority: 'medium',
          category: 'personal',
          progress: 0,
          subtasks: [],
          dueDate: null,
          tags: [],
        },
      ])
      setNewTodo('')
    }
  }

  const deleteTodo = (id: string) => {
    setTodos(prevTodos => prevTodos.filter((todo) => todo.id !== id))
  }

  const startEditing = (id: string, title: string) => {
    setEditingId(id)
    setEditingTitle(title)
  }

  const saveEdit = () => {
    setTodos(prevTodos =>
      prevTodos.map((todo) => (todo.id === editingId ? { ...todo, title: editingTitle } : todo))
    )
    setEditingId(null)
  }

  const updateTodoStatus = (id: string, status: Todo['status']) => {
    setTodos(prevTodos => prevTodos.map((todo) => (todo.id === id ? { ...todo, status } : todo)))
  }

  const updateTodoPriority = (id: string, priority: Todo['priority']) => {
    setTodos(prevTodos => prevTodos.map((todo) => (todo.id === id ? { ...todo, priority } : todo)))
  }

  const updateTodoCategory = (id: string, category: Todo['category']) => {
    setTodos(prevTodos => prevTodos.map((todo) => (todo.id === id ? { ...todo, category } : todo)))
  }

  const updateTodoProgress = (id: string, progress: number) => {
    setTodos(prevTodos => prevTodos.map((todo) => (todo.id === id ? { ...todo, progress } : todo)))
  }

  const addSubtask = (todoId: string, newSubtask: string) => {
    if (newSubtask.trim() !== '' && isAdmin) {
      setTodos(prevTodos => prevTodos.map((todo) => 
        todo.id === todoId 
          ? { ...todo, subtasks: [...(todo.subtasks || []), { id: nanoid(), title: newSubtask, completed: false }] }
          : todo
      ))
    }
  }

  const toggleSubtask = (todoId: string, subtaskId: string) => {
    if (isAdmin) {
      setTodos(prevTodos => prevTodos.map((todo) => 
        todo.id === todoId 
          ? { ...todo, subtasks: (todo.subtasks || []).map((subtask) => 
              subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
            )}
          : todo
      ))
    }
  }

  const updateTodoDueDate = (id: string, date: Date | null) => {
    setTodos(prevTodos => prevTodos.map((todo) => (todo.id === id ? { ...todo, dueDate: date } : todo)))
  }

  const addTag = (todoId: string, newTag: string) => {
    if (newTag.trim() !== '' && isAdmin) {
      setTodos(prevTodos => prevTodos.map((todo) => 
        todo.id === todoId 
          ? { ...todo, tags: [...(todo.tags || []), newTag.trim()] }
          : todo
      ))
    }
  }

  const removeTag = (todoId: string, tagToRemove: string) => {
    if (isAdmin) {
      setTodos(prevTodos => prevTodos.map((todo) => 
        todo.id === todoId 
          ? { ...todo, tags: (todo.tags || []).filter(tag => tag !== tagToRemove) }
          : todo
      ))
    }
  }

  const onDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(todos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setTodos(items)
  }

  const filteredTodos = todos.filter((todo) => filter === 'all' || todo.status === filter)

  const handleAdminLogin = () => {
    if (username === 'lakky' && password === 'lakky1234!@#$') {
      setIsAdmin(true)
      setShowAdminDialog(false)
    } else {
      alert('Invalid credentials')
    }
  }

  const TodoItem = ({ todo, index }: { todo: Todo; index: number }) => {
    const [showMore, setShowMore] = useState(false)
    const [localNewSubtask, setLocalNewSubtask] = useState('')
    const [localNewTag, setLocalNewTag] = useState('')
    const debouncedUpdateProgress = useRef(debounce((id: string, progress: number) => updateTodoProgress(id, progress), 500)).current

    const handleAddSubtask = () => {
      if (localNewSubtask.trim() !== '' && isAdmin) {
        addSubtask(todo.id, localNewSubtask)
        setLocalNewSubtask('')
      }
    }

    const handleAddTag = () => {
      if (localNewTag.trim() !== '' && isAdmin) {
        addTag(todo.id, localNewTag)
        setLocalNewTag('')
      }
    }

    return (
      <Draggable draggableId={todo.id} index={index}>
        {(provided) => (
          <motion.div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <AnimatedBorder>
              <Card className="overflow-hidden bg-gray-800 border-gray-700">
                <CardHeader className={`flex flex-row items-center justify-between ${statusColors[todo.status]} p-2`}>
                  <CardTitle className="text-white text-sm">
                    {editingId === todo.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveEdit}
                        autoFocus
                        className="bg-gray-700 text-white border-gray-600"
                      />
                    ) : (
                      <span className="flex items-center">
                        {categoryIcons[todo.category]} {todo.title}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id)}>
                          <X className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(todo.id, todo.title)}
                        >
                          <Edit2 className="h-4 w-4 text-white" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-2 bg-gray-900">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Select
                      value={todo.status}
                      onValueChange={(value) => updateTodoStatus(todo.id, value as Todo['status'])}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="w-[100px] bg-gray-800 text-white border-gray-700 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white border-gray-700">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={todo.priority}
                      onValueChange={(value) => updateTodoPriority(todo.id, value as Todo['priority'])}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="w-[100px] bg-gray-800 text-white border-gray-700 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white border-gray-700">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={todo.category}
                      onValueChange={(value) => updateTodoCategory(todo.id, value as Todo['category'])}
                      disabled={!isAdmin}
                    
                    >
                      <SelectTrigger className="w-[100px] bg-gray-800 text-white border-gray-700 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white border-gray-700">
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mb-2">
                    <Label htmlFor={`progress-${todo.id}`} className="text-xs font-medium text-gray-400">
                      Progress: {todo.progress}%
                    </Label>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-700">
                        <motion.div 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-400 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${todo.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      {isAdmin && (
                        <Slider
                          id={`progress-${todo.id}`}
                          min={0}
                          max={100}
                          step={1}
                          value={[todo.progress]}
                          onValueChange={(value) => debouncedUpdateProgress(todo.id, value[0])}
                          className="mt-1"
                        />
                      )}
                    </div>
                  </div>
                  {showMore && (
                    <>
                      <div className="space-y-2 mb-2">
                        <Label className="text-xs font-medium text-gray-400">Subtasks</Label>
                        <div className="flex flex-wrap gap-1">
                          {(todo.subtasks || []).map((subtask) => (
                            <Badge 
                              key={subtask.id} 
                              variant="secondary" 
                              className={`bg-gray-700 text-white text-xs ${subtask.completed ? 'line-through opacity-50' : ''}`}
                            >
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={() => toggleSubtask(todo.id, subtask.id)}
                                disabled={!isAdmin}
                                className="mr-1 h-3 w-3"
                              />
                              {subtask.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center mt-2 mb-2">
                          <Input
                            type="text"
                            placeholder="Add subtask..."
                            value={localNewSubtask}
                            onChange={(e) => setLocalNewSubtask(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                            className="flex-grow mr-2 bg-gray-700 text-white border-gray-600 text-xs"
                          />
                          <Button onClick={handleAddSubtask} size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mb-2">
                        <Label className="text-xs font-medium text-gray-400">Due Date:</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={`w-[180px] justify-start text-left font-normal text-xs ${!todo.dueDate && "text-muted-foreground"}`}
                              disabled={!isAdmin}
                            >
                              <Calendar className="mr-2 h-3 w-3" />
                              {todo.dueDate ? format(todo.dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={todo.dueDate}
                              onSelect={(date) => updateTodoDueDate(todo.id, date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="mb-2">
                        <Label className="text-xs font-medium text-gray-400">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(todo.tags || []).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-gray-700 text-white text-xs">
                              {tag}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTag(todo.id, tag)}
                                  className="ml-1 p-0 h-3 w-3"
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              )}
                            </Badge>
                          ))}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center mt-1">
                            <Input
                              type="text"
                              placeholder="Add tag..."
                              value={localNewTag}
                              onChange={(e) => setLocalNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                              className="flex-grow mr-2 bg-gray-700 text-white border-gray-600 text-xs"
                            />
                            <Button onClick={handleAddTag} size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <Button
                    onClick={() => setShowMore(!showMore)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs"
                  >
                    {showMore ? (
                      <>
                        <ChevronUp className="mr-2 h-3 w-3" /> View Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-3 w-3" /> View More
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </AnimatedBorder>
          </motion.div>
        )}
      </Draggable>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-gray-900 text-white transition-colors duration-300 overflow-hidden">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: {
              color: {
                value: "transparent",
              },
            },
            fpsLimit: 120,
            particles: {
              color: {
                value: "#ffffff",
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 0.5,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 30,
              },
              opacity: {
                value: 0.5,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 3 },
              },
            },
            detectRetina: true,
          }}
        />
        <div className="container mx-auto p-4 relative z-10">
          <div className="flex justify-center items-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 animate-gradient">
              Laknicek Todo List
            </h1>
          </div>
          {isAdmin && (
            <AnimatedBorder>
              <div className="flex items-center space-x-2 mb-8 p-4 bg-gray-800 rounded-lg">
                <Input
                  type="text"
                  placeholder="Add a new todo..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  className="flex-grow bg-gray-700 text-white border-gray-600"
                />
                <Button onClick={addTodo} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 animate-gradient">
                  <Plus className="mr-2 h-4 w-4" /> Add Todo
                </Button>
              </div>
            </AnimatedBorder>
          )}
          <div className="flex justify-center space-x-4 mb-8 overflow-x-auto pb-4 mt-16">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={`${filter === 'all' ? 'bg-gradient-to-r from-purple-500 to-blue-500 animate-gradient' : 'bg-gray-800 text-white'} flex-shrink-0 px-6 py-3`}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter('pending')}
              variant={filter === 'pending' ? 'default' : 'outline'}
              className={`${filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-800 text-white'} flex-shrink-0 px-6 py-3`}
            >
              Pending
            </Button>
            <Button
              onClick={() => setFilter('in-progress')}
              variant={filter === 'in-progress' ? 'default' : 'outline'}
              className={`${filter === 'in-progress' ? 'bg-blue-600' : 'bg-gray-800 text-white'} flex-shrink-0 px-6 py-3`}
            >
              In Progress
            </Button>
            <Button
              onClick={() => setFilter('completed')}
              variant={filter === 'completed' ? 'default' : 'outline'}
              className={`${filter === 'completed' ? 'bg-green-600' : 'bg-gray-800 text-white'} flex-shrink-0 px-6 py-3`}
            >
              Completed
            </Button>
            <Button
              onClick={() => setFilter('blocked')}
              variant={filter === 'blocked' ? 'default' : 'outline'}
              className={`${filter === 'blocked' ? 'bg-red-600' : 'bg-gray-800 text-white'} flex-shrink-0 px-6 py-3`}
            >
              Blocked
            </Button>
          </div>
          <Droppable droppableId="todos">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredTodos.map((todo, index) => (
                    <TodoItem key={todo.id} todo={todo} index={index} />
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {filteredTodos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-gray-500 mt-8"
            >
              <Zap className="mx-auto h-12 w-12 mb-4" />
              <p className="text-xl">No todos found. Add some tasks to get started!</p>
            </motion.div>
          )}
        </div>
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700">
              <User className="mr-2 h-4 w-4" /> Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Admin Login</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="col-span-3 bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3 bg-gray-700 text-white border-gray-600"
                />
              </div>
            </div>
            <Button onClick={handleAdminLogin} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 animate-gradient">
              Login
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>
  )
}
