# Complete Python Email-to-CSV Pipeline for Real Estate
## Step-by-Step Implementation Guide

---

## **OVERVIEW: How This Works**

Your pipeline will follow this flow:

```
Gmail Account (labeled emails)
    ↓
Python Gmail API (fetches emails with OAuth 2.0)
    ↓
Email Parser (extracts body + headers)
    ↓
Real Estate Extractor (regex + NLP patterns)
    ↓
Data Cleaner (normalizes formats)
    ↓
CSV Exporter (Pandas/csv module)
    ↓
Clean CSV File (ready for analysis)
```

**Key benefits of this approach:**
- Runs completely offline after initial fetch
- No monthly subscription costs
- Full control over regex patterns
- Can be scheduled to run hourly/daily
- Data never leaves your computer (except during OAuth approval)

---

## **PHASE 1: Set Up Google Cloud Project & Get Credentials**

### Step 1.1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **NEW PROJECT**
3. Name it: `RealEstateEmailParser` → **CREATE**
4. Wait for the project to be created (2-3 minutes)

### Step 1.2: Enable the Gmail API

1. In the console, go to **APIs & Services** → **Library**
2. Search for: `Gmail API`
3. Click on it → **ENABLE**
4. A notification says "To use this API, you need to create credentials" → Click **Create Credentials**

### Step 1.3: Create OAuth 2.0 Credentials

1. In the credentials page, click **+ Create Credentials** → **OAuth Client ID**
2. You'll see "You need to configure the OAuth consent screen first"
3. Click **Configure Consent Screen**

**On the Consent Screen page:**
- Select **External** (for testing with your own account)
- Click **CREATE**
- Fill in:
  - **App name:** `Real Estate Email Parser`
  - **User support email:** Your email
  - **Developer contact info:** Your email
- Click **SAVE & CONTINUE** through all steps
- You can skip adding test users (you'll use your own account)

### Step 1.4: Generate OAuth Client ID

1. Back to **Credentials** → **+ Create Credentials** → **OAuth Client ID**
2. Select **Desktop application**
3. Name it: `Real Estate Parser Desktop`
4. Click **CREATE**
5. Click **DOWNLOAD JSON** (or the download icon)
   - Save this file as **`credentials.json`** in your project folder
   - **KEEP THIS FILE PRIVATE** – do not share or commit to Git

---

## **PHASE 2: Set Up Your Python Environment**

### Step 2.1: Create a Project Folder

```bash
# Create folder
mkdir real_estate_email_parser
cd real_estate_email_parser

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### Step 2.2: Install Required Libraries

```bash
# Copy and paste all at once:
pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client beautifulsoup4 pandas

# Verify installations
pip list | grep -E "google|beautifulsoup|pandas"
```

**What each library does:**
- `google-auth-oauthlib`: OAuth 2.0 authentication flow
- `google-api-python-client`: Gmail API client
- `beautifulsoup4`: Parse HTML email bodies
- `pandas`: Optional (for advanced analysis later)

### Step 2.3: Organize Your Project Folder

Your folder structure should look like:

```
real_estate_email_parser/
├── venv/                    (virtual environment)
├── credentials.json         (from Step 1.4 - KEEP PRIVATE)
├── token.pickle             (auto-generated after first run)
├── phase_1_auth.py
├── phase_2_parser.py
├── phase_3_extraction.py
├── phase_4_csv_export.py
├── main.py
└── properties_20251123_145800.csv  (output)
```

---

## **PHASE 3: Create Your Python Scripts**

### Step 3.1: Copy the Code Files

Create each of these 5 Python files in your project folder. The code is provided below.

#### File 1: `phase_1_auth.py` (Authentication)

```python
"""
PHASE 1: Gmail API Authentication Setup
This script handles the OAuth 2.0 authentication with Gmail.
Run this ONCE to generate your token.
"""

import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def authenticate_gmail():
    """
    Authenticates with Gmail API using OAuth 2.0
    Returns: Gmail service object
    """
    creds = None
    
    # token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If credentials don't exist or are invalid, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # This will open a browser for you to authorize
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json',
                SCOPES
            )
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for future use
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    from googleapiclient.discovery import build
    service = build('gmail', 'v1', credentials=creds)
    return service

if __name__ == '__main__':
    print("Starting Gmail authentication...")
    service = authenticate_gmail()
    print("✓ Authentication successful!")
    print("Token saved to token.pickle")
