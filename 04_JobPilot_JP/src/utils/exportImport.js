export function exportToJSON(jobs) {
  const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), jobs }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `jobpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.jobs || !Array.isArray(parsed.jobs)) throw new Error('Invalid format');
        resolve(parsed.jobs);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
