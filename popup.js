// popup.js
// Handles tally group creation, tally mark increment, and rendering

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-group-form');
  const labelInput = document.getElementById('group-label');
  const groupsContainer = document.getElementById('groups-container');
  const header = document.querySelector('h1');

  // Color palette for groups
  const GROUP_COLORS = [
    '#1e90ff', // blue
    '#e67e22', // orange
    '#c62fa0', // magenta
    '#27ae60', // green
    '#f44336', // red
    '#00bcd4', // cyan
    '#ffeb3b', // yellow
    '#9c27b0', // purple
    '#ff9800', // amber
    '#607d8b'  // blue-grey
  ];
  let nextColorIdx = 0;

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
          <span class="group-label">${group.label}
            <span class="tally-badge">${group.count}</span>
          </span>
          <div class="group-actions">
            <button class="add-tally" data-idx="${idx}" aria-label="Add tally"><span>+</span></button>
            <button class="delete-group" data-idx="${idx}" aria-label="Delete group">x</button>
          </div>
        </div>
        <div class="tally-marks">${renderTallyMarks(group.count, group.color)}</div>
      `;
      groupsContainer.appendChild(groupDiv);
    });
  }

  // Render tally marks in groups of 5 (classic tally style)
  function renderTallyMarks(count, color) {
    let html = '';
    const groupCount = Math.floor(count / 5);
    const remainder = count % 5;
    for (let i = 0; i < groupCount; i++) {
      html += `
        <span class="tally-group-5">
          <span class="tally-bar v"></span>
          <span class="tally-bar v"></span>
          <span class="tally-bar v"></span>
          <span class="tally-bar v"></span>
          <span class="tally-bar h" style="background:${color}"></span>
        </span>
      `;
    }
    if (remainder > 0) {
      html += '<span class="tally-group-5">';
      for (let i = 0; i < remainder; i++) {
        html += '<span class="tally-bar v"></span>';
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
      // Assign color from palette, cycle if needed
      const color = GROUP_COLORS[nextColorIdx % GROUP_COLORS.length];
      nextColorIdx++;
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

  // Handle add tally and delete group
  groupsContainer.addEventListener('click', (e) => {
    // Check if clicked element or its parent is the add-tally button
    const addButton = e.target.closest('.add-tally');
    const deleteButton = e.target.closest('.delete-group');

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
        groups[idx].count = groups[idx].tallies.length;

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
    }
  });

  loadGroups();
});
