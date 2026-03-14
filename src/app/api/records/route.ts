import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createRecordSchema = z.object({
  type: z.enum(["STUDY", "PRACTICE", "REVIEW", "PROJECT"]).optional(),
  duration: z.number().min(1),
  note: z.string().optional(),
  nodeId: z.string(),
  recordedAt: z.string().optional(),
})

// GET /api/records - Get records for a node or user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get("nodeId")
    const pathId = searchParams.get("pathId")

    if (pathId) {
      // Get all records for a path
      const records = await prisma.learningRecord.findMany({
        where: {
          node: {
            pathId,
          },
          userId: session.user.id,
        },
        include: {
          node: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { recordedAt: "desc" },
      })
      return NextResponse.json(records)
    }

    if (nodeId) {
      const records = await prisma.learningRecord.findMany({
        where: {
          nodeId,
          userId: session.user.id,
        },
        orderBy: { recordedAt: "desc" },
      })
      return NextResponse.json(records)
    }

    // Get all records for the user
    const records = await prisma.learningRecord.findMany({
      where: {
        userId: session.user.id,
      },
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
      take: 50,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching records:", error)
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    )
  }
}

// POST /api/records - Create a new record
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRecordSchema.parse(body)

    // Verify the node belongs to the user
    const node = await prisma.learningNode.findFirst({
      where: {
        id: validatedData.nodeId,
        userId: session.user.id,
      },
    })

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    const record = await prisma.learningRecord.create({
      data: {
        type: validatedData.type || "STUDY",
        duration: validatedData.duration,
        note: validatedData.note,
        nodeId: validatedData.nodeId,
        userId: session.user.id,
        recordedAt: validatedData.recordedAt ? new Date(validatedData.recordedAt) : new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating record:", error)
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    )
  }
}
