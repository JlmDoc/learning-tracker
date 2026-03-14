import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPathSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/paths - Get all paths for the current user
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    return NextResponse.json(pathsWithProgress)
  } catch (error) {
    console.error("Error fetching paths:", error)
    return NextResponse.json(
      { error: "Failed to fetch paths" },
      { status: 500 }
    )
  }
}

// POST /api/paths - Create a new path
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPathSchema.parse(body)

    const path = await prisma.learningPath.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        color: validatedData.color || "#3B82F6",
        icon: validatedData.icon,
        isPublic: validatedData.isPublic || false,
        userId: session.user.id,
      },
    })

    return NextResponse.json(path, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating path:", error)
    return NextResponse.json(
      { error: "Failed to create path" },
      { status: 500 }
    )
  }
}
