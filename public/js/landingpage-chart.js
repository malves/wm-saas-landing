(function() {
  let chartInstance = null;
  let currentPeriod = 'period7';
  let chartData = null;

  function formatNumber(value) {
    return value.toLocaleString('fr-FR');
  }

  function updateStats(period) {
    const data = chartData[period];
    if (!data) return;

    document.getElementById('stat-peak-volume').textContent = formatNumber(data.peakVolume);
    document.getElementById('stat-peak-day').textContent = data.peakVolumeDay;
    document.getElementById('stat-best-line').textContent = data.bestLine;
    document.getElementById('stat-best-day').textContent = data.bestLineDay;
    document.getElementById('stat-avg-line').textContent = data.avgLine;
  }

  function updateButtons(activePeriod) {
    const btn7 = document.getElementById('btn-7days');
    const btn15 = document.getElementById('btn-15days');
    
    if (!btn7 || !btn15) return;

    if (activePeriod === 'period7') {
      btn7.className = 'px-4 py-2 rounded-full bg-primary text-white';
      btn15.className = 'px-4 py-2 rounded-full border border-border text-muted hover:text-primary transition';
    } else {
      btn7.className = 'px-4 py-2 rounded-full border border-border text-muted hover:text-primary transition';
      btn15.className = 'px-4 py-2 rounded-full bg-primary text-white';
    }
  }

  function renderChart(period) {
    console.log('🔵 renderChart appelé avec période:', period);
    const canvas = document.getElementById('landingPagePerformanceChart');
    
    if (!canvas) {
      console.log('ℹ️ Canvas introuvable - Cette page ne contient pas de graphique');
      return;
    }
    
    if (!window.Chart) {
      console.error('❌ Chart.js non chargé - attente...');
      setTimeout(() => renderChart(period), 100);
      return;
    }

    if (!chartData) {
      const raw = canvas.dataset.chart ? JSON.parse(canvas.dataset.chart) : null;
      console.log('🔵 Données brutes:', raw);
      
      if (!raw) {
        console.error('❌ Données manquantes');
        return;
      }
      chartData = raw;
    }

    const data = chartData[period];
    if (!data) {
      console.error('❌ Période invalide:', period);
      return;
    }

    const ctx = canvas.getContext('2d');
    
    console.log('✅ Initialisation Chart.js...');

    // Détruire l'ancienne instance si elle existe
    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            type: 'bar',
            label: 'Visiteurs',
            data: data.bars,
            backgroundColor: 'rgba(51, 65, 85, 0.75)',
            hoverBackgroundColor: 'rgba(51, 65, 85, 0.95)',
            borderRadius: 18,
            barThickness: 32,
            borderSkipped: false
          },
          {
            type: 'line',
            label: "Leads",
            data: data.line,
            yAxisID: 'y1',
            borderColor: '#0f172a',
            borderWidth: 2.5,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#e2e8f0',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#e5e7eb',
            padding: 12,
            callbacks: {
              label: context => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value.toLocaleString('fr-FR')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#9ca3af',
              font: { family: 'Inter, sans-serif', size: 12 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(148,163,184,0.25)',
              drawBorder: false
            },
            ticks: {
              color: '#9ca3af',
              callback: value => value.toLocaleString('fr-FR')
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#9ca3af',
              callback: value => value.toLocaleString('fr-FR')
            }
          }
        }
      }
    });
    
    updateStats(period);
    updateButtons(period);
    currentPeriod = period;
    
    console.log('✅ Chart créé avec succès');
  }

  function init() {
    // Vérifier si le canvas existe avant d'initialiser
    const canvas = document.getElementById('landingPagePerformanceChart');
    
    if (!canvas) {
      console.log('ℹ️ Graphique de performance non présent sur cette page');
      return;
    }
    
    console.log('✅ Canvas trouvé - Initialisation du graphique');
    renderChart('period7');

    // Gérer les clics sur les boutons
    const btn7 = document.getElementById('btn-7days');
    const btn15 = document.getElementById('btn-15days');

    if (btn7) {
      btn7.addEventListener('click', () => {
        if (currentPeriod !== 'period7') {
          renderChart('period7');
        }
      });
    }

    if (btn15) {
      btn15.addEventListener('click', () => {
        if (currentPeriod !== 'period15') {
          renderChart('period15');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
