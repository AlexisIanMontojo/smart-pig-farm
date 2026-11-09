
import api from '@/services/api';

export const BREEDS = [
  'Landrace',
  'Large White',
  'Duroc',
  'Pietrain',
  'Landrace x Large White',
  'Berkshire',
];

export const HEALTH_STATUSES = [
  'Healthy',
  'Under Treatment',
  'Quarantined',
  'Deceased',
];

export const STAGES = [
  'Piglet',
  'Weaner',
  'Grower',
  'Finisher',
  'Breeding Sow',
  'Boar',
];

export const REPRO_STATUSES = [
  'Not Applicable',
  'Open',
  'Bred',
  'Pregnant',
  'Lactating',
];

export async function getPigs() {
  const response = await api.get('/pigs');
  return response.data.data;
}

export async function getPig(id) {
  const response = await api.get(`/pigs/${id}`);
  return response.data.data;
}

export async function createPig(payload) {
  const response = await api.post('/pigs', payload);
  return response.data.data;
}

export async function updatePig(id, payload) {
  const response = await api.put(`/pigs/${id}`, payload);
  return response.data.data;
}

export async function archivePig(id, archived) {
  const response = await api.patch(`/pigs/${id}/archive`, {
    archived,
  });

  return response.data;
}

export async function getPens() {
  const response = await api.get('/pens');
  return response.data.data;
}

export function nextPigId(pigs) {
  const max = pigs.reduce((acc, pig) => {
    const n = parseInt(String(pig.id).replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);

  return `PG-${String(max + 1).padStart(3, '0')}`;
}
