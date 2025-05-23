document.addEventListener('DOMContentLoaded', async () => {
  const vehicleID = getQueryParam('vehicleID');

  const [vehicles, maintenance, documents, serviceIntervals] = await Promise.all([
    fetchVehicleData(),
    fetchMaintenanceData(),
    fetchDocumentsData(),
    fetchServiceIntervals()
  ]);

  const vehicle = vehicles.find(v => v.vehicleID === vehicleID);
  if (!vehicle) {
    document.getElementById('vehicleTitle').textContent = "Vehicle Not Found";
    return;
  }

  // Title and Registration
  document.getElementById('vehicleTitle').textContent = `${vehicle.make} ${vehicle.vehicleName}`;
  document.getElementById('regNumber').textContent = vehicle.registrationNumber || '—';

  // Gallery
  const gallery = document.getElementById('imageGallery');
  for (let i = 1; i <= 5; i++) {
    const img = document.createElement('img');
    img.src = `images/vehicles/${vehicle.vehicleID}/${i}.jpg`;
    img.onerror = () => img.remove();
    gallery.appendChild(img);
  }

  // Odometer value (from localStorage or maintenance)
  const odoKey = `odometer_${vehicleID}`;
  let odometerValue = localStorage.getItem(odoKey);
  if (!odometerValue) {
    const vehicleMaint = maintenance.filter(m => m.vehicleID === vehicleID);
    const latest = vehicleMaint.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    odometerValue = latest?.odometer || '—';
  }
  document.getElementById('odometerValue').textContent = odometerValue;

  // Odometer popup logic
  const odoPopup = document.getElementById('odoPopup');
  const odoInput = document.getElementById('odoInput');
  document.getElementById('odoUpdateBtn').addEventListener('click', () => {
    odoPopup.classList.remove('hidden');
    odoInput.value = odometerValue !== '—' ? odometerValue : '';
  });
  document.getElementById('odoCancelBtn').addEventListener('click', () => {
    odoPopup.classList.add('hidden');
  });

  document.getElementById('odoSaveBtn').addEventListener('click', async () => {
  const newOdo = odoInput.value;
  if (!newOdo || isNaN(newOdo)) {
    alert('Please enter a valid number');
    return;
  }

  const params = new URLSearchParams();
  params.append('type', 'updateOdometer');
  params.append('vehicleID', vehicleID);
  params.append('odometer', newOdo);

  try {
    await fetch('https://script.google.com/macros/s/AKfycbyD89HHxv2EIytHw-SkCnSYCK3w07HLQ24anzoUXiJnFE-l5Z05urBByqxV7fL22II5Rg/exec', {
      method: 'POST',
      mode: 'no-cors',
      body: params
    });

    localStorage.setItem(odoKey, newOdo);
    document.getElementById('odometerValue').textContent = newOdo;
    odoPopup.classList.add('hidden');
    renderMaintenanceCards();
    alert('Odometer updated successfully.');
  } catch (err) {
    console.error(err);
    alert('Failed to update odometer.');
  }
});



  // Tabs logic
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tabPanel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Specs
  const specList = document.getElementById('specList');
  const specs = {
    "Model Year": vehicle.modelYear,
    "Registration Year": vehicle.registrationYear,
    "Category": vehicle.category,
    "Class": vehicle.class,
    "Fuel Type": vehicle.fuelType,
    "Drivetrain": vehicle.drivetrain,
    "Gearbox": vehicle.gearbox,
    "Colors": vehicle.colors,
    "RC Owner": vehicle.rcOwner,
    "Owners": vehicle.owners,
    "Displacement": vehicle.displacement,
    "Power": vehicle.power,
    "Torque": vehicle.torque,
    "Fuel Economy": vehicle.fuelEconomy,
    "Seating Capacity": vehicle.seatingCapacity,
    "Boot Space": vehicle.bootSpace,
    "Turbo": vehicle.turbo,
    "Cylinders": vehicle.cylinders
  };
  for (const [label, value] of Object.entries(specs)) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="cardLabel">${label}</span><span class="cardValue">${value || '—'}</span>`;
    specList.appendChild(li);
  }

  // Maintenance
  const maintenanceList = document.getElementById('maintenanceList');
  const vehicleMaint = maintenance.filter(m => m.vehicleID === vehicleID);
  const intervals = serviceIntervals.filter(i => i.vehicleID === vehicleID);
  function renderMaintenanceCards() {
  const tableBody = document.querySelector('#maintenanceTable tbody');
  tableBody.innerHTML = '';
  const alerts = [];
  const odo = parseInt(localStorage.getItem(odoKey) || '0');
  const today = new Date();

  if (intervals.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">No service interval configured.</td>`;
    tableBody.appendChild(row);
    return;
  }

  intervals.forEach(interval => {
    const { component, intervalKM, intervalDays } = interval;
    const history = vehicleMaint
      .filter(m => m.serviceType === component)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const last = history[0];

    let lastDate = last?.date || '—';
    let lastOdo = last?.odometer || '—';
    let lastOdoParsed = last?.odometer ? parseInt(last.odometer) : null;
let dueKM = lastOdoParsed !== null && !isNaN(intervalKM) 
  ? lastOdoParsed + parseInt(intervalKM) 
  : '—';

    
    let dueDate = last?.date
      ? new Date(new Date(last.date).getTime() + intervalDays * 86400000).toLocaleDateString()
      : '—';

    if (dueKM !== '—' && parseInt(dueKM) - odo <= 500) {
      alerts.push(`⚠️ ${component} due soon`);
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${component}</td>
      <td>${lastDate}</td>
      <td>${lastOdo}</td>
      <td>${dueDate}</td>
      <td>${dueKM}</td>
    `;
    tableBody.appendChild(tr);
  });

  // Show alert if any
  const alertBox = document.querySelector('.alertBox');
  if (alerts.length) {
    if (!alertBox) {
      const newAlert = document.createElement('div');
      newAlert.className = 'alertBox';
      newAlert.innerHTML = alerts.map(a => `<p>${a}</p>`).join('');
      maintenanceTable.parentElement.prepend(newAlert);
    } else {
      alertBox.innerHTML = alerts.map(a => `<p>${a}</p>`).join('');
    }
  }
}

  renderMaintenanceCards();

  // Documents
  const documentList = document.getElementById('documentList');
  const docRecords = documents.filter(d => d.vehicleID === vehicleID);
  if (docRecords.length === 0) {
    documentList.innerHTML = '<li>No documents found.</li>';
  } else {
    const today = new Date();
    docRecords.forEach(doc => {
      const expiry = new Date(doc.expiryDate);
      const remainingDays = Math.ceil((expiry - today) / 86400000);

      const li = document.createElement('li');
      li.innerHTML = `
        <span class="cardLabel">${doc.documentType}</span>
        <span class="cardValue">
          Expiry: ${doc.expiryDate} (${remainingDays} days)<br>
          ${doc.fileLink ? `<a href="${doc.fileLink}" target="_blank">View</a><br>` : ''}
          ${doc.notes ? `<small>${doc.notes}</small>` : ''}
        </span>
      `;
      documentList.appendChild(li);
    });
  }
});

// Load service intervals via API key method
async function fetchServiceIntervals() {
  return await fetchSheetData('ServiceIntervals');
}
