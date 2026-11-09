import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);
ChartJS.defaults.font.family = '"Segoe UI", Inter, Roboto, system-ui, sans-serif';
ChartJS.defaults.color = '#6b7a71';
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
