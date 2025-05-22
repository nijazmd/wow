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

  const form = document.getElementById('documentForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    params.append('type', 'document');
    params.append('vehicleID', vehicleSelect.value);
    params.append('documentType', document.getElementById('docType').value);
    params.append('issueDate', document.getElementById('docIssueDate').value);
    params.append('expiryDate', document.getElementById('docExpiryDate').value);
    params.append('fileLink', document.getElementById('docFileLink').value);
    params.append('notes', document.getElementById('docNotes').value);

    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      alert('Document submitted successfully.');
      form.reset();
    } catch (err) {
      alert('Failed to submit document.');
      console.error(err);
    }
  });
});
