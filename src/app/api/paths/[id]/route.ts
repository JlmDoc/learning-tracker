import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updatePathSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/paths/[id] - Get a single path
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

    const path = await prisma.learningPath.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { isPublic: true },
        ],
      },
      include: {
        nodes: {
          include: {
            resources: true,
            notes: true,
            records: true,
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
          orderBy: { order: "asc" },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!path) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 })
    }

    return NextResponse.json(path)
  } catch (error) {
    console.error("Error fetching path:", error)
    return NextResponse.json(
      { error: "Failed to fetch path" },
      { status: 500 }
    )
  }
}

// PUT /api/paths/[id] - Update a path
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
    const validatedData = updatePathSchema.parse(body)

    const existingPath = await prisma.learningPath.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingPath) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 })
    }

    const updatedPath = await prisma.learningPath.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(updatedPath)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating path:", error)
    return NextResponse.json(
      { error: "Failed to update path" },
      { status: 500 }
    )
  }
}

// DELETE /api/paths/[id] - Delete a path
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

    const existingPath = await prisma.learningPath.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingPath) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 })
    }

    await prisma.learningPath.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting path:", error)
    return NextResponse.json(
      { error: "Failed to delete path" },
      { status: 500 }
    )
  }
}
