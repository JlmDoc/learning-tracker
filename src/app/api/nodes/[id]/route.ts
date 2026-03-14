import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateNodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED"]).optional(),
  order: z.number().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  duration: z.number().optional(),
  prerequisites: z.array(z.string()).optional(),
})

// GET /api/nodes/[id] - Get a single node
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const node = await prisma.learningNode.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        resources: true,
        notes: true,
        records: {
          orderBy: { recordedAt: "desc" },
        },
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        dependents: {
          include: {
            node: true,
          },
        },
      },
    })

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    return NextResponse.json(node)
  } catch (error) {
    console.error("Error fetching node:", error)
    return NextResponse.json(
      { error: "Failed to fetch node" },
      { status: 500 }
    )
  }
}

// PUT /api/nodes/[id] - Update a node
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateNodeSchema.parse(body)

    const existingNode = await prisma.learningNode.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    // Update prerequisites if provided
    if (validatedData.prerequisites !== undefined) {
      // Delete existing prerequisites
      await prisma.nodePrerequisite.deleteMany({
        where: { nodeId: id },
      })

      // Create new prerequisites
      if (validatedData.prerequisites.length > 0) {
        await prisma.nodePrerequisite.createMany({
          data: validatedData.prerequisites.map((prereqId) => ({
            nodeId: id,
            prerequisiteId: prereqId,
          })),
        })
      }
    }

    const updatedNode = await prisma.learningNode.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        order: validatedData.order,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : validatedData.startDate === null ? null : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : validatedData.endDate === null ? null : undefined,
        duration: validatedData.duration,
      },
      include: {
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    })

    return NextResponse.json(updatedNode)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating node:", error)
    return NextResponse.json(
      { error: "Failed to update node" },
      { status: 500 }
    )
  }
}

// DELETE /api/nodes/[id] - Delete a node
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existingNode = await prisma.learningNode.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    await prisma.learningNode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting node:", error)
    return NextResponse.json(
      { error: "Failed to delete node" },
      { status: 500 }
    )
  }
}
