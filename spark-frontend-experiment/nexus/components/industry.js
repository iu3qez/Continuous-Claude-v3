import WorkbookDemo from './state.js';

// Dataset registry - datasets register themselves here
const datasets = {};

export function registerDataset(id, data) {
  datasets[id] = data;
}

export function loadIndustryData(industryId) {
  if (!datasets[industryId]) return null;
  WorkbookDemo.data = datasets[industryId];
  WorkbookDemo.switchIndustry(industryId);
  return datasets[industryId];
}

export function getCurrentIndustry() {
  return WorkbookDemo.data;
}

export function reloadIndustryData() {
  var id = WorkbookDemo.industry;
  if (datasets[id]) {
    WorkbookDemo.data = datasets[id];
  }
}

export function getIndustryFromUrl(search) {
  const params = new URLSearchParams(search || window.location.search);
  const industry = params.get('industry');
  if (industry && datasets[industry]) return industry;
  return localStorage.getItem('workbook-industry') || 'consulting';
}

export function initIndustry() {
  const id = getIndustryFromUrl();
  loadIndustryData(id);
}
