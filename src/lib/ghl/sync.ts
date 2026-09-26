import prisma from '../db';
import { getGhlClientForLocation, GhlClient } from './client-factory';
import { decryptString } from '../crypto';
import { fastCache } from '../cache';
import { normalizeLeadSource } from '../kpi/engine';

export async function syncLocationData(
  locationId: string,
  options: { incremental?: boolean } = {}
): Promise<{ success: boolean; message: string }> {
  try {
    const isIncremental = options.incremental === true;

    // Mark status as syncing
    await prisma.ghlLocation.update({
      where: { locationId },
      data: { syncStatus: 'syncing', syncErrorMessage: null },
    });

    const loc = await prisma.ghlLocation.findUnique({ where: { locationId } });
    if (!loc) throw new Error('Location not found in database');
    const token = decryptString(loc.encryptedPrivateKey);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // 1. Sync Pipelines and Stages
    const pipeRes = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`, { headers });
    const pipeData = await pipeRes.json();
    const pipelines = pipeData.pipelines || [];

    const pipelineMap = new Map<string, number>();
    const stageMap = new Map<string, number>();

    for (const p of pipelines) {
      const ghlPipelineId = String(p.id || p._id || p.pipelineId || '');
      if (!ghlPipelineId) continue;

      const dbPipeline = await prisma.pipeline.upsert({
        where: {
          locationId_ghlPipelineId: {
            locationId,
            ghlPipelineId,
          },
        },
        update: { name: p.name || 'Pipeline' },
        create: {
          locationId,
          ghlPipelineId,
          name: p.name || 'Pipeline',
        },
      });

      pipelineMap.set(ghlPipelineId, dbPipeline.id);

      if (Array.isArray(p.stages)) {
        for (let i = 0; i < p.stages.length; i++) {
          const s = p.stages[i];
          const ghlStageId = String(s.id || s._id || s.stageId || '');
          if (!ghlStageId) continue;

          const dbStage = await prisma.pipelineStage.upsert({
            where: {
              locationId_ghlStageId: {
                locationId,
                ghlStageId,
              },
            },
            update: {
              name: s.name || 'Stage',
              position: i,
              pipelineId: dbPipeline.id,
            },
            create: {
              locationId,
              pipelineId: dbPipeline.id,
              ghlStageId,
              name: s.name || 'Stage',
              position: i,
            },
          });

          stageMap.set(ghlStageId, dbStage.id);
        }
      }
    }

    // 2. Sync Users (skip in incremental mode if users already exist)
    const existingUserCount = await prisma.user.count({ where: { locationId } });
    let users: any[] = [];
    if (!isIncremental || existingUserCount === 0) {
      const userRes = await fetch(`https://services.leadconnectorhq.com/users/?locationId=${locationId}`, { headers });
      const userData = await userRes.json();
      users = userData.users || [];

      for (const u of users) {
        const ghlUserId = String(u.id || u._id || u.userId || '');
        if (!ghlUserId) continue;

        await prisma.user.upsert({
          where: {
            locationId_ghlUserId: {
              locationId,
              ghlUserId,
            },
          },
          update: {
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'User',
            email: u.email || null,
            role: u.roles?.role || u.role || 'Sales Consultant',
            avatarUrl: u.avatar || null,
          },
          create: {
            locationId,
            ghlUserId,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'User',
            email: u.email || null,
            role: u.roles?.role || u.role || 'Sales Consultant',
            avatarUrl: u.avatar || null,
          },
        });
      }
    }

    // 3. Paginated Sync for Opportunities (1 page for incremental ~100 opps, up to 30 pages for full sync)
    const maxPages = isIncremental ? 1 : 30;
    let nextUrl: string | null = `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&limit=100`;
    let totalOppCount = 0;
    let page = 1;

    while (nextUrl && page <= maxPages) {
      const currentUrl: string = nextUrl;
      const oppRes: Response = await fetch(currentUrl, { headers });
      if (!oppRes.ok) break;

      const oppData = await oppRes.json();
      const batch = oppData.opportunities || [];
      if (batch.length === 0) break;

      for (const opp of batch) {
        const ghlOppId = String(opp.id || opp._id || opp.opportunityId || '');
        if (!ghlOppId) continue;

        const pId = opp.pipelineId ? pipelineMap.get(String(opp.pipelineId)) : undefined;
        const sId = opp.pipelineStageId ? stageMap.get(String(opp.pipelineStageId)) : undefined;
        if (!pId || !sId) continue;

        const status = (opp.status || 'open').toLowerCase();
        const monetaryValue = Number(opp.monetaryValue || 0);
        const createdAt = opp.createdAt ? new Date(opp.createdAt) : new Date();
        const updatedAt = opp.updatedAt ? new Date(opp.updatedAt) : createdAt;
        const wonAt = status === 'won' ? new Date(opp.lastStatusChangeAt || updatedAt) : null;
        const lostAt = (status === 'lost' || status === 'abandoned') ? new Date(opp.lastStatusChangeAt || updatedAt) : null;
        const stageEnteredAt = opp.lastStageChangeAt ? new Date(opp.lastStageChangeAt) : createdAt;
        const rawSource = opp.source || opp.attributions?.[0]?.medium || 'Direct';
        const source = normalizeLeadSource(rawSource).displayName;

        await prisma.opportunity.upsert({
          where: { locationId_ghlOpportunityId: { locationId, ghlOpportunityId: ghlOppId } },
          update: {
            name: opp.name || 'Opportunity',
            status,
            monetaryValue,
            assignedTo: opp.assignedTo || null,
            pipelineId: pId,
            stageId: sId,
            source,
            createdAt,
            updatedAt,
            wonAt,
            lostAt,
            stageEnteredAt,
          },
          create: {
            locationId,
            ghlOpportunityId: ghlOppId,
            name: opp.name || 'Opportunity',
            status,
            monetaryValue,
            assignedTo: opp.assignedTo || null,
            pipelineId: pId,
            stageId: sId,
            source,
            createdAt,
            updatedAt,
            wonAt,
            lostAt,
            stageEnteredAt,
          },
        });
      }

      totalOppCount += batch.length;

      if (oppData.meta?.nextPageUrl) {
        nextUrl = oppData.meta.nextPageUrl;
        page++;
      } else {
        break;
      }
    }

    // 4. Sync Tasks (both pending and completed)
    const allTasks: any[] = [];
    try {
      const taskRes1 = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/tasks/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ completed: false, limit: 100 }),
      });
      if (taskRes1.ok) {
        const taskData1 = await taskRes1.json();
        allTasks.push(...(taskData1.tasks || []));
      }

      const taskRes2 = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/tasks/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ completed: true, limit: 100 }),
      });
      if (taskRes2.ok) {
        const taskData2 = await taskRes2.json();
        allTasks.push(...(taskData2.tasks || []));
      }
    } catch (tErr) {
      console.warn('Task sync error:', tErr);
    }

    for (let idx = 0; idx < allTasks.length; idx++) {
      const t = allTasks[idx];
      const ghlTaskId = String(t.id || t._id || t.taskId || `task_${locationId}_${idx}`);

      await prisma.task.upsert({
        where: { locationId_ghlTaskId: { locationId, ghlTaskId } },
        update: {
          title: t.title || 'Follow-up Task',
          body: t.body || null,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          completed: Boolean(t.completed),
          completedAt: t.completed ? (t.completedAt ? new Date(t.completedAt) : new Date()) : null,
          assignedTo: t.assignedTo || null,
        },
        create: {
          locationId,
          ghlTaskId,
          title: t.title || 'Follow-up Task',
          body: t.body || null,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          completed: Boolean(t.completed),
          completedAt: t.completed ? (t.completedAt ? new Date(t.completedAt) : new Date()) : null,
          assignedTo: t.assignedTo || null,
        },
      });
    }

    // 5. Sync Appointments / Bookings if enabled
    let appointmentsCount = 0;
    if (loc.enableBookings !== false) {
      try {
        const client = new GhlClient({ locationId, privateKey: token });
        const events = await client.getCalendarEvents();
        if (Array.isArray(events) && events.length > 0) {
          appointmentsCount = events.length;
          for (const ev of events) {
            const ghlAppointmentId = String(ev.id || ev._id || ev.appointmentId || '');
            if (!ghlAppointmentId) continue;

            const startTime = ev.startTime ? new Date(ev.startTime) : (ev.start ? new Date(ev.start) : new Date());
            const endTime = ev.endTime ? new Date(ev.endTime) : (ev.end ? new Date(ev.end) : null);
            const status = String(ev.status || ev.appointmentStatus || 'confirmed').toLowerCase();
            const meetingLocationType = String(ev.meetingLocationType || ev.locationType || ev.meetingType || 'zoom').toLowerCase();

            let contactId: number | null = null;
            let contactName = ev.contactName || (ev.contact ? `${ev.contact.firstName || ''} ${ev.contact.lastName || ''}`.trim() : null) || null;
            let contactPhone = ev.contactPhone || ev.contact?.phone || null;
            let contactEmail = ev.contactEmail || ev.contact?.email || null;

            if (ev.contactId) {
              const matchedContact = await prisma.contact.findUnique({
                where: { locationId_ghlContactId: { locationId, ghlContactId: String(ev.contactId) } },
                select: { id: true, firstName: true, lastName: true, phone: true, email: true },
              });
              if (matchedContact) {
                contactId = matchedContact.id;
                if (!contactName) contactName = `${matchedContact.firstName || ''} ${matchedContact.lastName || ''}`.trim();
                if (!contactPhone) contactPhone = matchedContact.phone;
                if (!contactEmail) contactEmail = matchedContact.email;
              }
            }

            const assignedTo = String(ev.assignedUserId || ev.userId || ev.calendarOwner || '');

            await prisma.appointment.upsert({
              where: {
                locationId_ghlAppointmentId: {
                  locationId,
                  ghlAppointmentId,
                },
              },
              update: {
                title: ev.title || 'Meeting',
                contactId,
                contactName,
                contactPhone,
                contactEmail,
                assignedTo: assignedTo || null,
                calendarId: ev.calendarId ? String(ev.calendarId) : null,
                calendarName: ev.calendarName || null,
                startTime,
                endTime,
                status,
                meetingLocationType,
                meetingUrl: ev.meetingUrl || ev.joinUrl || null,
                notes: ev.notes || ev.description || null,
              },
              create: {
                locationId,
                ghlAppointmentId,
                title: ev.title || 'Meeting',
                contactId,
                contactName,
                contactPhone,
                contactEmail,
                assignedTo: assignedTo || null,
                calendarId: ev.calendarId ? String(ev.calendarId) : null,
                calendarName: ev.calendarName || null,
                startTime,
                endTime,
                status,
                meetingLocationType,
                meetingUrl: ev.meetingUrl || ev.joinUrl || null,
                notes: ev.notes || ev.description || null,
              },
            });
          }
        }
      } catch (calErr) {
        console.warn(`Sync warning: Could not sync calendar events for ${locationId}:`, calErr);
      }
    }

    // Mark sync success
    await prisma.ghlLocation.update({
      where: { locationId },
      data: {
        syncStatus: 'success',
        lastSyncAt: new Date(),
        syncErrorMessage: null,
      },
    });

    // Invalidate cached reports for this location
    fastCache.invalidateLocation(locationId);

    return {
      success: true,
      message: `Successfully synchronized: ${pipelines.length} pipelines, ${users.length} agents, ${totalOppCount} opportunities, ${allTasks.length} tasks.`,
    };
  } catch (err: any) {
    console.error(`Sync error for location ${locationId}:`, err);
    await prisma.ghlLocation.update({
      where: { locationId },
      data: {
        syncStatus: 'error',
        syncErrorMessage: err.message,
      },
    });
    return {
      success: false,
      message: err.message || 'Sync failed',
    };
  }
}
