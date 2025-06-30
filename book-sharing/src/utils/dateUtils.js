export const getTimezoneFormattedDate = (timestamp, timezone = 'Asia/Kolkata') => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // First, convert IST to UTC by subtracting 5.5 hours
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const utcDate = new Date(date.getTime() - IST_OFFSET);

    // Create a timezone offset based on the selected timezone
    const timezoneOffsets = {
      'Asia/Kolkata': 5.5,
      'UTC': 0,
      'America/New_York': -5,
      'Europe/London': 0,
      'Asia/Dubai': 4, // UAE
      'Asia/Riyadh': 3, // Saudi Arabia
      'Australia/Sydney': 10 // Australia (Sydney)
    };
    
    const offsetHours = timezoneOffsets[timezone] || 5.5;
    const offsetMs = offsetHours * 60 * 60 * 1000;
    
    // Adjust the date based on the timezone offset
    const adjustedDate = new Date(utcDate.getTime() + offsetMs);
    
    // Format the date
    const options = { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    return adjustedDate.toLocaleString('en-US', options) + ` (${timezone})`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return timestamp;
  }
};
