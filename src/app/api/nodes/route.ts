import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createNodeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  pathId: z.string(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED"]).optional(),
  order: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  duration: z.number().optional(),
  prerequisites: z.array(z.string()).optional(),
})

// GET /api/nodes - Get all nodes for a path
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pathId = searchParams.get("pathId")

    if (!pathId) {
      return NextResponse.json(
        { error: "pathId is required" },
        { status: 400 }
      )
    }

    const nodes = await prisma.learningNode.findMany({
      where: {
        pathId,
        userId: session.user.id,
      },
      include: {
        resources: true,
        notes: true,
        records: true,
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(nodes)
  } catch (error) {
    console.error("Error fetching nodes:", error)
    return NextResponse.json(
      { error: "Failed to fetch nodes" },
      { status: 500 }
    )
  }
}

// POST /api/nodes - Create a new node
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createNodeSchema.parse(body)

    // Verify the path belongs to the user
    const path = await prisma.learningPath.findFirst({
      where: {
        id: validatedData.pathId,
        userId: session.user.id,
      },
    })

    if (!path) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 })
    }

    // Get the max order for the path
    const maxOrder = await prisma.learningNode.findFirst({
      where: { pathId: validatedData.pathId },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const node = await prisma.learningNode.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        pathId: validatedData.pathId,
        userId: session.user.id,
        status: validatedData.status || "NOT_STARTED",
        order: validatedData.order ?? (maxOrder?.order ?? 0) + 1,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        duration: validatedData.duration,
      },
      include: {
        prerequisites: true,
      },
    })

    // Create prerequisite relationships
    if (validatedData.prerequisites && validatedData.prerequisites.length > 0) {
      await prisma.nodePrerequisite.createMany({
        data: validatedData.prerequisites.map((prereqId) => ({
          nodeId: node.id,
          prerequisiteId: prereqId,
        })),
      })
    }

    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating node:", error)
    return NextResponse.json(
      { error: "Failed to create node" },
      { status: 500 }
    )
  }
}
