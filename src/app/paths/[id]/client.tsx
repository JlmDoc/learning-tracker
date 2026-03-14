"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  BookOpen,
  FileText,
  Link as LinkIcon,
} from "lucide-react"

interface Path {
  id: string
  title: string
  description: string | null
  color: string
  icon: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  nodes: Node[]
  tags: { tag: { id: string; name: string } }[]
}

interface Node {
  id: string
  title: string
  description: string | null
  status: string
  order: number
  startDate: Date | null
  endDate: Date | null
  duration: number | null
  createdAt: Date
  updatedAt: Date
  resources: Resource[]
  notes: Note[]
  records: LearningRecord[]
  prerequisites: { prerequisite: { id: string; title: string } }[]
}

interface Resource {
  id: string
  title: string
  url: string
  type: string
  description: string | null
  duration: number | null
}

interface Note {
  id: string
  title: string
  content: string
}

interface LearningRecord {
  id: string
  type: string
  duration: number
  note: string | null
  recordedAt: Date
}

interface Props {
  path: Path
  allNodes: { id: string; title: string }[]
  isOwner: boolean
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  PAUSED: "bg-yellow-500",
}

const resourceTypeIcons: Record<string, React.ReactNode> = {
  ARTICLE: <FileText className="h-4 w-4" />,
  VIDEO: <BookOpen className="h-4 w-4" />,
  BOOK: <BookOpen className="h-4 w-4" />,
  COURSE: <BookOpen className="h-4 w-4" />,
  DOCUMENTATION: <FileText className="h-4 w-4" />,
  TUTORIAL: <FileText className="h-4 w-4" />,
  OTHER: <LinkIcon className="h-4 w-4" />,
}

