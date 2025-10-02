// popup.js
// Handles tally group creation, tally mark increment, and rendering

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-group-form');
  const labelInput = document.getElementById('group-label');
  const groupsContainer = document.getElementById('groups-container');
  const header = document.querySelector('h1');

  // Color palette for groups
  const GROUP_COLORS = [
    '#FFBE0B',
    '#FB5607',
    '#F333FF',
    '#FF006E',
    '#8338EC',
    '#3A86FF',
    '#3357FF',
    '#5CA330',
    '#43AA8B'
  ];

  // Get or prompt for username
  function getOrPromptUsername() {
    chrome.storage.sync.get({ username: null }, (data) => {
      if (data.username) {
        header.textContent = `${data.username}'s Tally Marks`;
      } else {
        const name = prompt("What's your name?", "");
        if (name && name.trim()) {
          chrome.storage.sync.set({ username: name.trim() }, () => {
            header.textContent = `${name.trim()}'s Tally Marks`;
          });
        } else {
          header.textContent = "Tally Marks";
        }
      }
    });
  }

  getOrPromptUsername();

  // Load groups from storage
  function loadGroups() {
    chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
      renderGroups(data.tallyGroups);
    });
  }

  // Save groups to storage
  function saveGroups(groups) {
    chrome.storage.sync.set({ tallyGroups: groups });
  }

  // Render all groups
  function renderGroups(groups) {
    groupsContainer.innerHTML = '';
    groups.forEach((group, idx) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'tally-group';
      groupDiv.style.borderLeft = `6px solid ${group.color}`;
      groupDiv.style.setProperty('--group-color', group.color);
      groupDiv.innerHTML = `
        <div class="group-header">
          <span class="group-label-container">
            <button class="color-chooser-btn" data-idx="${idx}" aria-label="Choose color" title="Choose group color" style="background-color: ${group.color}"></button>
            <span class="group-label editable" data-idx="${idx}" title="Double-click to edit">${group.label}</span>
            <input class="group-label-input" data-idx="${idx}" value="${group.label}" style="display: none;" maxlength="32">
          </span>
          <span class="tally-badge">${group.count}</span>
          <div class="group-actions">
            <button class="add-tally" data-idx="${idx}" aria-label="Add tally" title="Add tally mark"><span>+</span></button>
            <button class="reset-group" data-idx="${idx}" aria-label="Reset tallies" title="Reset all tallies to zero">-</button>
            <button class="delete-group" data-idx="${idx}" aria-label="Delete group" title="Delete this entire group">x</button>
          </div>
        </div>
        <div class="color-picker" data-idx="${idx}" style="display: none;">
          ${GROUP_COLORS.map((color, colorIdx) => 
            `<button class="color-option" data-idx="${idx}" data-color="${color}" style="background-color: ${color}" title="Change to this color"></button>`
          ).join('')}
        </div>
        <div class="tally-marks">${renderTallyMarks(group.count, group.color)}</div>
      `;
      groupsContainer.appendChild(groupDiv);
    });
  }

  // Render tally marks in groups of 5 (classic tally style)
  function renderTallyMarks(count, color, animate = false) {
    let html = '';
    const groupCount = Math.floor(count / 5);
    const remainder = count % 5;

    // Render complete groups of 5
    for (let i = 0; i < groupCount; i++) {
      const isLastGroup = (i === groupCount - 1 && remainder === 0);
      html += `
        <span class="tally-group-5">
          <span class="tally-bar v"></span>
          <span class="tally-bar v"></span>
          <span class="tally-bar v"></span>
          <span class="tally-bar v"></span>
          <span class="tally-bar h${animate && isLastGroup ? ' animate-new' : ''}" style="background:${color}"></span>
        </span>
      `;
    }

    // Render incomplete group
    if (remainder > 0) {
      html += '<span class="tally-group-5">';
      for (let i = 0; i < remainder; i++) {
        const isNewTally = (animate && i === remainder - 1);
        html += `<span class="tally-bar v${isNewTally ? ' animate-new' : ''}"></span>`;
      }
      html += '</span>';
    }
    return html;
  }

  // Add group
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const label = labelInput.value.trim();
    if (!label) return;
    chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
      const groups = data.tallyGroups;
      // Randomly select color from palette
      const color = GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
      groups.push({
        label,
        count: 0,
        color,
        tallies: [] // Initialize empty tallies array for new groups
      });
      saveGroups(groups);
      renderGroups(groups);
      labelInput.value = '';
    });
  });

  // Animate new tally without re-rendering entire group
  function animateNewTally(groupIdx, oldCount, newCount, color) {
    const groupDiv = groupsContainer.children[groupIdx];
    const tallyMarksDiv = groupDiv.querySelector('.tally-marks');
    const tallyBadge = groupDiv.querySelector('.tally-badge');

    // Update the badge count
    tallyBadge.textContent = newCount;

    // Re-render tally marks with animation flag
    tallyMarksDiv.innerHTML = renderTallyMarks(newCount, color, true);
  }

  // Handle add tally, reset group, delete group, color chooser button, and color selection
  groupsContainer.addEventListener('click', (e) => {
    const addButton = e.target.closest('.add-tally');
    const resetButton = e.target.closest('.reset-group');
    const deleteButton = e.target.closest('.delete-group');
    const colorChooserBtn = e.target.closest('.color-chooser-btn');
    const colorOption = e.target.closest('.color-option');

    if (addButton) {
      const idx = parseInt(addButton.getAttribute('data-idx'), 10);
      chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
        const groups = data.tallyGroups;

        // Initialize tallies array if it doesn't exist (for backward compatibility)
        if (!groups[idx].tallies) {
          groups[idx].tallies = [];
        }

        // Add new tally with just timestamp
        groups[idx].tallies.push(new Date().toISOString());

        // Update count based on tallies array length
        const oldCount = groups[idx].count;
        groups[idx].count = groups[idx].tallies.length;

        saveGroups(groups);

        // Only animate the specific group that was updated
        animateNewTally(idx, oldCount, groups[idx].count, groups[idx].color);
      });
    } else if (resetButton) {
      const idx = parseInt(resetButton.getAttribute('data-idx'), 10);
      chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
        const groups = data.tallyGroups;

        // Reset tallies array and count
        groups[idx].tallies = [];
        groups[idx].count = 0;

        saveGroups(groups);
        renderGroups(groups);
      });
    } else if (deleteButton) {
      const idx = parseInt(deleteButton.getAttribute('data-idx'), 10);
      chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
        const groups = data.tallyGroups;
        groups.splice(idx, 1);
        saveGroups(groups);
        renderGroups(groups);
      });
    } else if (colorChooserBtn) {
      const idx = parseInt(colorChooserBtn.getAttribute('data-idx'), 10);
      const container = colorChooserBtn.closest('.tally-group');
      const colorPicker = container.querySelector('.color-picker');

      // Toggle color picker visibility
      if (colorPicker.style.display === 'none') {
        colorPicker.style.display = 'flex';
      } else {
        colorPicker.style.display = 'none';
      }
    } else if (colorOption) {
      const idx = parseInt(colorOption.getAttribute('data-idx'), 10);
      const newColor = colorOption.getAttribute('data-color');

      chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
        const groups = data.tallyGroups;
        groups[idx].color = newColor;
        saveGroups(groups);
        renderGroups(groups);
      });
    }
  });

  // Handle double-click on group labels for inline editing
  groupsContainer.addEventListener('dblclick', (e) => {
    const label = e.target.closest('.group-label');
    if (label) {
      const idx = parseInt(label.getAttribute('data-idx'), 10);
      const input = label.nextElementSibling;

      // Show input, hide label
      label.style.display = 'none';
      input.style.display = 'inline';
      input.focus();
      input.setSelectionRange(0, input.value.length);
    }
  });

  // Handle input blur and Enter/Escape keys for label editing
  groupsContainer.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('group-label-input')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        const newLabel = e.target.value.trim();

        chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
          const groups = data.tallyGroups;
          if (newLabel) {
            groups[idx].label = newLabel;
            saveGroups(groups);
          }
          renderGroups(groups);
        });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
          const groups = data.tallyGroups;
          e.target.value = groups[idx].label; // Reset to original label
          renderGroups(groups);
        });
      }
      // For all other keys (like backspace), do nothing - let normal input behavior happen
    }
  });

  // Handle input blur to save changes and toggle visibility
  groupsContainer.addEventListener('blur', (e) => {
    if (e.target.classList.contains('group-label-input')) {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      const newLabel = e.target.value.trim();

      chrome.storage.sync.get({ tallyGroups: [] }, (data) => {
        const groups = data.tallyGroups;
        if (newLabel) {
          groups[idx].label = newLabel;
          saveGroups(groups);
        }
        renderGroups(groups);
      });
    }
  }, true);

  loadGroups();
});
