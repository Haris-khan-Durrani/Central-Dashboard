import prisma from '../db';
import { fastCache } from '../cache';

export interface GhlWebhookPayload {
  type: string;
  locationId: string;
  id?: string;
  opportunityId?: string;
  contactId?: string;
  taskId?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  monetaryValue?: number;
  assignedTo?: string;
  name?: string;
  dueDate?: string;
  title?: string;
  source?: string;
  [key: string]: any;
}

export async function processGhlWebhook(locationId: string, payload: GhlWebhookPayload): Promise<void> {
  const eventType = payload.type || payload.event || '';
  const now = new Date();

  // Ensure location exists
  const loc = await prisma.ghlLocation.findUnique({
    where: { locationId },
  });
  if (!loc) return;

  // 1. Opportunity Events
  if (eventType.startsWith('Opportunity') || payload.opportunityId) {
    const oppId = payload.id || payload.opportunityId;
    if (!oppId) return;

    // Find or create local pipeline and stage if IDs are passed
    let localPipelineId: number | undefined;
    let localStageId: number | undefined;

    if (payload.pipelineId) {
      const p = await prisma.pipeline.findFirst({
        where: { locationId, ghlPipelineId: payload.pipelineId },
      });
      if (p) localPipelineId = p.id;
    }

    if (payload.pipelineStageId) {
      const s = await prisma.pipelineStage.findFirst({
        where: { locationId, ghlStageId: payload.pipelineStageId },
      });
      if (s) localStageId = s.id;
    }

    const existingOpp = await prisma.opportunity.findUnique({
      where: {
        locationId_ghlOpportunityId: {
          locationId,
          ghlOpportunityId: oppId,
        },
      },
    });

    const status = (payload.status || existingOpp?.status || 'open').toLowerCase();
    const monetaryValue = payload.monetaryValue !== undefined ? Number(payload.monetaryValue) : existingOpp?.monetaryValue || 0;
    const assignedTo = payload.assignedTo || existingOpp?.assignedTo || null;
    const name = payload.name || existingOpp?.name || 'Untitled Opportunity';
    const source = payload.source || existingOpp?.source || 'Direct';

    const wonAt = status === 'won' ? (existingOpp?.wonAt || now) : null;
    const lostAt = status === 'lost' ? (existingOpp?.lostAt || now) : null;

    // If stage changed, log history
    if (localStageId && existingOpp && existingOpp.stageId !== localStageId) {
      const durationSeconds = Math.round((now.getTime() - existingOpp.stageEnteredAt.getTime()) / 1000);
      
      // Update previous stage history record
      await prisma.opportunityStageHistory.create({
        locationId,
        opportunityId: existingOpp.id,
        pipelineId: localPipelineId || existingOpp.pipelineId,
        stageId: localStageId,
        fromStageId: existingOpp.stageId,
        assignedTo,
        enteredAt: now,
        durationSeconds,
      } as any);
    }

    if (existingOpp) {
      await prisma.opportunity.update({
        where: { id: existingOpp.id },
        data: {
          status,
          monetaryValue,
          assignedTo,
          name,
          source,
          updatedAt: now,
          wonAt,
          lostAt,
          ...(localPipelineId ? { pipelineId: localPipelineId } : {}),
          ...(localStageId ? { stageId: localStageId, stageEnteredAt: now } : {}),
        },
      });
    } else if (localPipelineId && localStageId) {
      const newOpp = await prisma.opportunity.create({
        data: {
          locationId,
          ghlOpportunityId: oppId,
          pipelineId: localPipelineId,
          stageId: localStageId,
          name,
          status,
          monetaryValue,
          source,
          assignedTo,
          wonAt,
          lostAt,
          stageEnteredAt: now,
        },
      });

      await prisma.opportunityStageHistory.create({
        data: {
          locationId,
          opportunityId: newOpp.id,
          pipelineId: localPipelineId,
          stageId: localStageId,
          assignedTo,
          enteredAt: now,
        },
      });
    }
  }

  // 2. Task Events
  if (eventType.startsWith('Task') || payload.taskId) {
    const taskId = payload.id || payload.taskId;
    if (!taskId) return;

    if (eventType === 'TaskDelete') {
      await prisma.task.deleteMany({
        where: { locationId, ghlTaskId: taskId },
      });
    } else {
      const isCompleted = eventType === 'TaskComplete' || Boolean(payload.completed);
      await prisma.task.upsert({
        where: {
          locationId_ghlTaskId: {
            locationId,
            ghlTaskId: taskId,
          },
        },
        update: {
          completed: isCompleted,
          completedAt: isCompleted ? now : null,
          title: payload.title,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          assignedTo: payload.assignedTo,
        },
        create: {
          locationId,
          ghlTaskId: taskId,
          title: payload.title || 'Task',
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          completed: isCompleted,
          completedAt: isCompleted ? now : null,
          assignedTo: payload.assignedTo || null,
        },
      });
    }
  }

  // Invalidate this location's cache
  fastCache.invalidateLocation(locationId);
}
