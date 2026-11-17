export function getArrivalDayInfo(arrivalDate) {
  if (!arrivalDate) {
    return {
      text: "Welcome to Campus Compass",
      isArrived: true,
      dayNumber: 1,
      daysDiff: 0
    };
  }

  const arrival = new Date(arrivalDate);
  const now = new Date();

  const arrivalUtc = Date.UTC(arrival.getFullYear(), arrival.getMonth(), arrival.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.round((nowUtc - arrivalUtc) / msPerDay);

  if (daysDiff >= 0) {
    const dayNumber = daysDiff + 1;
    return {
      text: `Day ${dayNumber} in India`,
      isArrived: true,
      dayNumber,
      daysDiff
    };
  }

  const daysUntil = Math.abs(daysDiff);
  return {
    text: `Arriving in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}`,
    isArrived: false,
    dayNumber: 0,
    daysDiff: daysUntil
  };
}

export function getDeadlineInfo(arrivalDate, offsetDays) {
  if (!arrivalDate || offsetDays === undefined || offsetDays === null) {
    return {
      isOverdue: false,
      text: "Flexible deadline",
      badgeVariant: "neutral",
      daysLeft: 999
    };
  }

  const arrival = new Date(arrivalDate);
  const deadline = new Date(arrival.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  const deadlineUtc = Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.round((deadlineUtc - nowUtc) / msPerDay);

  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return {
      isOverdue: true,
      text: `${overdueDays}d overdue`,
      badgeVariant: "danger",
      daysLeft
    };
  }

  if (daysLeft === 0) {
    return {
      isOverdue: false,
      text: "Due today",
      badgeVariant: "warning",
      daysLeft: 0
    };
  }

  if (daysLeft <= 3) {
    return {
      isOverdue: false,
      text: `${daysLeft}d left`,
      badgeVariant: "warning",
      daysLeft
    };
  }

  return {
    isOverdue: false,
    text: `${daysLeft}d left`,
    badgeVariant: "neutral",
    daysLeft
  };
}

export function calculateProgress(doneCount, totalCount) {
  if (!totalCount || totalCount <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((doneCount / totalCount) * 100)));
}

