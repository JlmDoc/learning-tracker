import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.enum(["ARTICLE", "VIDEO", "BOOK", "COURSE", "DOCUMENTATION", "TUTORIAL", "OTHER"]).optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
  nodeId: z.string(),
})

// GET /api/resources - Get resources for a node
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get("nodeId")

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId is required" },
        { status: 400 }
      )
    }

    const resources = await prisma.resource.findMany({
      where: {
        nodeId,
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    )
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createResourceSchema.parse(body)

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

    const resource = await prisma.resource.create({
      data: {
        title: validatedData.title,
        url: validatedData.url,
        type: validatedData.type || "ARTICLE",
        description: validatedData.description,
        duration: validatedData.duration,
        nodeId: validatedData.nodeId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating resource:", error)
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    )
  }
}
