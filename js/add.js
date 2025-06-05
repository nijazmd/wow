const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyD89HHxv2EIytHw-SkCnSYCK3w07HLQ24anzoUXiJnFE-l5Z05urBByqxV7fL22II5Rg/exec';

document.addEventListener('DOMContentLoaded', async () => {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const vehicles = await fetchVehicleData();

  vehicles.forEach(v => {
    const option = document.createElement('option');
    option.value = v.vehicleID;
    option.textContent = `${v.make} ${v.vehicleName}`;
    vehicleSelect.appendChild(option);
  });

  const formMaintenance = document.getElementById('maintenanceForm');
  const serviceItemsContainer = document.getElementById('serviceItemsContainer');
  const addServiceItemBtn = document.getElementById('addServiceItemBtn');

  function addServiceItemRow() {
    const row = document.createElement('div');
    row.className = 'serviceItemRow';
    row.innerHTML = `
      <label>Service Item:
        <input list="serviceSuggestions" class="serviceType" required />
      </label>
      <label>Action:
        <select class="action" required>
          <option value="">-- Select Action --</option>
          <option value="Replaced">Replaced</option>
          <option value="Checked">Checked</option>
          <option value="Cleaned">Cleaned</option>
        </select>
      </label>
      <label>Cost:
        <input type="number" class="cost" />
      </label>
      <label>Notes:
        <input type="text" class="notes" />
      </label>
    `;
    serviceItemsContainer.appendChild(row);
  }
  

  addServiceItemBtn.addEventListener('click', addServiceItemRow);
  addServiceItemRow(); // initial row

  formMaintenance.addEventListener('submit', async (e) => {
    e.preventDefault();
    const labour = document.getElementById('labourCharges').value || "";

    const vehicleID = vehicleSelect.value;
    const date = document.getElementById('maintDate').value;
    const odometer = document.getElementById('maintOdometer').value;
    const rows = serviceItemsContainer.querySelectorAll('.serviceItemRow');

    let allSuccess = true;

    for (const row of rows) {
      const serviceType = row.querySelector('.serviceType')?.value || "";
      const action = row.querySelector('.action')?.value || "";
      const cost = row.querySelector('.cost')?.value || "";
      const notes = row.querySelector('.notes')?.value || "";

      const params = new URLSearchParams();
      params.append('type', 'maintenance');
      params.append('vehicleID', vehicleID);
      params.append('date', date);
      params.append('odometer', odometer);
      params.append('serviceType', serviceType);
      params.append('action', action);
      params.append('cost', cost);
      params.append('notes', notes);
      params.append('labourCharges', labour);

      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: params
        });
      } catch (err) {
        console.error('Submit failed for one item:', err);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      alert('Maintenance entries submitted successfully.');
    } else {
      alert('Some entries may have failed to submit.');
    }

    formMaintenance.reset();
    serviceItemsContainer.innerHTML = '';
    addServiceItemRow(); // add a fresh row
  });
  document.getElementById('maintDate').valueAsDate = new Date();

});
