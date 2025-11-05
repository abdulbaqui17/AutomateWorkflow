import { Router } from "express";
import { prisma } from "../prisma.js";
import { authMiddleware } from "../middleware.js";
import { Kafka, Partitioners, Producer } from "kafkajs";
import { z } from "zod";

const router = Router();
const ZAP_TRIGGER_TOPIC = process.env.ZAP_TRIGGER_TOPIC || "zap.trigger";

let producer: Producer | null = null;
let isConnecting = false;

async function getProducer(): Promise<Producer> {
  // If producer exists and is connected, return it
  if (producer) {
    try {
      // Check if producer is still connected by attempting to get metadata
      // If this fails, the producer is disconnected
      return producer;
    } catch (error) {
      console.log("Producer disconnected, reconnecting...");
      producer = null;
    }
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for the ongoing connection to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return getProducer();
  }

  try {
    isConnecting = true;
    const kafka = new Kafka({
      clientId: "apis-form",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9093").split(","),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    producer = kafka.producer({ 
      createPartitioner: Partitioners.LegacyPartitioner,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    await producer.connect();
    console.log("Kafka producer connected successfully");
    
    // Handle disconnection
    producer.on("producer.disconnect", () => {
      console.log("Producer disconnected");
      producer = null;
    });
    
    return producer;
  } finally {
    isConnecting = false;
  }
}

const fieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  type: z.enum(["text", "email", "number", "textarea", "select"]),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(),
});

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema).optional().default([]),
  published: z.boolean().optional().default(false),
});

router.post("/forms", authMiddleware, async (req, res) => {
  // @ts-ignore - req.user is set by authMiddleware
  const userId = req.user.id;
  const parsed = formSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_form", details: parsed.error.flatten() });
  // @ts-ignore - generated Prisma types will include Form after migration
  const form = await prisma.form.create({ 
    data: { 
      name: parsed.data.name, 
      description: parsed.data.description || null,
      fields: parsed.data.fields,
      published: parsed.data.published || false,
      userId 
    } 
  });
  return res.json(form);
});

router.get("/forms", authMiddleware, async (req, res) => {
  // @ts-ignore - req.user is set by authMiddleware
  const userId = req.user.id;
  // @ts-ignore - generated Prisma types will include Form after migration
  const forms = await prisma.form.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return res.json(forms);
});

router.get("/forms/:id", authMiddleware, async (req, res) => {
  // @ts-ignore - req.user is set by authMiddleware
  const userId = req.user.id;
  // @ts-ignore - generated Prisma types will include Form after migration
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId } });
  if (!form) return res.status(404).json({ error: "not_found" });
  return res.json(form);
});

router.put("/forms/:id", authMiddleware, async (req, res) => {
  // @ts-ignore - req.user is set by authMiddleware
  const userId = req.user.id;
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "form_id_required" });
  
  // Verify ownership
  // @ts-ignore - generated Prisma types will include Form after migration
  const existing = await prisma.form.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: "not_found" });
  
  const parsed = formSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_form", details: parsed.error.flatten() });
  
  // @ts-ignore - generated Prisma types will include Form after migration
  const form = await prisma.form.update({
    where: { id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.fields ? { fields: parsed.data.fields } : {}),
      ...(parsed.data.published !== undefined ? { published: parsed.data.published } : {}),
      updatedAt: new Date(),
    },
  });
  return res.json(form);
});

router.delete("/forms/:id", authMiddleware, async (req, res) => {
  // @ts-ignore - req.user is set by authMiddleware
  const userId = req.user.id;
  // @ts-ignore - generated Prisma types will include Form after migration
  const found = await prisma.form.findFirst({ where: { id: req.params.id, userId } });
  if (!found) return res.status(404).json({ error: "not_found" });
  // @ts-ignore - generated Prisma types will include Form after migration
  await prisma.form.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

// Public endpoint to fetch form structure (for rendering the form)
router.get("/public/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "form_id_required" });
  
  // @ts-ignore - generated Prisma types will include Form after migration
  const form = await prisma.form.findUnique({ 
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      fields: true,
      published: true,
    }
  });
  
  if (!form) return res.status(404).json({ error: "form_not_found" });
  if (!form.published) return res.status(404).json({ error: "form_not_published" });
  
  return res.json({
    id: form.id,
    name: form.name,
    description: form.description,
    fields: form.fields,
  });
});

// Public submit endpoint
router.post("/forms/:formId/submit", async (req, res) => {
  const { formId } = req.params;
  if (!formId) return res.status(400).json({ error: "form_id_required" });
  const data = req.body ?? {};
  
  // @ts-ignore - generated Prisma types will include relations after migration
  const form = await prisma.form.findUnique({ where: { id: formId }, include: { trigger: { include: { zap: true } } } });
  if (!form) return res.status(404).json({ error: "form_not_found" });

  // @ts-ignore - generated Prisma types will include FormSubmission after migration
  const submission = await prisma.formSubmission.create({ data: { formId, data } });

  // Transform field IDs to field labels for template variables
  // e.g., { "field-123": "john@example.com" } → { "email": "john@example.com" }
  const submissionData: any = {};
  const fields = (form.fields || []) as any[];
  
  for (const field of fields) {
    const fieldId = field.id;
    const fieldLabel = field.label?.toLowerCase().replace(/\s+/g, '_') || fieldId; // Convert "Email Address" → "email_address"
    if (data[fieldId] !== undefined) {
      submissionData[fieldLabel] = data[fieldId];
    }
  }
  
  console.log('📝 Form submission data transformation:');
  console.log('Raw data:', JSON.stringify(data, null, 2));
  console.log('Transformed submission:', JSON.stringify(submissionData, null, 2));

  // If form is linked to a trigger, publish to Kafka to trigger the workflow
  if (form.trigger) {
    const zapId = form.trigger.zapId;
    const p = await getProducer();
    await p.send({
      topic: ZAP_TRIGGER_TOPIC,
      messages: [
        { 
          key: zapId, 
          value: JSON.stringify({ 
            trigger: "form", 
            zapId, 
            payload: { 
              formId, 
              submissionId: submission.id, 
              data, // Raw data with field IDs
              submission: submissionData // Transformed data with field labels
            } 
          }) 
        },
      ],
    });
    return res.json({ ok: true, submissionId: submission.id, workflowTriggered: true });
  }
  
  // Form submission saved but no workflow attached
  return res.json({ ok: true, submissionId: submission.id, workflowTriggered: false });
});

export default router;
