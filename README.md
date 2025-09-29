# Chrome Tally Marks Extension

A Chrome extension that allows users to create and manage multiple tally mark groups for quick and simple counting. Tally groups and counts are global and persist across all browser sessions, not tied to specific web pages or domains.

## Features
- Create multiple tally groups, each with a custom label
- Each group displays:
  - A label
  - A total tally mark count
  - A plus (+) button to add a tally mark
  - Tally marks displayed below the label and count
- Add and remove tally marks within each group
- Persistent tally marks and groups globally (not per domain or page)
- Customizable appearance
- Lightweight and secure

## Installation

### For Development
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project directory.

### For Production
The extension will be available on the Chrome Web Store (link to be added after publishing).

## Usage
- Click the extension icon to open the popup and manage tally groups.
- Create a new group by entering a label and clicking the add button.
- For each group, click the plus (+) button to add a tally mark. The total count updates automatically.
- Tally marks are displayed below each group’s label and count.
- Tally groups and counts are saved globally and will persist across all browser sessions.

## Permissions
- Minimal permissions are requested for storage and extension popup interaction.
- No personal data is collected or transmitted.

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

## License
[MIT](LICENSE)

---

For more details, see `agent.md` for best practices and development guidelines.
