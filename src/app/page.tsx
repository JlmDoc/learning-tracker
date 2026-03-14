import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Learning Tracker
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your learning journey, organize resources, take notes, and visualize your progress.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-card rounded-lg p-6 border">
              <BookOpen className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Learning Paths</h3>
              <p className="text-muted-foreground">
                Create structured learning paths with interconnected nodes and track your progress.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <Clock className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Time Tracking</h3>
              <p className="text-muted-foreground">
                Log your study sessions and see how much time you&apos;ve invested in each topic.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <TrendingUp className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Visual Progress</h3>
              <p className="text-muted-foreground">
                Visualize your learning journey with interactive charts and timelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fetch user stats
  const [totalPaths, nodesByStatus, totalTimeResult, recentRecords] = await Promise.all([
    prisma.learningPath.count({ where: { userId: session.user.id } }),
    prisma.learningNode.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
    prisma.learningRecord.aggregate({
      where: { userId: session.user.id },
      _sum: { duration: true },
    }),
    prisma.learningRecord.findMany({
      where: { userId: session.user.id },
      include: {
        node: {
          select: { id: true, title: true, path: { select: { id: true, title: true } } },
        },
      },
      orderBy: { recordedAt: "desc" },
      take: 5,
    }),
  ])

  const totalLearningTime = totalTimeResult._sum.duration || 0
  const completedNodes = nodesByStatus.find(s => s.status === "COMPLETED")?._count || 0
  const inProgressNodes = nodesByStatus.find(s => s.status === "IN_PROGRESS")?._count || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {session.user.name || "Learner"}!</p>
          </div>
          <Link href="/paths/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Path
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Learning Paths</p>
                <p className="text-2xl font-bold">{totalPaths}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedNodes}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressNodes}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{Math.round(totalLearningTime / 60)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {recentRecords.length > 0 ? (
            <div className="space-y-4">
              {recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{record.node.title}</p>
                    <p className="text-sm text-muted-foreground">{record.node.path.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{record.duration} min</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.recordedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No activity yet. Start by creating a learning path!
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link href="/paths">
            <Button variant="outline" className="w-full">
              View All Paths
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