export default function PathDetailClient({ path, allNodes, isOwner }: Props) {
  const router = useRouter()
  const [nodes, setNodes] = useState(path.nodes)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showNodeDialog, setShowNodeDialog] = useState(false)
  const [showResourceDialog, setShowResourceDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [showEditPathDialog, setShowEditPathDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  // Node form state
  const [nodeTitle, setNodeTitle] = useState("")
  const [nodeDescription, setNodeDescription] = useState("")
  const [nodePrerequisites, setNodePrerequisites] = useState<string[]>([])

  // Resource form state
  const [resourceTitle, setResourceTitle] = useState("")
  const [resourceUrl, setResourceUrl] = useState("")
  const [resourceType, setResourceType] = useState("ARTICLE")
  const [resourceDuration, setResourceDuration] = useState("")

  // Note form state
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")

  // Record form state
  const [recordDuration, setRecordDuration] = useState("")
  const [recordNote, setRecordNote] = useState("")

  // Path edit form state
  const [pathTitle, setPathTitle] = useState(path.title)
  const [pathDescription, setPathDescription] = useState(path.description || "")

  const totalNodes = nodes.length
  const completedNodes = nodes.filter((n) => n.status === "COMPLETED").length
  const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0

  const handleCreateNode = async () => {
    if (!nodeTitle.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nodeTitle,
          description: nodeDescription || undefined,
          pathId: path.id,
          prerequisites: nodePrerequisites,
        }),
      })

      if (response.ok) {
        const newNode = await response.json()
        setNodes([...nodes, newNode])
        setNodeTitle("")
        setNodeDescription("")
        setNodePrerequisites([])
        setShowNodeDialog(false)
      }
    } catch (error) {
      console.error("Failed to create node:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNodeStatus = async (nodeId: string, status: string) => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setNodes(
          nodes.map((n) => (n.id === nodeId ? { ...n, status } : n))
        )
      }
    } catch (error) {
      console.error("Failed to update node:", error)
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm("Are you sure you want to delete this node?")) return

    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNodes(nodes.filter((n) => n.id !== nodeId))
        setSelectedNode(null)
      }
    } catch (error) {
      console.error("Failed to delete node:", error)
    }
  }

  const handleAddResource = async () => {
    if (!selectedNode || !resourceTitle.trim() || !resourceUrl.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceTitle,
          url: resourceUrl,
          type: resourceType,
          duration: resourceDuration ? parseInt(resourceDuration) : undefined,
          nodeId: selectedNode.id,
        }),
      })

      if (response.ok) {
        const newResource = await response.json()
        setNodes(
          nodes.map((n) =>
            n.id === selectedNode.id
              ? { ...n, resources: [...n.resources, newResource] }
              : n
          )
        )
        setResourceTitle("")
        setResourceUrl("")
        setResourceType("ARTICLE")
        setResourceDuration("")
        setShowResourceDialog(false)
      }
    } catch (error) {
      console.error("Failed to add resource:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!selectedNode || !noteTitle.trim() || !noteContent.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          nodeId: selectedNode.id,
        }),
      })

      if (response.ok) {
        const newNote = await response.json()
        setNodes(
          nodes.map((n) =>
            n.id === selectedNode.id
              ? { ...n, notes: [...n.notes, newNote] }
              : n
          )
        )
        setNoteTitle("")
        setNoteContent("")
        setShowNoteDialog(false)
      }
    } catch (error) {
      console.error("Failed to add note:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecord = async () => {
    if (!selectedNode || !recordDuration) return

    setLoading(true)
    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: parseInt(recordDuration),
          note: recordNote || undefined,
          nodeId: selectedNode.id,
        }),
      })

      if (response.ok) {
        const newRecord = await response.json()
        setNodes(
          nodes.map((n) =>
            n.id === selectedNode.id
              ? { ...n, records: [newRecord, ...n.records] }
              : n
          )
        )
        setRecordDuration("")
        setRecordNote("")
        setShowRecordDialog(false)
      }
    } catch (error) {
      console.error("Failed to add record:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePath = async () => {
    if (!pathTitle.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/paths/${path.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pathTitle,
          description: pathDescription || undefined,
        }),
      })

      if (response.ok) {
        router.refresh()
        setShowEditPathDialog(false)
      }
    } catch (error) {
      console.error("Failed to update path:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePath = async () => {
    if (!confirm("Are you sure you want to delete this path and all its nodes?")) return

    try {
      const response = await fetch(`/api/paths/${path.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/paths")
      }
    } catch (error) {
      console.error("Failed to delete path:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/paths">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: path.color }}
                />
                <h1 className="text-3xl font-bold">{path.title}</h1>
              </div>
              {path.description && (
                <p className="text-muted-foreground mt-1">{path.description}</p>
              )}
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditPathDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Path
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeletePath}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Path
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {completedNodes} of {totalNodes} nodes completed
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: path.color,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nodes */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Learning Nodes</h2>
          {isOwner && (
            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
              <DialogTrigger>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Node
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Learning Node</DialogTitle>
                  <DialogDescription>
                    Add a new topic to your learning path
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="e.g., Introduction to React"
                      value={nodeTitle}
                      onChange={(e) => setNodeTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What will you learn?"
                      value={nodeDescription}
                      onChange={(e) => setNodeDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prerequisites</Label>
                    <div className="flex flex-wrap gap-2">
                      {allNodes
                        .filter((n) => !nodePrerequisites.includes(n.id))
                        .map((n) => (
                          <Badge
                            key={n.id}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() =>
                              setNodePrerequisites([...nodePrerequisites, n.id])
                            }
                          >
                            + {n.title}
                          </Badge>
                        ))}
                    </div>
                    {nodePrerequisites.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {nodePrerequisites.map((id) => {
                          const node = allNodes.find((n) => n.id === id)
                          return node ? (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() =>
                                setNodePrerequisites(
                                  nodePrerequisites.filter((p) => p !== id)
                                )
                              }
                            >
                              {node.title} ×
                            </Badge>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleCreateNode}
                    disabled={loading || !nodeTitle.trim()}
                    className="w-full"
                  >
                    {loading ? "Creating..." : "Create Node"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {nodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No nodes yet. Add your first learning topic!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {nodes.map((node) => (
              <Card key={node.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          statusColors[node.status]
                        }`}
                      />
                      <div>
                        <CardTitle className="text-lg">{node.title}</CardTitle>
                        {node.description && (
                          <CardDescription className="mt-1">
                            {node.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={node.status || "NOT_STARTED"}
                          onValueChange={(value) => {
                            if (value) handleUpdateNodeStatus(node.id, value)
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">
                              Not Started
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS">
                              In Progress
                            </SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNode(node.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Prerequisites */}
                  {node.prerequisites.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground mr-2">
                        Prerequisites:
                      </span>
                      {node.prerequisites.map((p) => (
                        <Badge key={p.prerequisite.id} variant="outline" className="mr-1">
                          {p.prerequisite.title}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Resources */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Resources</span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNode(node)
                            setShowResourceDialog(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                    {node.resources.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {node.resources.map((r) => (
                          <a
                            key={r.id}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                          >
                            {resourceTypeIcons[r.type]}
                            {r.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No resources added
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Notes</span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNode(node)
                            setShowNoteDialog(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                    {node.notes.length > 0 ? (
                      <div className="space-y-2">
                        {node.notes.map((n) => (
                          <div
                            key={n.id}
                            className="p-3 bg-muted rounded-lg text-sm"
                          >
                            <p className="font-medium mb-1">{n.title}</p>
                            <p className="text-muted-foreground line-clamp-2">
                              {n.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No notes added
                      </p>
                    )}
                  </div>

                  {/* Records */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Learning Time ({node.records.reduce((sum, r) => sum + r.duration, 0)} min)
                      </span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNode(node)
                            setShowRecordDialog(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Log Time
                        </Button>
                      )}
                    </div>
                    {node.records.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {node.records.slice(0, 3).map((r) => (
                          <Badge key={r.id} variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {r.duration} min
                          </Badge>
                        ))}
                        {node.records.length > 3 && (
                          <Badge variant="outline">
                            +{node.records.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No time logged
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Resource Dialog */}
        <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Resource</DialogTitle>
              <DialogDescription>
                Add a learning resource for this node
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., React Documentation"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={resourceType} onValueChange={(v) => v && setResourceType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTICLE">Article</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="BOOK">Book</SelectItem>
                    <SelectItem value="COURSE">Course</SelectItem>
                    <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                    <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  value={resourceDuration}
                  onChange={(e) => setResourceDuration(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddResource}
                disabled={loading || !resourceTitle.trim() || !resourceUrl.trim()}
                className="w-full"
              >
                {loading ? "Adding..." : "Add Resource"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add a note for this node (Markdown supported)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  placeholder="Write your notes here... (Markdown supported)"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={6}
                />
              </div>
              <Button
                onClick={handleAddNote}
                disabled={loading || !noteTitle.trim() || !noteContent.trim()}
                className="w-full"
              >
                {loading ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Record Dialog */}
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Learning Time</DialogTitle>
              <DialogDescription>
                Record your study session for this node
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  value={recordDuration}
                  onChange={(e) => setRecordDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="What did you learn?"
                  value={recordNote}
                  onChange={(e) => setRecordNote(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddRecord}
                disabled={loading || !recordDuration}
                className="w-full"
              >
                {loading ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Path Dialog */}
        <Dialog open={showEditPathDialog} onOpenChange={setShowEditPathDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Path</DialogTitle>
              <DialogDescription>
                Update your learning path details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={pathTitle}
                  onChange={(e) => setPathTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={pathDescription}
                  onChange={(e) => setPathDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpdatePath}
                disabled={loading || !pathTitle.trim()}
                className="w-full"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
