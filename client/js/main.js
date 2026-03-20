const statusNode = document.getElementById('status');

async function loadHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    statusNode.textContent = `Server status: ${data.status}`;
  } catch {
    statusNode.textContent = 'Server status: unavailable';
  }
}

loadHealth();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/serviceWorker.js');
    } catch {
      // Silent fail to keep client startup simple.
    }
  });
}
