// Script pour gérer l'ouverture/fermeture du popup notifications
document.addEventListener('DOMContentLoaded', () => {
  const notifToggle = document.getElementById('notif-toggle');
  const notifPanel = document.getElementById('notif-panel');

  if (notifToggle && notifPanel) {
    notifToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!notifPanel.contains(e.target) && !notifToggle.contains(e.target)) {
        notifPanel.classList.add('hidden');
      }
    });
  }

  // Filtres pour pages activity
  const filterButtons = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.activity-row, .newsletter-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      
      // Update active button
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('text-muted', 'border-border');
      });
      button.classList.add('bg-primary', 'text-white');
      button.classList.remove('text-muted');

      // Filter items
      items.forEach(item => {
        const category = item.getAttribute('data-category') || item.getAttribute('data-status');
        if (filter === 'all' || category === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Auto-refresh time display
  const syncTime = document.getElementById('syncTime');
  if (syncTime) {
    function updateTime() {
      const now = new Date();
      syncTime.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
  }
});