```

#### File 2: `phase_2_parser.py` (Email Parsing)

```python
"""
PHASE 2: Email Retrieval and Parsing
Fetches emails from your Gmail label and extracts the body content
"""

import base64
import re
from email.mime.text import MIMEText
from bs4 import BeautifulSoup

def get_email_body(email_data):
    """
    Extracts the plain text body from an email message
    Handles both single-part and multi-part MIME messages
    """
    try:
        payload = email_data.get('payload', {})
        
        # Case 1: Simple email with no parts
        if 'body' in payload and 'data' in payload['body']:
            data = payload['body']['data']
            text = base64.urlsafe_b64decode(data).decode('utf-8')
            return text
        
        # Case 2: Multi-part message (has 'parts')
        if 'parts' in payload:
            text_part = None
            html_part = None
            
            def find_text_parts(parts):
                nonlocal text_part, html_part
                for part in parts:
                    mime_type = part.get('mimeType', '')
                    
                    if mime_type == 'text/plain' and 'data' in part.get('body', {}):
                        text_part = part['body']['data']
                    elif mime_type == 'text/html' and 'data' in part.get('body', {}):
                        html_part = part['body']['data']
                    
                    if 'parts' in part:
                        find_text_parts(part['parts'])
            
            find_text_parts(payload['parts'])
            
            data = text_part or html_part
            if data:
                text = base64.urlsafe_b64decode(data).decode('utf-8')
                # If it's HTML, strip tags
                if html_part and not text_part:
                    soup = BeautifulSoup(text, 'html.parser')
                    text = soup.get_text()
                return text
        
        return ""
    
    except Exception as e:
        print(f"Error extracting body: {e}")
        return ""

def get_email_headers(email_data):
    """
    Extracts key headers from an email
    """
    headers = email_data['payload']['headers']
    header_dict = {}
    
    for header in headers:
        name = header['name']
        value = header['value']
        header_dict[name] = value
    
    return {
        'From': header_dict.get('From', 'Unknown'),
        'Subject': header_dict.get('Subject', 'No Subject'),
        'Date': header_dict.get('Date', 'Unknown'),
        'To': header_dict.get('To', 'Unknown'),
    }

def fetch_labeled_emails(service, label_name, max_results=50):
    """
    Fetches all emails from a specific Gmail label
    """
    try:
        # Get label ID by name
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        
        label_id = None
        for label in labels:
            if label['name'] == label_name:
                label_id = label['id']
                break
        
        if not label_id:
            print(f"Label '{label_name}' not found!")
            return []
        
        # Fetch messages from the label
        results = service.users().messages().list(
            userId='me',
            labelIds=[label_id],
            maxResults=max_results
        ).execute()
        
        messages = results.get('messages', [])
        print(f"Found {len(messages)} emails in label '{label_name}'")
        
        # Get full details for each message
        emails = []
        for msg in messages:
            email_data = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='full'
            ).execute()
            emails.append(email_data)
        
        return emails
    
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return []
```

#### File 3: `phase_3_extraction.py` (Data Extraction)

```python
"""
PHASE 3: Real Estate Data Extraction
Parses property information from email bodies using regex
CUSTOMIZE THE REGEX PATTERNS for your specific email sources
"""

import re
from typing import Dict, Optional

