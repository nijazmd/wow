document.addEventListener('DOMContentLoaded', async () => {
  const vehicleList = document.getElementById('vehicleList');
const [allVehicles, serviceIntervals, maintenanceData, documents] = await Promise.all([
  fetchVehicleData(),
  fetchServiceIntervals(),
  fetchMaintenanceData(),
  fetchDocumentsData()
]);


const toggleBtn = document.getElementById('toggleFiltersBtn');
const filterPanel = document.querySelector('.filterSortPanel');

toggleBtn.addEventListener('click', () => {
  const isVisible = !filterPanel.classList.contains('hidden');
  filterPanel.classList.toggle('hidden');
  toggleBtn.textContent = isVisible ? 'Show Filters & Sort' : 'Hide Filters & Sort';
});



  // Filter checkbox groups
  populateCheckboxGroup('filterMakeGroup', getUniqueValues(allVehicles, 'make'), 'filterMake');
  populateCheckboxGroup('filterCategoryGroup', getUniqueValues(allVehicles, 'category'), 'filterCategory');
  populateCheckboxGroup('filterClassGroup', getUniqueValues(allVehicles, 'class'), 'filterClass');
  populateCheckboxGroup('filterFuelTypeGroup', getUniqueValues(allVehicles, 'fuelType'), 'filterFuelType');
  populateCheckboxGroup('filterDrivetrainGroup', getUniqueValues(allVehicles, 'drivetrain'), 'filterDrivetrain');
  populateCheckboxGroup('filterGearboxGroup', getUniqueValues(allVehicles, 'gearbox'), 'filterGearbox');
  populateCheckboxGroup('filterColorGroup', getUniqueValues(allVehicles, 'colors'), 'filterColor');
  populateCheckboxGroup('filterOwnerGroup', getUniqueNamesFromField(allVehicles, 'owners'), 'filterOwner');
  populateCheckboxGroup('filterRcOwnerGroup', getUniqueValues(allVehicles, 'rcOwner'), 'filterRcOwner');

  renderVehicles(allVehicles);

  // Trigger update on any filter/sort change
  document.querySelectorAll('input[type="checkbox"], #sortOption').forEach(el => {
    el.addEventListener('change', () => {
      const filtered = applyFilters(allVehicles);
      const sorted = applySort(filtered);
      renderVehicles(sorted);
    });
  });

  // Helpers
  function getUniqueValues(data, field) {
    return [...new Set(data.map(v => v[field]).filter(Boolean))].sort();
  }

  function getUniqueNamesFromField(data, field) {
    const names = new Set();
    data.forEach(v => {
      v[field]?.split(',').forEach(name => names.add(name.trim()));
    });
    return [...names].sort();
  }

function populateCheckboxGroup(containerId, options, name) {
  const container = document.getElementById(containerId);
  options.forEach(val => {
    const id = `${name}-${val.replace(/\s+/g, '')}`;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = name;
    checkbox.value = val;
    checkbox.id = id;
    checkbox.classList.add('filterCheckbox');

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.classList.add('filterBtn');
    label.textContent = val;

    container.appendChild(checkbox);
    container.appendChild(label);
  });
}


  function getCheckedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(cb => cb.value);
  }

  function applyFilters(data) {
    const filters = {
      make: getCheckedValues('filterMake'),
      category: getCheckedValues('filterCategory'),
      class: getCheckedValues('filterClass'),
      fuelType: getCheckedValues('filterFuelType'),
      drivetrain: getCheckedValues('filterDrivetrain'),
      gearbox: getCheckedValues('filterGearbox'),
      colors: getCheckedValues('filterColor'),
      owner: getCheckedValues('filterOwner'),
      rcOwner: getCheckedValues('filterRcOwner')
    };

    return data.filter(v =>
      (!filters.make.length || filters.make.includes(v.make)) &&
      (!filters.category.length || filters.category.includes(v.category)) &&
      (!filters.class.length || filters.class.includes(v.class)) &&
      (!filters.fuelType.length || filters.fuelType.includes(v.fuelType)) &&
      (!filters.drivetrain.length || filters.drivetrain.includes(v.drivetrain)) &&
      (!filters.gearbox.length || filters.gearbox.includes(v.gearbox)) &&
      (!filters.colors.length || filters.colors.some(c => v.colors?.includes(c))) &&
      (!filters.owner.length || filters.owner.some(o => v.owners?.split(',').map(n => n.trim()).includes(o))) &&
      (!filters.rcOwner.length || filters.rcOwner.includes(v.rcOwner))
    );
  }

  function applySort(data) {
    const sortField = document.getElementById('sortOption').value;
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aVal = parseFloat(a[sortField]) || 0;
      const bVal = parseFloat(b[sortField]) || 0;
      return bVal - aVal;
    });
  }

  function renderVehicles(vehicles) {
  vehicleList.innerHTML = '';
  const sortField = document.getElementById('sortOption').value;

  if (vehicles.length === 0) {
    vehicleList.innerHTML = '<p>No vehicles match the selected filters.</p>';
    return;
  }

  // Group by class
  const grouped = {};
  vehicles.forEach(v => {
    const group = v.class || 'Other';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(v);
  });

  for (const groupName in grouped) {
    const groupSection = document.createElement('div');
    groupSection.className = 'vehicleGroup';

    const heading = document.createElement('h2');
    heading.textContent = groupName;
    groupSection.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'vehicleList';

    grouped[groupName].forEach(v => {
      const card = document.createElement('a');
      card.className = 'vehicleCard';
      card.href = `vehicle-single.html?vehicleID=${v.vehicleID}`;

      const sortInfo = sortField && v[sortField] ? `<p>${formatLabel(sortField)}: ${v[sortField]}</p>` : '';
      const maintStatus = getMaintenanceStatus(v, serviceIntervals, maintenanceData);
      let maintIcon = '';
      if (maintStatus === 'upcoming') maintIcon = '<span class="maintIcon orange">🛠️</span>';
      if (maintStatus === 'overdue') maintIcon = '<span class="maintIcon red">🛠️</span>';

      card.innerHTML = `
        <img src="images/vehicles/${v.vehicleID}/thumbnail.jpg" alt="${v.vehicleName}" class="vehicleThumb" />
        <div class="vehicleInfo">
          ${maintIcon}
          <h3>${v.make} ${v.vehicleName}</h3>
          <p>Model Year: ${v.modelYear || '–'}</p>
          <p>Fuel: ${v.fuelType || '–'}</p>
          ${sortInfo}
        </div>
      `;

      const hasOverdueDoc = documents.some(doc => {
        return doc.vehicleID === v.vehicleID && new Date(doc.expiryDate) < new Date();
      });

      if (hasOverdueDoc) {
        const docIcon = document.createElement('span');
        docIcon.className = 'icon document-icon';
        docIcon.textContent = '📄';
        card.appendChild(docIcon);
      }


      grid.appendChild(card);
    });

    groupSection.appendChild(grid);
    vehicleList.appendChild(groupSection);
  }
}


  function formatLabel(field) {
    return {
      modelYear: 'Model Year',
      registrationNumber: 'Registration Year',
      owningDate: 'Owning Date',
      displacement: 'Displacement',
      power: 'Power',
      torque: 'Torque',
      fuelEconomy: 'Fuel Economy'
    }[field] || field;
  }
  function getMaintenanceStatus(vehicle, intervals, maintenance) {
  const vehicleID = vehicle.vehicleID;
  const currentOdo = parseInt(vehicle.CurrentOdometer || '0');
  const today = new Date();

  const vehicleIntervals = intervals.filter(i => i.vehicleID === vehicleID);
  const vehicleMaintenance = maintenance.filter(m => m.vehicleID === vehicleID);

  let status = 'normal';

  for (const interval of vehicleIntervals) {
    const { component, intervalKM, intervalDays } = interval;
    const records = vehicleMaintenance
      .filter(m => m.serviceType === component)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const last = records[0];

    if (!last) continue;

    const lastOdo = parseInt(last.odometer || '0');
    const lastDate = new Date(last.date);
    const nextOdo = lastOdo + parseInt(intervalKM || '0');
    const nextDate = new Date(lastDate.getTime() + parseInt(intervalDays || '0') * 86400000);

    const odoDiff = nextOdo - currentOdo;
    const dateDiff = (nextDate - today) / 86400000;

    if (odoDiff <= 0 || dateDiff <= 0) return 'overdue';
    if (odoDiff <= 1001 || dateDiff <= 30) status = 'upcoming';
  }

  return status;
}
});
