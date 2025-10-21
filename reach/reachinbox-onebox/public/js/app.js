// ReachInbox Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const accountList = document.getElementById('account-list');
  const emailList = document.getElementById('email-list');
  const emailDetail = document.getElementById('email-detail');
  const emailCount = document.getElementById('email-count');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const suggestedReplyTextarea = document.getElementById('suggested-reply');
  const copyReplyButton = document.getElementById('copy-reply');
  
  // State
  let currentAccount = null;
  let currentEmail = null;
  let emails = [];
  
  // API Base URL
  const API_URL = 'http://localhost:3000/api';
  
  // Initialize
  init();
  
  // Functions
  async function init() {
    await loadAccounts();
    await loadEmails();
  }
  
  async function loadAccounts() {
    try {
      const response = await fetch(`${API_URL}/accounts`);
      const data = await response.json();
      const accounts = Array.isArray(data) ? data : [];
      
      accountList.innerHTML = '';
      if (accounts.length === 0) {
        accountList.innerHTML = '<div class="list-group-item text-muted">No accounts found</div>';
        return;
      }
      
      accounts.forEach(account => {
        const item = document.createElement('a');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
          ${account.email}
          <span class="badge bg-primary rounded-pill">${account.unread || 0}</span>
        `;
        item.addEventListener('click', () => {
          document.querySelectorAll('#account-list a').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          currentAccount = account.id;
          loadEmails(currentAccount);
        });
        accountList.appendChild(item);
      });
    } catch (error) {
      console.error('Error loading accounts:', error);
      accountList.innerHTML = '<div class="list-group-item text-danger">Failed to load accounts</div>';
    }
  }
  
  async function loadEmails(accountId = null) {
    try {
      let url = `${API_URL}/emails`;
      if (accountId) {
        url += `?account=${accountId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      emails = data.emails || [];
      
      renderEmails(emails);
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  }
  
  function renderEmails(emailsToRender) {
    emailList.innerHTML = '';
    emailCount.textContent = emailsToRender.length;
    
    if (emailsToRender.length === 0) {
      emailList.innerHTML = '<div class="list-group-item text-center text-muted">No emails found</div>';
      return;
    }
    
    emailsToRender.forEach(email => {
      const item = document.createElement('a');
      item.className = 'list-group-item list-group-item-action email-item';
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1">${email.from.name || email.from.address}</h6>
          <small>${formatDate(email.date)}</small>
        </div>
        <p class="mb-1 text-truncate">${email.subject}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted text-truncate">${email.snippet || ''}</small>
          ${email.category ? `<span class="badge category-${email.category} category-badge">${email.category}</span>` : ''}
        </div>
      `;
      
      item.addEventListener('click', () => {
        document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        currentEmail = email.id;
        showEmailDetail(email);
      });
      
      emailList.appendChild(item);
    });
  }
  
  function showEmailDetail(email) {
    emailDetail.innerHTML = `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-start">
          <h5>${email.subject}</h5>
          ${email.category ? `<span class="badge category-${email.category} category-badge">${email.category}</span>` : ''}
        </div>
        <div class="d-flex justify-content-between">
          <div>
            <strong>From:</strong> ${email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address}
          </div>
          <div>
            <small>${formatDate(email.date, true)}</small>
          </div>
        </div>
        ${email.to ? `<div><strong>To:</strong> ${formatRecipients(email.to)}</div>` : ''}
        ${email.cc ? `<div><strong>CC:</strong> ${formatRecipients(email.cc)}</div>` : ''}
      </div>
      <hr>
      <div class="email-body mb-3">
        ${email.html ? email.html : `<pre>${email.text || ''}</pre>`}
      </div>
      <div class="d-flex justify-content-end">
        <button class="btn btn-primary" onclick="getSuggestedReply('${email.id}')">Get Suggested Reply</button>
      </div>
    `;
  }
  
  // Search functionality
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) {
      renderEmails(emails);
      return;
    }
    
    searchEmails(query);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
  
  async function searchEmails(query) {
    try {
      const response = await fetch(`${API_URL}/emails/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      renderEmails(results);
    } catch (error) {
      console.error('Error searching emails:', error);
    }
  }
  
  // Suggested Reply functionality
  window.getSuggestedReply = async function(emailId) {
    try {
      const response = await fetch(`${API_URL}/emails/${emailId}/suggest-reply`);
      const data = await response.json();
      
      suggestedReplyTextarea.value = data.suggestedReply || 'No suggested reply available.';
      
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('suggestReplyModal'));
      modal.show();
    } catch (error) {
      console.error('Error getting suggested reply:', error);
    }
  };
  
  // Copy to clipboard functionality
  copyReplyButton.addEventListener('click', () => {
    suggestedReplyTextarea.select();
    document.execCommand('copy');
    
    // Show feedback
    const originalText = copyReplyButton.textContent;
    copyReplyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyReplyButton.textContent = originalText;
    }, 2000);
  });
  
  // Helper functions
  function formatDate(dateString, detailed = false) {
    const date = new Date(dateString);
    
    if (detailed) {
      return date.toLocaleString();
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }
  
  function formatRecipients(recipients) {
    if (!recipients || !Array.isArray(recipients)) return '';
    
    return recipients.map(r => {
      if (r.name) {
        return `${r.name} <${r.address}>`;
      }
      return r.address;
    }).join(', ');
  }
});