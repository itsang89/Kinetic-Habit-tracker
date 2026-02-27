export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  const today = new Date();
  const todayKey = getLocalDateKey(today);

  // Format: "Mon 24 Feb"
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = date.getDate();
  const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
  
  const formatted = `${weekday} ${dayNum} ${monthStr}`;
  
  if (dateKey === todayKey) {
    return `Today, ${formatted}`;
  }
  
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);
  
  if (dateKey === yesterdayKey) {
    return `Yesterday, ${formatted}`;
  }
  
  return formatted;
};

export const getDateString = (date: Date = new Date()): string => {
  return getLocalDateKey(date);
};

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatFullDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return getLocalDateKey(d1) === getLocalDateKey(d2);
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};
