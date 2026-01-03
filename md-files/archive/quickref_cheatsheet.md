# Real Estate Email Extraction - Quick Reference Cheat Sheet

## QUICK START (TL;DR)

### Prerequisites Setup (5 minutes)
```bash
# 1. Create Google Cloud Project
# - Go to console.cloud.google.com
# - Enable Gmail API
# - Create OAuth 2.0 credentials (Desktop app)
# - Download credentials.json

# 2. Create project folder and virtual environment
mkdir real_estate_email_parser && cd real_estate_email_parser
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client beautifulsoup4 pandas
```

### First Run (5 minutes)
```bash
# Copy all 5 Python files into your folder
# Make sure credentials.json is in the folder

# Run authentication
python main.py

# Your browser will open → Click "Allow" → Done!
```

### Every Subsequent Run
```bash
# Extract emails to CSV
python main.py

# With options:
python main.py --label "Homes_For_Sale" --max-results 100 --preview
```

---

## COMMON COMMANDS

| Command | Effect |
|---------|--------|
| `python main.py` | Extract all emails from "Homes_For_Sale" label, create CSV |
| `python main.py --label "MyLabel"` | Extract from custom label name |
| `python main.py --max-results 200` | Fetch up to 200 emails instead of 50 |
| `python main.py --preview` | Show summary of extracted data before saving |
| `python main.py --output custom_name.csv` | Save to custom filename |
| `python phase_1_auth.py` | Re-authenticate (delete token.pickle first) |

---

## CUSTOMIZING REGEX PATTERNS

**File to edit:** `phase_3_extraction.py`

**Example: Add pattern for property link**
```python
'property_link': [
    r'https?://(?:www\.)?(?:zillow|realtor|trulia|mls)[^\s<>"{}|\\^`\[\]]*',
    r'https?://[^\s<>"{}|\\^`\[\]]+',
    r'View listing: (https://.*)',  # Add this for custom format
]
```

**Test regex patterns at:** https://regex101.com

---

## EMAIL LABEL SETUP

### Create a Gmail Label
1. Gmail → Menu (≡) → Create new label
2. Name: `Homes_For_Sale`

### Auto-Filter Emails to Label
1. Gmail → Settings (gear) → Filters and Blocked Addresses
2. Create new filter
3. Set criteria (e.g., From: zillow@zillowmail.com)
4. Apply label: `Homes_For_Sale`

---

## FILE STRUCTURE

```
real_estate_email_parser/
├── venv/                        # Virtual environment (auto-created)
├── credentials.json             # From Google Cloud (KEEP SECRET)
├── token.pickle                 # Auto-created after first run
├── phase_1_auth.py              # Authentication module
├── phase_2_parser.py            # Email parsing module
├── phase_3_extraction.py        # Data extraction module
├── phase_4_csv_export.py        # CSV export module
├── main.py                      # Main execution script
├── properties_20251123_145800.csv  # Output (auto-named)
└── .gitignore                   # Optional: credentials.json, token.pickle, *.csv, venv/
```

---

## OUTPUT CSV COLUMNS

Your CSV will have these columns:
- `address` - Street address
- `price` - Property price
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms
- `sqft` - Square footage
- `property_link` - URL to property listing
- `agent_name` - Real estate agent name
- `agent_phone` - Agent phone number
- `agent_email` - Agent email address
- `source_email` - Email that contained the listing
- `received_date` - Date email was received
- `subject` - Subject line of email

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `credentials.json not found` | Download it from Google Cloud Console (Step 1.4) |
| `Label not found` | Create the label in Gmail exactly as specified |
| `Empty fields in CSV` | Your email format doesn't match regex patterns. Test with regex101.com and add custom patterns |
| `No emails found` | Create Gmail filter to auto-label incoming emails |
| `Authentication failed` | Delete `token.pickle` and run `python main.py` again |
| `UnicodeDecodeError` | Some emails use unusual encodings. The parser will try plain text → HTML fallback |
| `Connection timeout` | Gmail API temporarily unavailable. Wait and retry, or reduce `--max-results` |

---

## ADVANCED: SCHEDULING AUTOMATED RUNS

### Windows (Task Scheduler)
```
Program: C:\path\to\venv\Scripts\python.exe
Arguments: C:\path\to\main.py --label Homes_For_Sale
Schedule: Daily at 9:00 AM
```

### macOS/Linux (Cron)
```bash
0 9 * * * cd /path/to/real_estate_email_parser && ./venv/bin/python main.py >> output.log 2>&1
```

### Python Scheduler (Any OS)
```bash
pip install schedule
# Create scheduler.py
import schedule
schedule.every().day.at("09:00").do(lambda: os.system("python main.py"))
# Run: python scheduler.py
```

---

## SECURITY REMINDERS

✓ Never share `credentials.json` or `token.pickle`
✓ Add to `.gitignore` if using version control
✓ Credentials are read-only (gmail.readonly scope)
✓ Data stored locally only (except OAuth approval)

---

## NEXT STEPS AFTER FIRST SUCCESS

1. **Integrate with HubSpot:** Import CSV directly into your CRM
2. **Analyze Data:** Use Pandas for price analysis, agent rankings
3. **Remove Duplicates:** Track email IDs to skip already-processed emails
4. **Multi-source:** Combine CSVs from multiple Gmail accounts/labels
5. **Dashboards:** Visualize in Google Sheets or Data Studio
6. **Alerts:** Send notification when property matching criteria is found

---

## GETTING HELP

**Error in Python:** Read the full error message - it tells you exactly what's wrong
**Gmail API Issues:** Check Google Cloud Console logs
**Regex Pattern Issues:** Go to regex101.com and test with sample email text
**General Questions:** Ask ChatGPT with error message + file name

---

## ESTIMATED TIME BREAKDOWN

| Phase | Time |
|-------|------|
| Google Cloud setup | 10 minutes |
| Virtual environment + dependencies | 5 minutes |
| Copy Python files | 2 minutes |
| First authentication run | 2 minutes |
| Initial extraction | 1-5 minutes (depends on email count) |
| **Total First Time** | **20-25 minutes** |
| Subsequent runs | 30 seconds - 5 minutes |

---

**Ready to go?** Start with the Complete Implementation Guide (email_extraction_guide.md) for detailed instructions!
