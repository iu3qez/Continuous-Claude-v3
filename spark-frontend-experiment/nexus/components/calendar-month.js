// Workspace color map (matches CSS custom properties from nexus-tokens)
const WS_COLORS = {
  operations: '#F59E0B',
  engineering: '#3B82F6',
  sales: '#EC4899',
  finance: '#10B981',
  hr: '#8B5CF6'
};

// Default meeting data for Feb 2026
const DEFAULT_MEETINGS = {
  2: [{ workspace: 'operations' }],
  3: [{ workspace: 'engineering' }],
  5: [{ workspace: 'sales' }, { workspace: 'operations' }],
  9: [{ workspace: 'operations' }],
  10: [{ workspace: 'operations' }, { workspace: 'operations' }],
  11: [{ workspace: 'engineering' }],
  12: [{ workspace: 'operations' }, { workspace: 'finance' }],
  13: [{ workspace: 'operations' }],
  14: [{ workspace: 'operations' }, { workspace: 'engineering' }],
  16: [{ workspace: 'sales' }],
  17: [{ workspace: 'engineering' }, { workspace: 'operations' }],
  19: [{ workspace: 'finance' }],
  20: [{ workspace: 'operations' }, { workspace: 'engineering' }, { workspace: 'sales' }],
  23: [{ workspace: 'operations' }],
  24: [{ workspace: 'engineering' }, { workspace: 'hr' }],
  25: [{ workspace: 'operations' }],
  26: [{ workspace: 'finance' }, { workspace: 'sales' }],
  27: [{ workspace: 'engineering' }],
};

/**
 * Create a single day cell element
 */
function createDayCell(dayNum, isOtherMonth, isToday, meetings) {
  const cell = document.createElement('div');
  cell.className = 'month-cell';
  if (isOtherMonth) cell.className += ' other-month';
  if (isToday) cell.className += ' today-cell';

  const numDiv = document.createElement('div');
  numDiv.className = 'day-number';
  numDiv.textContent = dayNum;
  cell.appendChild(numDiv);

  if (meetings && meetings.length > 0) {
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'meeting-dots';
    // Show one dot per meeting, colored by workspace
    meetings.forEach(function(m) {
      const dot = document.createElement('div');
      dot.className = 'meeting-dot';
      dot.style.background = WS_COLORS[m.workspace] || '#6B6B70';
      dot.title = m.workspace;
      dotsDiv.appendChild(dot);
    });
    cell.appendChild(dotsDiv);
  }

  return cell;
}

/**
 * Build a complete month grid element with headers and day cells
 * @param {number} year - Full year (e.g., 2026)
 * @param {number} month - Zero-indexed month (0 = Jan, 1 = Feb)
 * @param {Object} meetings - Optional meeting data keyed by day number
 * @returns {HTMLElement} Grid element with month-grid class
 */
export function buildMonthGrid(year, month, meetings = null) {
  const grid = document.createElement('div');
  grid.className = 'month-grid';
  grid.id = 'month-grid';

  // Add 7 day headers (Mon-Sun)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  dayNames.forEach(name => {
    const header = document.createElement('div');
    header.className = 'month-day-header';
    header.textContent = name;
    grid.appendChild(header);
  });

  // If no meetings provided, use defaults for Feb 2026
  if (meetings === null && year === 2026 && month === 1) {
    meetings = DEFAULT_MEETINGS;
  } else if (meetings === null) {
    meetings = {};
  }

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() returns 0=Sun, convert to Mon-start: (day + 6) % 7
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  // Previous month days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const cell = createDayCell(day, true, false, []);
    grid.appendChild(cell);
  }

  // Current month days
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentMonth && today.getDate() === d;
    const cell = createDayCell(d, false, isToday, meetings[d] || []);
    grid.appendChild(cell);
  }

  // Fill remaining cells to complete the grid (total = 7 * rows)
  const totalCells = startOffset + daysInMonth;
  const remainder = totalCells % 7;
  if (remainder > 0) {
    for (let n = 1; n <= 7 - remainder; n++) {
      const cell = createDayCell(n, true, false, []);
      grid.appendChild(cell);
    }
  }

  return grid;
}

/**
 * Get meeting data for a specific month
 * @param {number} year - Full year
 * @param {number} month - Zero-indexed month
 * @returns {Object} Meeting data keyed by day number
 */
export function getMonthMeetings(year, month) {
  // Return default meeting data for Feb 2026
  if (year === 2026 && month === 1) {
    return DEFAULT_MEETINGS;
  }
  return {};
}

/**
 * Navigate to previous or next month
 * @param {number} year - Current year
 * @param {number} month - Current month (0-indexed)
 * @param {number} direction - +1 for next month, -1 for previous
 * @returns {Array} [newYear, newMonth]
 */
export function navigateMonth(year, month, direction) {
  let newMonth = month + direction;
  let newYear = year;
  if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }
  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  }
  return [newYear, newMonth];
}