class RealEstateExtractor:
    """
    Extracts real estate property data from email text
    IMPORTANT: Customize these patterns for your email sources
    """
    
    def __init__(self):
        # Define extraction patterns - CUSTOMIZE THESE for your emails
        self.patterns = {
            'address': [
                r'(?:Address|address|Location|location):\s*([^\n]+)',
                r'(\d+\s+[\w\s]+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane).*?(?:FL|Florida|\d{5}))',
            ],
            'price': [
                r'(?:Price|price|List Price|list price):\s*\$?([\d,]+)',
                r'\$(\d+(?:,\d{3})*)',
            ],
            'bedrooms': [
                r'(?:Beds|Bedrooms|BR|bed):\s*(\d+)',
                r'(\d+)\s*(?:bed|bedroom)',
            ],
            'bathrooms': [
                r'(?:Baths|Bathrooms|BA|bath):\s*(\d+)',
                r'(\d+)\s*(?:bath|bathroom)',
            ],
            'sqft': [
                r'(?:Sq Ft|Square Feet|sqft):\s*([\d,]+)',
                r'([\d,]+)\s*(?:sq\.?\s*ft|square feet)',
            ],
            'property_link': [
                r'https?://(?:www\.)?(?:zillow|realtor|trulia|mls)[^\s<>"{}|\\^`\[\]]*',
                r'https?://[^\s<>"{}|\\^`\[\]]+',
            ],
            'agent_name': [
                r'(?:Agent|agent|Listing Agent|listing agent):\s*([^\n]+)',
                r'(?:Contact|contact):\s*([^\n]+)',
            ],
            'agent_phone': [
                r'(?:Phone|phone):\s*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})',
                r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})',
            ],
            'agent_email': [
                r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
            ],
        }
    
    def extract_field(self, text: str, field_name: str) -> Optional[str]:
        """
        Extracts a specific field using regex patterns
        """
        if field_name not in self.patterns:
            return None
        
        for pattern in self.patterns[field_name]:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def extract_all(self, email_body: str, email_headers: Dict) -> Dict:
        """
        Extracts all real estate data from an email
        """
        combined_text = f"{email_headers['Subject']}\n{email_body}"
        
        data = {
            'address': self.extract_field(combined_text, 'address'),
            'price': self.extract_field(combined_text, 'price'),
            'bedrooms': self.extract_field(combined_text, 'bedrooms'),
            'bathrooms': self.extract_field(combined_text, 'bathrooms'),
            'sqft': self.extract_field(combined_text, 'sqft'),
            'property_link': self.extract_field(combined_text, 'property_link'),
            'agent_name': self.extract_field(combined_text, 'agent_name'),
            'agent_phone': self.extract_field(combined_text, 'agent_phone'),
            'agent_email': self.extract_field(combined_text, 'agent_email'),
            'source_email': email_headers['From'],
            'received_date': email_headers['Date'],
            'subject': email_headers['Subject'],
        }
        
        return data
    
    def clean_data(self, data: Dict) -> Dict:
        """
        Cleans and normalizes extracted data
        """
        if data.get('price'):
            data['price'] = data['price'].replace(',', '')
        
        if data.get('sqft'):
            data['sqft'] = data['sqft'].replace(',', '')
        
        if data.get('agent_phone'):
            phone = re.sub(r'\D', '', data['agent_phone'])
            if len(phone) == 10:
                data['agent_phone'] = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
        
        return data
```

#### File 4: `phase_4_csv_export.py` (CSV Export)

```python
"""
PHASE 4: CSV Export
Saves extracted data to a CSV file with proper formatting
"""

import csv
from datetime import datetime
from typing import List, Dict

def export_to_csv(data_list: List[Dict], filename: str = None) -> str:
    """
    Exports extracted property data to a CSV file
    """
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"properties_{timestamp}.csv"
    
    if not data_list:
        print("No data to export!")
        return None
    
    fieldnames = [
        'address',
        'price',
        'bedrooms',
        'bathrooms',
        'sqft',
        'property_link',
        'agent_name',
        'agent_phone',
        'agent_email',
        'source_email',
        'received_date',
        'subject',
    ]
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in data_list:
                clean_row = {field: row.get(field, '') for field in fieldnames}
                writer.writerow(clean_row)
        
        print(f"✓ CSV exported to: {filename}")
        print(f"✓ Total properties: {len(data_list)}")
        return filename
    
    except Exception as e:
        print(f"Error exporting to CSV: {e}")
        return None

def print_data_preview(data_list: List[Dict], max_rows: int = 5):
    """
    Prints a preview of extracted data in table format
    """
    if not data_list:
        print("No data to preview")
        return
    
    print("\n" + "="*100)
    print("PREVIEW OF EXTRACTED DATA")
    print("="*100)
    
    for i, data in enumerate(data_list[:max_rows], 1):
        print(f"\nProperty {i}:")
        print(f"  Address:       {data.get('address', 'N/A')}")
        print(f"  Price:         ${data.get('price', 'N/A')}")
        print(f"  Bedrooms:      {data.get('bedrooms', 'N/A')}")
        print(f"  Bathrooms:     {data.get('bathrooms', 'N/A')}")
        print(f"  Sq Ft:         {data.get('sqft', 'N/A')}")
        print(f"  Property Link: {data.get('property_link', 'N/A')}")
        print(f"  Agent:         {data.get('agent_name', 'N/A')}")
        print(f"  Agent Phone:   {data.get('agent_phone', 'N/A')}")
        print(f"  Agent Email:   {data.get('agent_email', 'N/A')}")
    
    if len(data_list) > max_rows:
        print(f"\n... and {len(data_list) - max_rows} more properties")
    
    print("\n" + "="*100)
