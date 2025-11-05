import { Router, Request } from "express";
import { authMiddleware } from "../middleware.js";
import { ZapCreateSchema } from "@repo/validators/auth";
import { prisma } from "../prisma.js";

declare global {
  namespace Express {
    interface User {
      id: number;
    }
    interface Request {
      user: User;
    }
  }
}

const router = Router();


router.post("/", authMiddleware, async (req, res) => {
  const body = req.body;
  const parsedData = ZapCreateSchema.safeParse(body);
  if (!parsedData.success) {
    return res.status(400).json({ error: parsedData.error });
  }
  try {
    const zap = await prisma.zap.create({
      data: {
        name: body.name,
        userId: req.user.id,
        action: {
          create: body.actions.map((action: any, index: number) => ({
            availableActionId: action.availableActionId,
            config: action.actionMetadata || {},
          })),
        },
      },
      include: { action: true }
    });
    
    // Extract formId from trigger metadata if it exists
    const formId = body.triggerMetadata?.formId || null;
    
    const trigger = await prisma.trigger.create({
      data: {
        availableTriggerId: body.availableTriggerId,
        zapId: zap.id,
        config: body.triggerMetadata || {},
        sortingOrder: 0,
        ...(formId ? { formId } : {}),
      }
    });
    await prisma.zap.update({
      where: { id: zap.id },
      data: { trigger: { connect: { id: trigger.id } } }
    });
    return res.status(201).json({ message: "Zap created successfully", zap });
  } catch (error) {
    console.error("Error creating zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const zaps = await prisma.zap.findMany({
      where: { userId: req.user.id },
      include: { 
        action: { 
          include: { type: true } 
        }, 
        trigger: { include: { type: true } } 
      },
    });
    
    // Transform the response to match frontend expectations
    const transformedZaps = zaps.map(zap => ({
      ...zap,
      actions: zap.action.map(action => ({
        name: action.type.name
      })),
      // Keep the original action array for backward compatibility if needed
      // Remove the action field to avoid confusion
      action: undefined
    }));
    
    return res.status(200).json({ zaps: transformedZaps });
  } catch (error) {
    console.error("Error fetching zaps:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:zapId", authMiddleware, async (req, res) => {
  const zapId = typeof req.params.zapId === "string" ? req.params.zapId : "";
  if (!zapId) {
    return res.status(400).json({ error: "Zap ID is required" });
  }
  try {
    const zap = await prisma.zap.findFirst({
      where: { id: zapId, userId: req.user.id },
      include: { action: true, trigger: true },
    });
    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }
    return res.status(200).json({ zap });
  } catch (error) {
    console.error("Error fetching zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:zapId/run", authMiddleware, async (req, res) => {
  const zapId = typeof req.params.zapId === "string" ? req.params.zapId : "";
  if (!zapId) {
    return res.status(400).json({ error: "Zap ID is required" });
  }

  const { metaData } = req.body;

  try {
    // Validate zap belongs to user
    const zap = await prisma.zap.findFirst({
      where: { id: zapId, userId: req.user.id },
    });
    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    // Create ZapRun
    const zapRun = await prisma.zapRun.create({
      data: {
        zapId,
        metaData: metaData ?? {},
      },
    });

    // Create ZapRunOutbox
    await prisma.zapRunOutbox.create({
      data: {
        zapRunId: zapRun.id,
      },
    });

    return res.status(200).json({ ok: true, zapRunId: zapRun.id });
  } catch (error) {
    console.error("Error running zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:zapId", authMiddleware, async (req, res) => {
  const zapId = typeof req.params.zapId === "string" ? req.params.zapId : "";
  if (!zapId) {
    return res.status(400).json({ error: "Zap ID is required" });
  }

  try {
    // Validate zap belongs to user
    const zap = await prisma.zap.findFirst({
      where: { id: zapId, userId: req.user.id },
    });
    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    // Delete related records first (due to foreign key constraints)
    // Delete triggers
    await prisma.trigger.deleteMany({
      where: { zapId },
    });

    // Delete actions
    await prisma.action.deleteMany({
      where: { zapId },
    });

    // Delete zap runs and outbox
    const zapRuns = await prisma.zapRun.findMany({
      where: { zapId },
      select: { id: true },
    });
    
    for (const run of zapRuns) {
      await prisma.zapRunOutbox.deleteMany({
        where: { zapRunId: run.id },
      });
    }

    await prisma.zapRun.deleteMany({
      where: { zapId },
    });

    // Finally delete the zap
    await prisma.zap.delete({
      where: { id: zapId },
    });

    return res.status(200).json({ ok: true, message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Error deleting zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
