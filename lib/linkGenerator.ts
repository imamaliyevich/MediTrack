// Unique patient link generator
export function generatePatientLink(patientId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return `${baseUrl}/bemor/${patientId}`;
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique patient ID with name
export function generateUniquePatientId(patientName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 6);
  const cleanName = patientName.replace(/\s+/g, '').toLowerCase();
  return `${cleanName}-${timestamp}-${randomStr}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  } catch (err) {
    document.body.removeChild(textArea);
    return Promise.reject(err);
  }
}
