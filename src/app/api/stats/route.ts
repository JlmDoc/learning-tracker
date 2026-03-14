import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/stats - Get user statistics
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total paths
    const totalPaths = await prisma.learningPath.count({
      where: { userId: session.user.id },
    })

    // Get total nodes
    const totalNodes = await prisma.learningNode.count({
      where: { userId: session.user.id },
    })

    // Get nodes by status
    const nodesByStatus = await prisma.learningNode.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    })

    // Get total learning time
    const totalTimeResult = await prisma.learningRecord.aggregate({
      where: { userId: session.user.id },
      _sum: { duration: true },
    })
    const totalLearningTime = totalTimeResult._sum.duration || 0

    // Get learning time by type
    const timeByType = await prisma.learningRecord.groupBy({
      by: ["type"],
      where: { userId: session.user.id },
      _sum: { duration: true },
    })

    // Get recent records
    const recentRecords = await prisma.learningRecord.findMany({
      where: { userId: session.user.id },
      include: {
        node: {
          select: {
            id: true,
            title: true,
            path: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { recordedAt: "desc" },
      take: 10,
    })

    // Get learning time by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentDailyRecords = await prisma.learningRecord.findMany({
      where: {
        userId: session.user.id,
        recordedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        duration: true,
        recordedAt: true,
      },
    })

    // Aggregate by day
    const dailyStats: Record<string, number> = {}
    recentDailyRecords.forEach((record) => {
      const date = record.recordedAt.toISOString().split("T")[0]
      dailyStats[date] = (dailyStats[date] || 0) + record.duration
    })

    const stats = {
      totalPaths,
      totalNodes,
      nodesByStatus: nodesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      totalLearningTime,
      timeByType: timeByType.reduce((acc, item) => {
        acc[item.type] = item._sum.duration || 0
        return acc
      }, {} as Record<string, number>),
      recentRecords,
      dailyStats,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
