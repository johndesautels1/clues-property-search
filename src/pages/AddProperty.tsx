/**
 * CLUES Property Dashboard - Add Property Page
 * LLM-powered property scraping + Manual entry - CONNECTED TO STORE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle,
  PenLine,
  Upload,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard } from '@/types/property';

type ScrapeStatus = 'idle' | 'searching' | 'scraping' | 'enriching' | 'complete' | 'error';
type InputMode = 'address' | 'url' | 'manual' | 'csv';

// Generate a simple unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function AddProperty() {
  const navigate = useNavigate();
  const { addProperty } = usePropertyStore();

  const [address, setAddress] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedEngine, setSelectedEngine] = useState('Auto');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: '',
    propertyType: 'Single Family',
    listingStatus: 'Active',
  });

  const handleManualSubmit = () => {
    if (!manualForm.address || !manualForm.city || !manualForm.price) {
      alert('Please fill in at least address, city, and price');
      return;
    }

    const newProperty: PropertyCard = {
      id: generateId(),
      address: manualForm.address,
      city: manualForm.city,
      state: manualForm.state,
      zip: manualForm.zip,
      price: parseInt(manualForm.price) || 0,
      pricePerSqft: manualForm.sqft && manualForm.price
        ? Math.round(parseInt(manualForm.price) / parseInt(manualForm.sqft))
        : 0,
      bedrooms: parseInt(manualForm.bedrooms) || 0,
      bathrooms: parseFloat(manualForm.bathrooms) || 0,
      sqft: parseInt(manualForm.sqft) || 0,
      yearBuilt: parseInt(manualForm.yearBuilt) || new Date().getFullYear(),
      smartScore: Math.floor(Math.random() * 20) + 75, // Random 75-95 for demo
      dataCompleteness: Object.values(manualForm).filter(v => v).length * 10,
      listingStatus: manualForm.listingStatus as 'Active' | 'Pending' | 'Sold',
      daysOnMarket: 0,
    };

    addProperty(newProperty);
    setLastAddedId(newProperty.id);
    setStatus('complete');

    // Reset form
    setManualForm({
      address: '',
      city: '',
      state: 'FL',
      zip: '',
      price: '',
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      yearBuilt: '',
      propertyType: 'Single Family',
      listingStatus: 'Active',
    });
  };

  const handleScrape = async () => {
    if (!address && !url) return;

    setStatus('searching');
    setProgress(10);

    // Simulate scraping process (in production, this calls the LLM scraper API)
    setTimeout(() => {
      setStatus('scraping');
      setProgress(30);
    }, 1500);

    setTimeout(() => {
      setStatus('enriching');
      setProgress(60);
    }, 3000);

    setTimeout(() => {
      // Create a mock scraped property
      const scrapedProperty: PropertyCard = {
        id: generateId(),
        address: address || 'Scraped Property',
        city: 'Tampa',
        state: 'FL',
        zip: '33601',
        price: Math.floor(Math.random() * 500000) + 300000,
        pricePerSqft: Math.floor(Math.random() * 200) + 200,
        bedrooms: Math.floor(Math.random() * 3) + 2,
        bathrooms: Math.floor(Math.random() * 2) + 1,
        sqft: Math.floor(Math.random() * 1500) + 1000,
        yearBuilt: Math.floor(Math.random() * 50) + 1970,
        smartScore: Math.floor(Math.random() * 20) + 80,
        dataCompleteness: Math.floor(Math.random() * 15) + 85,
        listingStatus: 'Active',
        daysOnMarket: Math.floor(Math.random() * 30),
      };

      addProperty(scrapedProperty);
      setLastAddedId(scrapedProperty.id);
      setStatus('complete');
      setProgress(100);
    }, 5000);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return 'Finding property listings...';
      case 'scraping':
        return 'Extracting 110 fields with AI...';
      case 'enriching':
        return 'Enriching with Walk Score, Crime, Schools...';
      case 'complete':
        return 'Property added successfully!';
      case 'error':
        return 'Error scraping property';
      default:
        return '';
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setProgress(0);
    setAddress('');
    setUrl('');
    setLastAddedId(null);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Parse CSV properly handling quoted fields with commas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const rows = text.split('\n').filter(r => r.trim());
      const headers = parseCSVLine(rows[0]);

      const data = rows.slice(1).map(row => {
        const values = parseCSVLine(row);
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });

      console.log('CSV parsed:', { headers: headers.length, rows: data.length, firstRow: data[0] });
      setCsvData(data);
    };

    reader.readAsText(file);
  };

  const handleCsvImport = () => {
    if (csvData.length === 0) {
      alert('No data to import');
      return;
    }

    let imported = 0;
    csvData.forEach(row => {
      // Try to extract address from 110-field format
      const address = row['1_full_address'] || row['address'] || row['Address'] || '';
      const city = row['city'] || row['City'] || '';
      const state = row['state'] || row['State'] || 'FL';
      const zip = row['zip'] || row['ZIP'] || '';

      // Extract price
      const listingPrice = row['7_listing_price'] || row['price'] || row['Price'] || '0';
      const price = parseInt(String(listingPrice).replace(/[^0-9]/g, '')) || 0;

      // Extract bedrooms/bathrooms
      const bedrooms = parseInt(row['12_bedrooms'] || row['bedrooms'] || row['Bedrooms'] || '0');
      const bathrooms = parseFloat(row['15_total_bathrooms'] || row['bathrooms'] || row['Bathrooms'] || '0');

      // Extract sqft
      const sqft = parseInt(row['16_living_sqft'] || row['sqft'] || row['Sqft'] || '0');

      // Extract year built
      const yearBuilt = parseInt(row['20_year_built'] || row['yearBuilt'] || row['Year Built'] || new Date().getFullYear().toString());

      // Extract status
      const status = row['4_listing_status'] || row['status'] || row['Status'] || 'Active';

      const property: PropertyCard = {
        id: generateId(),
        address,
        city,
        state,
        zip,
        price,
        pricePerSqft: sqft && price ? Math.round(price / sqft) : 0,
        bedrooms,
        bathrooms,
        sqft,
        yearBuilt,
        smartScore: Math.floor(Math.random() * 20) + 75,
        dataCompleteness: Object.values(row).filter(v => v && v !== '').length,
        listingStatus: status as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      console.log('Importing property:', property);

      if (property.address || property.price > 0) {
        addProperty(property);
        imported++;
      }
    });

    setStatus('complete');
    alert(`Successfully imported ${imported} properties`);
    setCsvFile(null);
    setCsvData([]);

    // Navigate to property list
    setTimeout(() => navigate('/properties'), 1000);
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Add Property
        </h1>
        <p className="text-gray-400">
          AI-powered extraction or manual entry
        </p>
      </div>

      {/* Input Mode Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'manual'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <PenLine className="w-4 h-4" />
          Manual
        </button>
        <button
          onClick={() => setInputMode('address')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'address'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Address
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'url'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => setInputMode('csv')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'csv'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </button>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 mb-6">
        {inputMode === 'csv' ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Upload className="w-16 h-16 mx-auto mb-4 text-quantum-cyan" />
              <h3 className="text-lg font-semibold mb-2">Upload Property CSV</h3>
              <p className="text-sm text-gray-400 mb-6">
                Import multiple properties at once. CSV should include: address, city, state, zip, price, bedrooms, bathrooms, sqft
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="btn-quantum inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                Choose CSV File
              </label>
            </div>

            {csvFile && (
              <div className="border border-quantum-cyan/20 rounded-xl p-4 bg-quantum-cyan/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">{csvFile.name}</p>
                    <p className="text-sm text-gray-400">{csvData.length} properties found</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-quantum-cyan" />
                </div>

                {csvData.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Preview (first 3 rows):</p>
                    <div className="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                      {csvData.slice(0, 3).map((row, i) => (
                        <div key={i} className="mb-2">
                          {row.address} - {row.city}, {row.state} - ${row.price}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCsvImport}
                  className="btn-quantum w-full"
                >
                  <CheckCircle className="w-5 h-5" />
                  Import {csvData.length} Properties
                </button>
              </div>
            )}
          </div>
        ) : inputMode === 'manual' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  placeholder="280 41st Ave"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="St Pete Beach"
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    State
                  </label>
                  <select
                    value={manualForm.state}
                    onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                    className="input-glass"
                  >
                    <option value="FL">FL</option>
                    <option value="GA">GA</option>
                    <option value="TX">TX</option>
                    <option value="CA">CA</option>
                    <option value="NY">NY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    ZIP
                  </label>
                  <input
                    type="text"
                    placeholder="33706"
                    value={manualForm.zip}
                    onChange={(e) => setManualForm({ ...manualForm, zip: e.target.value })}
                    className="input-glass"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  placeholder="549000"
                  value={manualForm.price}
                  onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Sq Ft
                </label>
                <input
                  type="number"
                  placeholder="1426"
                  value={manualForm.sqft}
                  onChange={(e) => setManualForm({ ...manualForm, sqft: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bedrooms
                </label>
                <select
                  value={manualForm.bedrooms}
                  onChange={(e) => setManualForm({ ...manualForm, bedrooms: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bathrooms
                </label>
                <select
                  value={manualForm.bathrooms}
                  onChange={(e) => setManualForm({ ...manualForm, bathrooms: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Year Built
                </label>
                <input
                  type="number"
                  placeholder="1958"
                  value={manualForm.yearBuilt}
                  onChange={(e) => setManualForm({ ...manualForm, yearBuilt: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={manualForm.listingStatus}
                  onChange={(e) => setManualForm({ ...manualForm, listingStatus: e.target.value })}
                  className="input-glass"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleManualSubmit}
              className="btn-quantum w-full mt-4"
            >
              <CheckCircle className="w-5 h-5" />
              Add Property
            </button>
          </div>
        ) : inputMode === 'address' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Property Address
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="280 41st Ave, St Pete Beach, FL 33706"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>

            {/* LLM Selection */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Auto', 'Claude', 'GPT', 'Hybrid'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => setSelectedEngine(engine)}
                    className={`p-3 rounded-xl border transition-colors ${
                      engine === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold">{engine}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Property Data
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Listing URL
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="url"
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Supports: Zillow, Redfin, Trulia, Realtor.com, Compass, homes.com
            </p>

            {/* LLM Selection */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Auto', 'Claude', 'GPT', 'Hybrid'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => setSelectedEngine(engine)}
                    className={`p-3 rounded-xl border transition-colors ${
                      engine === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold">{engine}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Property Data
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress Display - for scraping modes */}
      {status !== 'idle' && inputMode !== 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white">
              {getStatusMessage()}
            </span>
            {status === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-quantum-green" />
            ) : status === 'error' ? (
              <AlertCircle className="w-6 h-6 text-quantum-red" />
            ) : (
              <Loader2 className="w-6 h-6 text-quantum-cyan animate-spin" />
            )}
          </div>

          <div className="progress-quantum h-2 mb-4">
            <motion.div
              className="progress-quantum-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Field Categories Progress */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 20 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 20 ? 'text-white' : 'text-gray-500'}>
                Core Property Data (Fields 1-30)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 40 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 40 ? 'text-white' : 'text-gray-500'}>
                Structural Details (Fields 31-50)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 60 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 60 ? 'text-white' : 'text-gray-500'}>
                Location & Schools (Fields 51-75)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 80 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 80 ? 'text-white' : 'text-gray-500'}>
                Financial Data (Fields 76-90)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 100 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 100 ? 'text-white' : 'text-gray-500'}>
                Utilities & Environment (Fields 91-110)
              </span>
            </div>
          </div>

          {status === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-4 border-t border-white/10"
            >
              <div className="flex gap-4">
                <button
                  onClick={() => lastAddedId && navigate(`/property/${lastAddedId}`)}
                  className="btn-quantum flex-1"
                >
                  View Property
                </button>
                <button
                  onClick={resetForm}
                  className="btn-glass flex-1"
                >
                  Add Another
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Success message for manual entry */}
      {status === 'complete' && inputMode === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-quantum-green" />
            <span className="font-semibold text-white text-lg">
              Property Added Successfully!
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => lastAddedId && navigate(`/property/${lastAddedId}`)}
              className="btn-quantum flex-1"
            >
              View Property
            </button>
            <button
              onClick={resetForm}
              className="btn-glass flex-1"
            >
              Add Another
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
