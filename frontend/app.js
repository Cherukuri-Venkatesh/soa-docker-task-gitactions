// Configuration: Backend API Base URL
// Uses /api (proxied by Nginx in Docker or Vite in local dev), fallback to direct backend port 2025
const API_BASE_URL = window.location.protocol.startsWith('http') ? '/api' : 'http://localhost:2025';

// State
let libraryCards = [];
let pendingDeleteId = null;

// DOM Elements
const addForm = document.getElementById('addCardForm');
const editForm = document.getElementById('editCardForm');
const cardsTableBody = document.getElementById('cardsTableBody');
const cardCountBadge = document.getElementById('cardCountBadge');
const tableLoading = document.getElementById('tableLoading');
const emptyState = document.getElementById('emptyState');
const tableContainer = document.getElementById('tableContainer');
const alertContainer = document.getElementById('alertContainer');
const alertMessage = document.getElementById('alertMessage');
const refreshBtn = document.getElementById('refreshBtn');

const activeStatusCheckbox = document.getElementById('activeStatus');
const activeStatusLabel = document.getElementById('activeStatusLabel');
const editActiveStatus = document.getElementById('editActiveStatus');
const editActiveStatusLabel = document.getElementById('editActiveStatusLabel');

// Bootstrap Modals
let editModalInstance = null;
let deleteModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));
  deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteModal'));

  // Set default issue date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('issueDate').value = today;

  // Toggle switch labels
  activeStatusCheckbox.addEventListener('change', () => {
    updateSwitchBadge(activeStatusCheckbox, activeStatusLabel);
  });

  editActiveStatus.addEventListener('change', () => {
    updateSwitchBadge(editActiveStatus, editActiveStatusLabel);
  });

  // Form Submissions
  addForm.addEventListener('submit', handleAddCard);
  editForm.addEventListener('submit', handleSaveEdit);
  document.getElementById('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);
  refreshBtn.addEventListener('click', () => loadAllCards(true));

  // Initial load
  loadAllCards();
});

function updateSwitchBadge(checkbox, labelElement) {
  if (checkbox.checked) {
    labelElement.innerHTML = '<span class="badge bg-success">Active</span>';
  } else {
    labelElement.innerHTML = '<span class="badge bg-secondary">Inactive</span>';
  }
}

// Show Alert
function showAlert(message, type = 'success') {
  alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
  alertMessage.innerHTML = message;
  alertContainer.classList.remove('d-none');

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideAlert();
  }, 5000);
}

function hideAlert() {
  alertContainer.classList.add('d-none');
}

// Fetch all cards from GET /displayall
async function loadAllCards(isManualRefresh = false) {
  tableLoading.classList.remove('d-none');
  emptyState.classList.add('d-none');
  cardsTableBody.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE_URL}/displayall`);
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    libraryCards = Array.isArray(data) ? data : [];
    renderCards(libraryCards);

    if (isManualRefresh) {
      showAlert('Library cards refreshed successfully.', 'info');
    }
  } catch (error) {
    console.error('Error fetching cards:', error);
    showAlert(`<strong>Failed to load cards:</strong> ${error.message}. Is backend running on ${API_BASE_URL}?`, 'danger');
    tableContainer.classList.add('d-none');
    emptyState.classList.remove('d-none');
  } finally {
    tableLoading.classList.add('d-none');
  }
}

// Render cards to table
function renderCards(cards) {
  cardCountBadge.textContent = `${cards.length} ${cards.length === 1 ? 'Record' : 'Records'}`;

  if (cards.length === 0) {
    tableContainer.classList.add('d-none');
    emptyState.classList.remove('d-none');
    return;
  }

  tableContainer.classList.remove('d-none');
  emptyState.classList.add('d-none');

  cardsTableBody.innerHTML = cards.map(card => {
    const isActive = card.active === true;
    const statusBadge = isActive
      ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Active</span>'
      : '<span class="badge bg-secondary"><i class="bi bi-dash-circle me-1"></i>Inactive</span>';

    return `
      <tr>
        <td class="ps-4 fw-bold text-muted">#${card.id}</td>
        <td>
          <span class="badge bg-light text-dark border font-monospace fs-6">
            ${escapeHtml(card.cardNumber || '')}
          </span>
        </td>
        <td class="fw-semibold text-dark">${escapeHtml(card.holderName || '')}</td>
        <td class="text-secondary"><i class="bi bi-calendar3 me-1"></i>${escapeHtml(card.issueDate || '')}</td>
        <td>${statusBadge}</td>
        <td class="text-end pe-4">
          <div class="btn-group" role="group">
            <button class="btn btn-outline-primary btn-sm" onclick="openEditModal(${card.id})" title="Edit Card">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="openDeleteModal(${card.id})" title="Delete Card">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Handle Add Card Submission (POST /add)
