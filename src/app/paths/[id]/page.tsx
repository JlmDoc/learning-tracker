import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import PathDetailClient from "./client"

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
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
          records: {
            orderBy: { recordedAt: "desc" },
            take: 5,
          },
          prerequisites: {
            include: {
              prerequisite: {
                select: { id: true, title: true },
              },
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
    notFound()
  }

  const isOwner = path.userId === session.user.id

  // Get all nodes for prerequisite selection
  const allNodes = await prisma.learningNode.findMany({
    where: { pathId: id },
    select: { id: true, title: true },
  })

  return <PathDetailClient path={path} allNodes={allNodes} isOwner={isOwner} />
}
