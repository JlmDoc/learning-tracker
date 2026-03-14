import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Clock } from "lucide-react"

export default async function PathsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const paths = await prisma.learningPath.findMany({
    where: { userId: session.user.id },
    include: {
      nodes: {
        select: {
          id: true,
          status: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const pathsWithProgress = paths.map((path) => {
    const totalNodes = path.nodes.length
    const completedNodes = path.nodes.filter(
      (node) => node.status === "COMPLETED"
    ).length
    const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0

    return {
      ...path,
      totalNodes,
      completedNodes,
      progress,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Learning Paths</h1>
            <p className="text-muted-foreground">Manage your learning journeys</p>
          </div>
          <Link href="/paths/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Path
            </Button>
          </Link>
        </div>

        {pathsWithProgress.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No learning paths yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first learning path to start tracking your progress
            </p>
            <Link href="/paths/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Path
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathsWithProgress.map((path) => (
              <Link key={path.id} href={`/paths/${path.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: path.color }}
                      />
                      {path.isPublic && (
                        <Badge variant="secondary">Public</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    {path.description && (
                      <CardDescription className="line-clamp-2">
                        {path.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {path.completedNodes}/{path.totalNodes} nodes
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${path.progress}%`,
                            backgroundColor: path.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Updated {new Date(path.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {path.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {path.tags.slice(0, 3).map((pt) => (
                            <Badge key={pt.tag.id} variant="outline" className="text-xs">
                              {pt.tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
