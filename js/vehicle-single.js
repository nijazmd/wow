// vehicle-single.js

document.addEventListener('DOMContentLoaded', async () => {
  const vehicleID = getQueryParam('vehicleID');

  // Load all data
  const [vehicles, maintenance, documents] = await Promise.all([
    fetchVehicleData(),
    fetchMaintenanceData(),
    fetchDocumentsData()
  ]);

  const vehicle = vehicles.find(v => v.vehicleID === vehicleID);
  if (!vehicle) {
    document.getElementById('vehicleTitle').textContent = "Vehicle Not Found";
    return;
  }

  // Set page title
  document.getElementById('vehicleTitle').textContent = `${vehicle.make} ${vehicle.vehicleName}`;

  // Populate image gallery
  const gallery = document.getElementById('imageGallery');
  for (let i = 1; i <= 5; i++) {
    const img = document.createElement('img');
    img.src = `images/vehicles/${vehicle.vehicleID}/${i}.jpg`;
    img.alt = `${vehicle.make} ${vehicle.vehicleName} Image ${i}`;
    img.onerror = () => img.remove(); // Remove if image doesn't exist
    gallery.appendChild(img);
  }

  // Specifications
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
    li.textContent = `${label}: ${value}`;
    specList.appendChild(li);
  }

  // Maintenance History
  const maintenanceList = document.getElementById('maintenanceList');
  const maintenanceRecords = maintenance.filter(m => m.vehicleID === vehicleID);
  if (maintenanceRecords.length === 0) {
    maintenanceList.innerHTML = '<li>No maintenance records found.</li>';
  } else {
    maintenanceRecords.forEach(record => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${record.date}</strong> – ${record.serviceType} (${record.action}) at ${record.odometer} km<br>
        Cost: ${record.cost}<br>
        Notes: ${record.notes}
      `;
      maintenanceList.appendChild(li);
    });
  }

  // Documents
  const documentList = document.getElementById('documentList');
  const documentRecords = documents.filter(d => d.vehicleID === vehicleID);
  if (documentRecords.length === 0) {
    documentList.innerHTML = '<li>No documents found.</li>';
  } else {
    documentRecords.forEach(doc => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = doc.fileLink;
      a.textContent = `${doc.documentType} (Expiry: ${doc.expiryDate})`;
      a.target = '_blank';
      li.appendChild(a);
      if (doc.notes) {
        li.innerHTML += `<br><small>Notes: ${doc.notes}</small>`;
      }
      documentList.appendChild(li);
    });
  }
});
