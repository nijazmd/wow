document.addEventListener('DOMContentLoaded', async () => {
  const vehicleID = getQueryParam('vehicleID');

  const [vehicles, maintenance, documents, serviceIntervals, issues] = await Promise.all([
    fetchVehicleData(),
    fetchMaintenanceData(),
    fetchDocumentsData(),
    fetchServiceIntervals(),
    fetchIssues()
  ]);

  const vehicle = vehicles.find(v => v.vehicleID === vehicleID);
  if (!vehicle) {
    document.getElementById('vehicleTitle').textContent = "Vehicle Not Found";
    return;
  }

  // Title and Registration
  document.getElementById('vehicleTitle').textContent = `${vehicle.make} ${vehicle.vehicleName}`;
  document.getElementById('regNumber').textContent = vehicle.registrationNumber || '—';

  // Image Gallery
  const gallery = document.getElementById('imageGallery');
  for (let i = 1; i <= 5; i++) {
    const img = document.createElement('img');
    img.src = `images/vehicles/${vehicle.vehicleID}/${i}.jpg`;
    img.onerror = () => img.remove();
    gallery.appendChild(img);
  }

  // Odometer
  let odometerValue = vehicle.CurrentOdometer || '';
  if (!odometerValue) {
    const vehicleMaint = maintenance.filter(m => m.vehicleID === vehicleID);
    const latest = vehicleMaint.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    odometerValue = latest?.odometer || '—';
  }
  document.getElementById('odometerValue').textContent = odometerValue;

  // Odometer popup
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
      const response = await fetch('https://script.google.com/macros/s/AKfycbyD89HHxv2EIytHw-SkCnSYCK3w07HLQ24anzoUXiJnFE-l5Z05urBByqxV7fL22II5Rg/exec', {
        method: 'POST',
        body: params
      });

      const text = await response.text();
      if (text.includes("updated")) {
        document.getElementById('odometerValue').textContent = newOdo;
        odoPopup.classList.add('hidden');
        odometerValue = newOdo; // update local variable
        renderMaintenanceCards();
        alert('Odometer updated successfully.');
      } else {
        alert('Failed to update odometer: ' + text);
      }
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
    "Category": vehicle.category,
    "Class": vehicle.class,
    "Owners": vehicle.owners,
    "RC Owner": vehicle.rcOwner,
    "Fuel Type": vehicle.fuelType,
    "Turbo": vehicle.turbo,
    "Displacement": vehicle.displacement,
    "Cylinders": vehicle.cylinders,
    "Power": vehicle.power,
    "Torque": vehicle.torque,
    "Gearbox": vehicle.gearbox,
    "Drivetrain": vehicle.drivetrain,
    "Fuel Economy": vehicle.fuelEconomy,
    "Boot Space": vehicle.bootSpace,
    "Colors": vehicle.colors,
    "Seating Capacity": vehicle.seatingCapacity,
    "Registration Year": vehicle.registrationYear,
    "Model Year": vehicle.modelYear
  };
    
  for (const [label, value] of Object.entries(specs)) {
  // Skip specific fields for Motorcycles
  if (
    vehicle.category === "Motorcycle" &&
    (label === "Drivetrain" || label === "Boot Space" || label === "Turbo")
  ) {
    continue;
  }

  let displayValue = value || '—';

  // Append unit for Displacement
  if (label === "Displacement" && value) {
    displayValue += " cc";
  }

  // Append unit for Torque
  if (label === "Torque" && value) {
    displayValue += " Nm";
  }

  // Combine Number of Gears with Gearbox
  if (label === "Gearbox") {
    const gears = vehicle.numberOfGears;
    if (gears) {
      displayValue = `${gears} speed ${value}`;
    }
  }

  const li = document.createElement('li');
  li.innerHTML = `<span class="cardLabel">${label}</span><span class="cardValue">${displayValue}</span>`;
  specList.appendChild(li);
}



  // Maintenance
  const vehicleMaint = maintenance.filter(m => m.vehicleID === vehicleID);
  const intervals = serviceIntervals.filter(i => i.vehicleID === vehicleID);

  function renderMaintenanceCards() {
    const tableBody = document.querySelector('#maintenanceTable tbody');
    tableBody.innerHTML = '';
    const alerts = [];
    const odo = parseInt(odometerValue || '0');
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

      const odoDiff = dueKM !== '—' ? parseInt(dueKM) - odo : null;
      const dueDateObj = last?.date ? new Date(last.date) : null;
      const dateDiff = dueDateObj ? Math.ceil((new Date(dueDateObj.getTime() + intervalDays * 86400000) - today) / 86400000) : null;

      if ((odoDiff !== null && odoDiff <= 0) || (dateDiff !== null && dateDiff <= 0)) {
        alerts.push(`❗ ${component} due`);
      } else if ((odoDiff !== null && odoDiff <= 1000) || (dateDiff !== null && dateDiff <= 30)) {
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

  renderIssueReports();
  function renderIssueReports() {
    const issueList = document.getElementById('issueList');
    const reports = issues.filter(i => i.vehicleID === vehicleID);
    if (reports.length === 0) {
      issueList.innerHTML = '<li>No issues reported.</li>';
      return;
    }
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    reports.forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${r.date}</strong> ${r.reporter ? `by ${r.reporter}` : ''}<br>${r.issue}`;
      issueList.appendChild(li);
    });
  }

  renderMaintenanceCards();
  renderMaintenanceHistory();

  function renderMaintenanceHistory() {
    const tableBody = document.querySelector('#maintenanceHistoryTable tbody');
    tableBody.innerHTML = '';
    const grouped = {};

    vehicleMaint.forEach(entry => {
      const odo = entry.odometer || '—';
      if (!grouped[odo]) grouped[odo] = { date: entry.date, cost: 0 };
      grouped[odo].cost += parseFloat(entry.cost || 0);
    });

    Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a)).forEach(odo => {
      const { date, cost } = grouped[odo];
      const row = document.createElement('tr');
      row.innerHTML = `<td>${odo} km</td><td>${date}</td><td>₹ ${cost.toLocaleString()}</td>`;
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        window.location.href = `maintenance-detail.html?vehicleID=${vehicleID}&odo=${odo}`;
      });
      tableBody.appendChild(row);
    });
  }

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
        </span>`;
      documentList.appendChild(li);
    });
  }
});

async function fetchServiceIntervals() {
  return await fetchSheetData('ServiceIntervals');
}
