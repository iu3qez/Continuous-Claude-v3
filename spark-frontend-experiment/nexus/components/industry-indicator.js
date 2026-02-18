import { loadIndustryData, getIndustryFromUrl } from './industry.js';

const INDUSTRIES = [
  { id: 'consulting', label: 'Consulting', color: '#3B82F6' },
  { id: 'tech', label: 'Technology', color: '#8B5CF6' },
  { id: 'hospitality', label: 'Hospitality', color: '#10B981' },
];

export function createIndustryIndicator() {
  const el = document.createElement('div');
  el.id = 'industry-indicator';
  el.style.cssText = `
    position: fixed; bottom: 80px; left: 16px; z-index: 9998;
    background: rgba(22,22,24,0.95); backdrop-filter: blur(12px);
    border: 1px solid var(--border, #2A2A35); border-radius: 8px;
    padding: 6px 12px; display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--txt-secondary, #8A8A8E);
    cursor: pointer;
  `;

  const current = getIndustryFromUrl();
  const industry = INDUSTRIES.find(i => i.id === current) || INDUSTRIES[0];

  el.innerHTML = `
    <span style="width:8px;height:8px;border-radius:50%;background:${industry.color};display:inline-block"></span>
    <select id="industry-select" style="background:transparent;border:none;color:var(--txt-secondary,#8A8A8E);font-size:12px;cursor:pointer;outline:none;">
      ${INDUSTRIES.map(i => `<option value="${i.id}" ${i.id === current ? 'selected' : ''}>${i.label}</option>`).join('')}
    </select>
  `;

  el.querySelector('#industry-select').addEventListener('change', (e) => {
    const newId = e.target.value;
    loadIndustryData(newId);
    const ind = INDUSTRIES.find(i => i.id === newId);
    el.querySelector('span').style.background = ind ? ind.color : '#888';
    window.dispatchEvent(new CustomEvent('workbook:industry-changed', {
      detail: { industry: newId },
    }));
  });

  return el;
}

export function initIndustryIndicator() {
  const el = createIndustryIndicator();
  document.body.appendChild(el);
}