```

#### File 5: `main.py` (Main Execution)

```python
"""
MAIN EXECUTION SCRIPT
Runs the complete pipeline: Authenticate → Fetch → Extract → Export

USAGE:
1. First run: python main.py --setup
2. Subsequent runs: python main.py --label "Homes_For_Sale"
"""

import argparse
import sys
from phase_1_auth import authenticate_gmail
from phase_2_parser import get_email_body, get_email_headers, fetch_labeled_emails
from phase_3_extraction import RealEstateExtractor
from phase_4_csv_export import export_to_csv, print_data_preview

def main():
    parser = argparse.ArgumentParser(
        description='Extract real estate emails to CSV'
    )
    parser.add_argument(
        '--label',
        type=str,
        default='Homes_For_Sale',
        help='Gmail label to extract from (default: Homes_For_Sale)'
    )
    parser.add_argument(
        '--max-results',
        type=int,
        default=50,
        help='Maximum emails to fetch (default: 50)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default=None,
        help='Output CSV filename'
    )
    parser.add_argument(
        '--preview',
        action='store_true',
        help='Show preview of extracted data'
    )
    
    args = parser.parse_args()
    
    print("="*70)
    print("REAL ESTATE EMAIL EXTRACTION PIPELINE")
    print("="*70)
    
    # Step 1: Authenticate
    print("\n[1/4] Authenticating with Gmail...")
    try:
        service = authenticate_gmail()
        print("✓ Authentication successful!")
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return
    
    # Step 2: Fetch emails
    print(f"\n[2/4] Fetching emails from label: '{args.label}'...")
    emails = fetch_labeled_emails(service, args.label, args.max_results)
    
    if not emails:
        print(f"✗ No emails found in label '{args.label}'")
        print("   Tip: Create a Gmail label and forward your property emails to it")
        return
    
    print(f"✓ Fetched {len(emails)} emails")
    
    # Step 3: Extract data
    print("\n[3/4] Extracting real estate data...")
    extractor = RealEstateExtractor()
    extracted_data = []
    
    for i, email in enumerate(emails, 1):
        try:
            headers = get_email_headers(email)
            body = get_email_body(email)
            
            data = extractor.extract_all(body, headers)
            data = extractor.clean_data(data)
            extracted_data.append(data)
            
            print(f"  [{i}/{len(emails)}] {data.get('address', 'Unknown address')[:50]}")
        except Exception as e:
            print(f"  [{i}/{len(emails)}] Error: {e}")
    
    print(f"✓ Extracted {len(extracted_data)} properties")
    
    # Step 4: Export to CSV
    print("\n[4/4] Exporting to CSV...")
    csv_file = export_to_csv(extracted_data, args.output)
    
    if csv_file:
        print("✓ Export complete!")
        
        if args.preview:
            print_data_preview(extracted_data)
    
    print("\n" + "="*70)
    print("PIPELINE COMPLETE")
    print("="*70)

if __name__ == '__main__':
    main()
```

---

## **PHASE 4: Set Up Gmail Labels**

### Step 4.1: Create a Gmail Label

1. Go to [Gmail](https://mail.google.com)
2. Click the hamburger menu (≡) on the left
3. Scroll down → **Create new label**
4. Name it: `Homes_For_Sale`
5. Click **Create**

### Step 4.2: Create Filters to Auto-Label Emails

1. Go to Gmail settings (gear icon) → **See all settings**
2. Go to **Filters and Blocked Addresses** tab
3. Click **Create a new filter**
4. In the search criteria, add:
   - **From:** `zillow@zillowmail.com` (or your email sources)
   - **Subject:** `New home alert` (or keywords specific to your emails)
5. Click **Create filter**
6. Check "Apply label:" → Select `Homes_For_Sale`
7. Check "Skip the Inbox"
8. Click **Create filter**

**Repeat for each email source** (Zillow, Realtor, Trulia, MLS, local agents, etc.)

---

## **PHASE 5: First Run & Authentication**

### Step 5.1: Run the Initial Authentication

```bash
python main.py
```

**What happens:**
1. Python will open your browser and ask for Gmail permission
2. Click **Allow** to grant access to your Gmail
3. You'll see "The authentication flow has completed"
4. A file called `token.pickle` is auto-created in your folder
5. You're now authenticated!

### Step 5.2: Verify the Output

After the script runs:
- Check the console output for any errors
- Look for a file named `properties_YYYYMMDD_HHMMSS.csv`
- Open it in Excel, Google Sheets, or your CSV viewer

---

## **PHASE 6: Customize the Extraction Patterns**

### Step 6.1: Inspect Sample Emails

Before fine-tuning, you need to see what your emails actually look like:

1. Forward or copy the body text of a sample property email
2. Open `phase_3_extraction.py`
3. Look at the `patterns` dictionary inside the `RealEstateExtractor` class

### Step 6.2: Add Custom Patterns

For example, if your Zillow emails say "List Price: $500,000" but the current pattern doesn't catch it:

```python
# Original pattern:
'price': [
    r'(?:Price|price|List Price|list price):\s*\$?([\d,]+)',
]