async function handleAddCard(e) {
  e.preventDefault();

  const cardNumber = document.getElementById('cardNumber').value.trim();
  const holderName = document.getElementById('holderName').value.trim();
  const issueDate = document.getElementById('issueDate').value;
  const active = activeStatusCheckbox.checked;

  // Validation
  let isValid = true;
  if (!cardNumber) {
    document.getElementById('cardNumber').classList.add('is-invalid');
    isValid = false;
  } else {
    document.getElementById('cardNumber').classList.remove('is-invalid');
  }

  if (!holderName || holderName.length < 2) {
    document.getElementById('holderName').classList.add('is-invalid');
    isValid = false;
  } else {
    document.getElementById('holderName').classList.remove('is-invalid');
  }

  if (!issueDate) {
    document.getElementById('issueDate').classList.add('is-invalid');
    isValid = false;
  } else {
    document.getElementById('issueDate').classList.remove('is-invalid');
  }

  if (!isValid) return;

  // Button loading state
  const submitBtn = document.getElementById('submitBtn');
  const submitSpinner = document.getElementById('submitSpinner');
  const submitIcon = document.getElementById('submitIcon');
  submitBtn.disabled = true;
  submitSpinner.classList.remove('d-none');
  submitIcon.classList.add('d-none');

  // Payload: Note that NO id is sent!
  const payload = {
    cardNumber,
    holderName,
    issueDate,
    active
  };

  try {
    const response = await fetch(`${API_BASE_URL}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const savedCard = await response.json();
      showAlert(`<strong>Success!</strong> Card issued successfully with auto-generated ID <strong>#${savedCard.id}</strong> for <em>${escapeHtml(savedCard.holderName)}</em>.`, 'success');
      addForm.reset();
      activeStatusCheckbox.checked = true;
      updateSwitchBadge(activeStatusCheckbox, activeStatusLabel);
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('issueDate').value = today;

      // Refresh list
      loadAllCards();
    } else {
      const errorData = await response.json().catch(() => null);
      let errMsg = 'Failed to add card.';
      if (errorData && errorData.fieldErrors) {
        errMsg = Object.values(errorData.fieldErrors).join(', ');
      } else if (errorData && errorData.message) {
        errMsg = errorData.message;
      }
      showAlert(`<strong>Error:</strong> ${errMsg}`, 'danger');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showAlert(`<strong>Network Error:</strong> ${error.message}. Is backend accessible at ${API_BASE_URL}?`, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitSpinner.classList.add('d-none');
    submitIcon.classList.remove('d-none');
  }
}

// Open Edit Modal
window.openEditModal = function(id) {
  const card = libraryCards.find(c => c.id === id);
  if (!card) return;

  document.getElementById('editCardId').value = card.id;
  document.getElementById('editCardIdText').textContent = card.id;
  document.getElementById('editCardNumber').value = card.cardNumber || '';
  document.getElementById('editHolderName').value = card.holderName || '';
  document.getElementById('editIssueDate').value = card.issueDate || '';
  editActiveStatus.checked = card.active === true;
  updateSwitchBadge(editActiveStatus, editActiveStatusLabel);

  editModalInstance.show();
};

// Handle Save Edit (PUT /update/{id})
async function handleSaveEdit(e) {
  e.preventDefault();

  const id = document.getElementById('editCardId').value;
  const cardNumber = document.getElementById('editCardNumber').value.trim();
  const holderName = document.getElementById('editHolderName').value.trim();
  const issueDate = document.getElementById('editIssueDate').value;
  const active = editActiveStatus.checked;

  if (!cardNumber || !holderName || !issueDate) {
    showAlert('Please fill in all required fields.', 'warning');
    return;
  }

  const saveEditBtn = document.getElementById('saveEditBtn');
  const saveEditSpinner = document.getElementById('saveEditSpinner');
  saveEditBtn.disabled = true;
  saveEditSpinner.classList.remove('d-none');

  const payload = {
    id: parseInt(id),
    cardNumber,
    holderName,
    issueDate,
    active
  };

  try {
    const response = await fetch(`${API_BASE_URL}/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      editModalInstance.hide();
      showAlert(`<strong>Success!</strong> Card #${id} updated successfully.`, 'success');
      loadAllCards();
    } else {
      const errorData = await response.json().catch(() => null);
      showAlert(`<strong>Update Failed:</strong> ${errorData?.message || 'Server error'}`, 'danger');
    }
  } catch (error) {
    console.error('Error updating card:', error);
    showAlert(`<strong>Network Error:</strong> ${error.message}`, 'danger');
  } finally {
    saveEditBtn.disabled = false;
    saveEditSpinner.classList.add('d-none');
  }
}

// Open Delete Confirmation Modal
window.openDeleteModal = function(id) {
  const card = libraryCards.find(c => c.id === id);
  if (!card) return;

  pendingDeleteId = id;
  document.getElementById('deleteTargetName').textContent = card.holderName;
  document.getElementById('deleteTargetNumber').textContent = card.cardNumber;
  deleteModalInstance.show();
};

// Handle Confirm Delete (DELETE /delete/{id})
async function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteSpinner = document.getElementById('deleteSpinner');
  confirmDeleteBtn.disabled = true;
  deleteSpinner.classList.remove('d-none');

  try {
    const response = await fetch(`${API_BASE_URL}/delete/${pendingDeleteId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      const msg = await response.text();
      deleteModalInstance.hide();
      showAlert(`<strong>Deleted:</strong> ${msg || 'Card deleted successfully.'}`, 'success');
      loadAllCards();
    } else {
      deleteModalInstance.hide();
      showAlert(`<strong>Failed to delete:</strong> Card with ID ${pendingDeleteId} not found.`, 'danger');
    }
  } catch (error) {
    console.error('Error deleting card:', error);
    deleteModalInstance.hide();
    showAlert(`<strong>Network Error:</strong> ${error.message}`, 'danger');
  } finally {
    confirmDeleteBtn.disabled = false;
    deleteSpinner.classList.add('d-none');
    pendingDeleteId = null;
  }
}

// Utility: HTML Escaping
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
