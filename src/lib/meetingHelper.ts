export interface ParsedMeetingDetails {
  clientName: string;
  hostName: string;
  bookedBy: string | null;
  modeLabel: string;
  modeType: 'zoom' | 'google_meet' | 'in_person' | 'phone' | 'teams' | 'custom';
  displayTitle: string;
}

/**
 * Intelligently parse appointment title, contact name, and agent info.
 * Extracts:
 * 1. Real client name (even if GHL contactName is generic like "Lead Appointment")
 * 2. Host name (who the meeting is with: e.g. "Yasmin", "Amin")
 * 3. Booker initials/tag (e.g. "(MA)", "(AK)")
 * 4. Meeting mode (In-Person, Zoom, Google Meet, Phone)
 */
export function parseMeetingDetails(
  title: string | null | undefined,
  contactName: string | null | undefined,
  defaultAgentName: string = 'Assigned Rep',
  rawLocationType: string = ''
): ParsedMeetingDetails {
  const rawTitle = (title || '').trim();
  const rawContact = (contactName || '').trim();
  const isGenericContact =
    !rawContact ||
    ['lead appointment', 'client appointment', 'client', 'contact', 'appointment', 'unknown', 'meeting'].includes(
      rawContact.toLowerCase()
    );

  let clientName = !isGenericContact ? rawContact : '';
  let hostName = defaultAgentName || 'Assigned Rep';
  let bookedBy: string | null = null;
  let detectedMode: 'zoom' | 'google_meet' | 'in_person' | 'phone' | 'teams' | 'custom' | null = null;
  let modeLabel = 'Meeting';

  // 1. Extract any booker initials in parentheses: e.g. "(MA)" or "( AK )"
  const allParentheses = rawTitle.match(/\(\s*([A-Za-z0-9_\-\s]{2,15})\s*\)/g);
  if (allParentheses) {
    for (const matchStr of allParentheses) {
      const inner = matchStr.replace(/[()]/g, '').trim();
      const lower = inner.toLowerCase();
      // Skip if it describes mode
      if (['zoom', 'gmeet', 'call', 'phone', 'online', 'f2f', 'in person'].includes(lower)) {
        continue;
      }
      bookedBy = inner;
      break;
    }
  }

  // 2. Check for "to meet" pattern (e.g. "Saif Nasser to meet Yasmin physically (MA)")
  const toMeetRegex = /^(.+?)\s+to\s+meet\s+(.+)$/i;
  const toMeetMatch = rawTitle.match(toMeetRegex);

  if (toMeetMatch) {
    let leftSide = toMeetMatch[1].trim();
    let rightSide = toMeetMatch[2].trim();

    // If left side has booker tag e.g. "Nadeem Fadi Romi ( AK )"
    const leftBooker = leftSide.match(/^(.+?)\s*\(\s*([A-Za-z0-9_\-\s]{2,15})\s*\)$/);
    if (leftBooker) {
      leftSide = leftBooker[1].trim();
      if (!bookedBy) bookedBy = leftBooker[2].trim();
    }

    if (!clientName) {
      clientName = leftSide;
    }

    // Process right side
    // Strip booker tags from right side
    let cleanRight = rightSide.replace(/\(\s*([A-Za-z0-9_\-\s]{2,15})\s*\)/g, '').trim();

    // Check mode keywords in right side
    if (/via\s+zoom/i.test(cleanRight) || /on\s+zoom/i.test(cleanRight)) {
      detectedMode = 'zoom';
      modeLabel = 'Zoom';
      cleanRight = cleanRight.replace(/via\s+zoom/i, '').replace(/on\s+zoom/i, '').trim();
    } else if (/via\s+gm/i.test(cleanRight) || /google\s*meet/i.test(cleanRight) || /\bgm\b/i.test(cleanRight)) {
      detectedMode = 'google_meet';
      modeLabel = 'Google Meet';
      cleanRight = cleanRight.replace(/via\s+gm/i, '').replace(/google\s*meet/i, '').replace(/\bgm\b/i, '').trim();
    } else if (/physically/i.test(cleanRight) || /in\s*person/i.test(cleanRight) || /face\s*to\s*face/i.test(cleanRight) || /at\s+office/i.test(cleanRight)) {
      detectedMode = 'in_person';
      modeLabel = 'In-Person';
      cleanRight = cleanRight.replace(/physically/i, '').replace(/in\s*person/i, '').replace(/face\s*to\s*face/i, '').replace(/at\s+office/i, '').trim();
    } else if (/phone|call/i.test(cleanRight)) {
      detectedMode = 'phone';
      modeLabel = 'Phone Call';
      cleanRight = cleanRight.replace(/phone|call/i, '').trim();
    }

    if (cleanRight) {
      hostName = cleanRight;
    }
  } else {
    // No "to meet" pattern
    if (rawTitle && !['client appointment', 'lead appointment', 'meeting'].includes(rawTitle.toLowerCase())) {
      if (!clientName) {
        if (rawTitle.toLowerCase().startsWith('for ')) {
          clientName = rawTitle.replace(/^for\s+/i, '').trim();
        } else {
          clientName = rawTitle;
        }
      }
    }
  }

  // Fallback for clientName
  if (!clientName) {
    clientName = 'Client';
  }

  // 3. Fallback mode detection if not already extracted from rightSide
  if (!detectedMode) {
    const titleLower = rawTitle.toLowerCase();
    const typeLower = (rawLocationType || '').toLowerCase().replace(/[_\-\s]/g, '');

    if (
      titleLower.includes('physically') ||
      titleLower.includes('in person') ||
      titleLower.includes('in-person') ||
      titleLower.includes('at office') ||
      titleLower.includes('face to face') ||
      titleLower.includes('f2f') ||
      typeLower.includes('person') ||
      typeLower.includes('office')
    ) {
      detectedMode = 'in_person';
      modeLabel = 'In-Person';
    } else if (
      titleLower.includes('via gm') ||
      titleLower.includes('google meet') ||
      titleLower.includes('gmeet') ||
      /\bgm\b/.test(titleLower) ||
      typeLower.includes('google') ||
      typeLower === 'meet'
    ) {
      detectedMode = 'google_meet';
      modeLabel = 'Google Meet';
    } else if (titleLower.includes('teams') || typeLower.includes('teams')) {
      detectedMode = 'teams';
      modeLabel = 'MS Teams';
    } else if (
      titleLower.includes('phone') ||
      titleLower.includes('via call') ||
      titleLower.includes('on call') ||
      typeLower.includes('phone') ||
      typeLower.includes('call')
    ) {
      detectedMode = 'phone';
      modeLabel = 'Phone Call';
    } else if (titleLower.includes('zoom') || typeLower.includes('zoom')) {
      detectedMode = 'zoom';
      modeLabel = 'Zoom';
    } else {
      detectedMode = 'custom';
      modeLabel = 'Meeting';
    }
  }

  const displayTitle =
    rawTitle && !['client appointment', 'lead appointment', 'meeting'].includes(rawTitle.toLowerCase())
      ? rawTitle
      : `Meeting with ${clientName}`;

  return {
    clientName,
    hostName,
    bookedBy,
    modeLabel,
    modeType: detectedMode,
    displayTitle,
  };
}