# Add more variations:
'price': [
    r'(?:Price|price|List Price|list price):\s*\$?([\d,]+)',
    r'Asking Price.*?\$?([\d,]+)',  # New pattern for different format
]
```

### Step 6.3: Test Patterns with Regex Tester

1. Go to [regex101.com](https://regex101.com)
2. Paste your email body in the "Test String" section
3. Try different regex patterns in the "Regular Expression" box
4. Once it matches correctly, add it to `phase_3_extraction.py`

---

## **PHASE 7: Schedule Automated Runs**

### Option A: Windows (Task Scheduler)

1. Open **Task Scheduler**
2. Click **Create Basic Task**
3. Name it: "Extract Real Estate Emails"
4. Set trigger: Daily at 9:00 AM (or your preferred time)
5. Set action:
   - Program: `C:\Path\To\Your\venv\Scripts\python.exe`
   - Arguments: `C:\Path\To\Your\main.py --label Homes_For_Sale --preview`
6. Click **Finish**

### Option B: macOS/Linux (Cron Job)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9:00 AM):
0 9 * * * cd /path/to/real_estate_email_parser && ./venv/bin/python main.py --label Homes_For_Sale --preview >> output.log 2>&1
```

### Option C: Python Scheduler (Works Anywhere)

Create a file called `scheduler.py`:

```python
import schedule
import time
from main import main

def job():
    print("Running scheduled extraction...")
    main()

schedule.every().day.at("09:00").do(job)

while True:
    schedule.run_pending()
    time.sleep(60)
```

Run it:
```bash
pip install schedule
python scheduler.py
```

---

## **PHASE 8: Troubleshooting**

### Issue: "credentials.json not found"
**Solution:** Make sure `credentials.json` is in the same folder as `main.py` (from Step 1.4)

### Issue: "Label 'Homes_For_Sale' not found"
**Solution:** Create the label in Gmail (Step 4.1) and make sure spelling matches exactly

### Issue: "No data extracted" or many empty fields
**Solution:** Your email format doesn't match the regex patterns. Debug with regex101.com and add custom patterns (Step 6.3)

### Issue: "Email body is blank"
**Solution:** Some emails use HTML formatting. The parser tries to extract plain text first, then HTML. If still blank, check if the email has attachments instead of body text

### Issue: "Connection timeout"
**Solution:** Gmail API might be temporarily unavailable. Wait a few seconds and try again. Or increase `--max-results` to fetch fewer emails at once

---

## **NEXT STEPS & ADVANCED OPTIONS**

1. **Integrate with HubSpot:** Use the CSV as a data source for HubSpot CRM imports
2. **Analyze Data:** Use Pandas for price trends, neighborhood clustering, agent rankings
3. **Create Dashboard:** Use Google Sheets + Data Studio to visualize properties
4. **Filter Duplicates:** Add logic to prevent re-processing old emails
5. **Combine Multiple Sources:** Run extraction on emails from Zillow, Realtor, MLS, and agents—merge all CSVs
6. **Alert System:** Send yourself a notification when a property matching your criteria is found

---

## **Security Checklist**

- ✓ Keep `credentials.json` private (never commit to Git or share)
- ✓ Keep `token.pickle` private (stores your OAuth token)
- ✓ Use `.gitignore` file if version controlling:
  ```
  credentials.json
  token.pickle
  *.csv
  venv/
  ```
- ✓ Limit API scope to `gmail.readonly` (read-only access)
- ✓ Run this script only on your personal computer

---

**You're now ready to build your automated pipeline!** Start with Phase 1 and work through each phase sequentially.
