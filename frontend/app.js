const statusBox = document.querySelector('#api-status');
const form = document.querySelector('#review-form');
const formMessage = document.querySelector('#form-message');
const reviewList = document.querySelector('#review-list');

async function checkApi() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    statusBox.textContent = `Backend: ${data.api} | Database: ${data.database}`;
    statusBox.className = 'status ok';
  } catch (error) {
    statusBox.textContent = 'Backend or database is unavailable!!';
    statusBox.className = 'status error';
  }
}

async function loadReviews() {
  reviewList.innerHTML = '<p>Loading reviews...</p>';
  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) throw new Error('Could not load reviews');
    const reviews = await response.json();
    reviewList.innerHTML = reviews.length
      ? reviews.map(review => `
          <article class="review-card">
            <h3>${escapeHtml(review.name)}</h3>
            <p>${escapeHtml(review.message)}</p>
            <small>${new Date(review.created_at).toLocaleString()}</small>
          </article>`).join('')
      : '<p>No reviews yet. Add the first one.</p>';
  } catch (error) {
    reviewList.innerHTML = '<p>Could not reach the backend.</p>';
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  formMessage.textContent = 'Saving...';
  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: form.name.value.trim(),
        message: form.message.value.trim()
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Save failed');
    form.reset();
    formMessage.textContent = 'Review stored in MySQL.';
    await loadReviews();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

checkApi();
loadReviews();
