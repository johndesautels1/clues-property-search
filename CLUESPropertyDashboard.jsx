import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Download, Grid3X3, Table, Search, TrendingUp, Home, MapPin, School, Shield, DollarSign, Calendar, Zap, Database, BarChart3, Brain } from 'lucide-react';

// CLUES™ Quantum Intelligence Property Dashboard
const CLUESPropertyDashboard = ({ properties = [] }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minBeds: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [animatedValues, setAnimatedValues] = useState({});

  // Sample property data structure
  const sampleProperties = [
    {
      id: 1,
      address: '280 41st Ave',
      city: 'St Pete Beach',
      state: 'FL',
      zip: '33706',
      mls: 'TB8443855',
      price: 750000,
      pricePerSqft: 434,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 1729,
      yearBuilt: 1973,
      lotSize: 0.15,
      smartScore: 94,
      walkScore: 72,
      schoolRating: 9,
      safetyGrade: 'A+',
      daysOnMarket: 12,
      taxValue: 494611,
      annualTax: 8422,
      hoaFee: 0,
      rentEstimate: 2800,
      capRate: 3.2,
      renovation: '2024 Complete',
      kitchen: 'Quartz/SS',
      flooring: 'Luxury Vinyl',
      hvac: 'Dual System',
      fence: 'Vinyl Privacy',
      beachDistance: '5 min walk',
      dataCompleteness: 77.1,
      aiConfidence: 94.8,
      features: {
        pool: false,
        garage: true,
        garageSpaces: 1,
        parkingType: 'Attached',
        laundry: 'Inside',
        airQuality: 'Good (17-22 AQI)',
        noiseLevel: 'Quiet',
        internetProviders: 8,
        floodZone: 'X',
        elementary: 'Azalea Elementary',
        elementaryRating: 9,
        middle: 'Azalea Middle',
        middleRating: 8,
        high: 'St. Petersburg High',
        highRating: 7
      }
    },
    {
      id: 2,
      address: '407 41st Ave',
      city: 'St Pete Beach',
      state: 'FL',
      zip: '33706',
      mls: 'TB8337679',
      price: 1799999,
      pricePerSqft: 521,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3456,
      yearBuilt: 2019,
      lotSize: 0.18,
      smartScore: 96,
      walkScore: 74,
      schoolRating: 9,
      safetyGrade: 'A+',
      daysOnMarket: 8,
      taxValue: 1200000,
      annualTax: 24000,
      hoaFee: 150,
      rentEstimate: 5500,
      capRate: 2.8,
      renovation: 'New Construction',
      kitchen: 'Gourmet/SubZero',
      flooring: 'Hardwood',
      hvac: 'Smart Climate',
      fence: 'None',
      beachDistance: '3 min walk',
      dataCompleteness: 85.3,
      aiConfidence: 96.2,
      features: {
        pool: true,
        garage: true,
        garageSpaces: 2,
        parkingType: 'Attached',
        laundry: 'Inside',
        airQuality: 'Good (15-20 AQI)',
        noiseLevel: 'Quiet',
        internetProviders: 8,
        floodZone: 'X',
        elementary: 'Azalea Elementary',
        elementaryRating: 9,
        middle: 'Azalea Middle',
        middleRating: 8,
        high: 'St. Petersburg High',
        highRating: 7
      }
    }
  ];

  // Initialize with sample data if no properties provided
  useEffect(() => {
    const data = properties.length > 0 ? properties : sampleProperties;
    setFilteredProperties(data);
    
    // Simulate loading animation
    setTimeout(() => {
      setLoading(false);
      animateValues();
    }, 2000);
  }, [properties]);

  // Animate number values on load
  const animateValues = () => {
    const values = {};
    filteredProperties.forEach(prop => {
      values[prop.id] = {
        price: 0,
        sqft: 0,
        smartScore: 0
      };
    });
    
    setAnimatedValues(values);
    
    // Animate to actual values
    const interval = setInterval(() => {
      setAnimatedValues(prev => {
        const newValues = { ...prev };
        let allComplete = true;
        
        filteredProperties.forEach(prop => {
          if (newValues[prop.id]) {
            // Price animation
            if (newValues[prop.id].price < prop.price) {
              newValues[prop.id].price = Math.min(
                newValues[prop.id].price + prop.price / 30,
                prop.price
              );
              allComplete = false;
            }
            
            // SqFt animation
            if (newValues[prop.id].sqft < prop.sqft) {
              newValues[prop.id].sqft = Math.min(
                newValues[prop.id].sqft + prop.sqft / 30,
                prop.sqft
              );
              allComplete = false;
            }
            
            // SMART Score animation
            if (newValues[prop.id].smartScore < prop.smartScore) {
              newValues[prop.id].smartScore = Math.min(
                newValues[prop.id].smartScore + prop.smartScore / 30,
                prop.smartScore
              );
              allComplete = false;
            }
          }
        });
        
        if (allComplete) {
          clearInterval(interval);
        }
        
        return newValues;
      });
    }, 30);
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = properties.length > 0 ? properties : sampleProperties;
    
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
    }
    if (filters.minBeds) {
      filtered = filtered.filter(p => p.bedrooms >= parseInt(filters.minBeds));
    }
    if (filters.location) {
      filtered = filtered.filter(p => 
        p.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        p.zip.includes(filters.location)
      );
    }
    
    setFilteredProperties(filtered);
  };

  // Calculate aggregate statistics
  const stats = {
    totalProperties: filteredProperties.length,
    avgCompleteness: filteredProperties.reduce((acc, p) => acc + (p.dataCompleteness || 75), 0) / filteredProperties.length || 0,
    priceRange: filteredProperties.length > 0 ? {
      min: Math.min(...filteredProperties.map(p => p.price)),
      max: Math.max(...filteredProperties.map(p => p.price))
    } : { min: 0, max: 0 },
    avgSmartScore: filteredProperties.reduce((acc, p) => acc + p.smartScore, 0) / filteredProperties.length || 0,
    avgAiConfidence: filteredProperties.reduce((acc, p) => acc + (p.aiConfidence || 95), 0) / filteredProperties.length || 0
  };

  // Export data function
  const exportData = () => {
    const csv = [
      Object.keys(filteredProperties[0]).join(','),
      ...filteredProperties.map(p => Object.values(p).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clues_property_data.csv';
    a.click();
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get score color class
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Loading Screen Component
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-cyan-400/30 rounded-full animate-spin" />
        <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin" />
        <div className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin-reverse" />
        <div className="absolute inset-4 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
      </div>
      <div className="mt-8 text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
        Quantum Analysis Loading...
      </div>
    </div>
  );

  // Property Card Component
  const PropertyCard = ({ property }) => {
    const animValue = animatedValues[property.id] || { price: 0, sqft: 0, smartScore: 0 };
    
    return (
      <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-400/20 group">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 p-6">
          <div className="text-black">
            <h3 className="text-xl font-bold">{property.address}</h3>
            <p className="text-sm opacity-80">
              {property.city}, {property.state} {property.zip} | MLS #{property.mls}
            </p>
          </div>
          
          {/* SMART Score Badge */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-black/90 rounded-full border-2 border-cyan-400 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-cyan-400">
              {Math.round(animValue.smartScore)}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">SMART™</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Core Metrics */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center">
              <ChevronRight className="w-3 h-3 mr-1 animate-pulse" />
              Core Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/50 p-3 rounded-lg border-l-2 border-cyan-400">
                <div className="text-xs text-gray-500">Price</div>
                <div className="text-lg font-bold font-mono text-white">
                  {formatCurrency(Math.round(animValue.price))}
                </div>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border-l-2 border-cyan-400">
                <div className="text-xs text-gray-500">$/SqFt</div>
                <div className="text-lg font-bold font-mono text-white">
                  ${property.pricePerSqft}
                </div>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border-l-2 border-cyan-400">
                <div className="text-xs text-gray-500">Beds/Bath</div>
                <div className="text-lg font-bold font-mono text-white">
                  {property.bedrooms} / {property.bathrooms}
                </div>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border-l-2 border-cyan-400">
                <div className="text-xs text-gray-500">SqFt</div>
                <div className="text-lg font-bold font-mono text-white">
                  {Math.round(animValue.sqft).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Location Intelligence */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center">
              <ChevronRight className="w-3 h-3 mr-1 animate-pulse" />
              Location Intelligence
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-black/50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Walk Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(property.walkScore)}`}>
                  {property.walkScore}
                </div>
                <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                    style={{ width: `${property.walkScore}%` }}
                  />
                </div>
              </div>
              <div className="text-center bg-black/50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">School</div>
                <div className={`text-2xl font-bold ${getScoreColor(property.schoolRating * 10)}`}>
                  {property.schoolRating}/10
                </div>
                <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                    style={{ width: `${property.schoolRating * 10}%` }}
                  />
                </div>
              </div>
              <div className="text-center bg-black/50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Safety</div>
                <div className="text-2xl font-bold text-green-400">
                  {property.safetyGrade}
                </div>
                <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                    style={{ width: '95%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-cyan-400 mb-3 flex items-center">
              <ChevronRight className="w-3 h-3 mr-1 animate-pulse" />
              Premium Features
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-cyan-500/5 rounded">
                <span className="text-gray-500 font-mono text-xs">Renovation</span>
                <span className="text-white font-semibold">{property.renovation}</span>
              </div>
              <div className="flex justify-between p-2 bg-cyan-500/5 rounded">
                <span className="text-gray-500 font-mono text-xs">Kitchen</span>
                <span className="text-white font-semibold">{property.kitchen}</span>
              </div>
              <div className="flex justify-between p-2 bg-cyan-500/5 rounded">
                <span className="text-gray-500 font-mono text-xs">Beach</span>
                <span className="text-white font-semibold">{property.beachDistance}</span>
              </div>
              <div className="flex justify-between p-2 bg-cyan-500/5 rounded">
                <span className="text-gray-500 font-mono text-xs">Rent Est.</span>
                <span className="text-white font-semibold">${property.rentEstimate}/mo</span>
              </div>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => setSelectedProperty(property)}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <Database className="w-4 h-4" />
            View Full Analysis
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  // Comparison Table Component
  const ComparisonTable = () => (
    <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500">
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Property</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Price</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">$/SqFt</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Beds</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Baths</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">SqFt</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Year</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">SMART™</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Walk</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">School</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">DOM</th>
              <th className="p-4 text-left text-black font-bold text-xs uppercase tracking-wider">Rent Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredProperties.map((property, index) => (
              <tr
                key={property.id}
                className="hover:bg-cyan-500/10 transition-colors cursor-pointer font-mono text-sm"
                onClick={() => setSelectedProperty(property)}
              >
                <td className="p-4 text-cyan-400 font-semibold">
                  {property.address}, {property.city}
                </td>
                <td className="p-4 text-white">{formatCurrency(property.price)}</td>
                <td className="p-4 text-white">${property.pricePerSqft}</td>
                <td className="p-4 text-white">{property.bedrooms}</td>
                <td className="p-4 text-white">{property.bathrooms}</td>
                <td className="p-4 text-white">{property.sqft.toLocaleString()}</td>
                <td className="p-4 text-white">{property.yearBuilt}</td>
                <td className="p-4">
                  <span className={`font-bold ${getScoreColor(property.smartScore)}`}>
                    {property.smartScore}
                  </span>
                </td>
                <td className="p-4 text-white">{property.walkScore}</td>
                <td className="p-4 text-white">{property.schoolRating}/10</td>
                <td className="p-4 text-white">{property.daysOnMarket}</td>
                <td className="p-4 text-white">${property.rentEstimate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-gradient" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'slide 10s linear infinite'
          }}
        />
      </div>

      {/* Loading Screen */}
      {loading && <LoadingScreen />}

      {/* Header */}
      <header className="relative z-40 bg-gray-900/90 backdrop-blur-lg border-b border-cyan-500/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <span className="text-black font-black text-2xl">C</span>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  CLUES™
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-[0.3em] font-light">
                  Quantum Intelligence Platform
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 flex items-center gap-2 transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold' 
                      : 'text-gray-400 hover:text-cyan-400'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Property Grid
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 flex items-center gap-2 transition-all ${
                    viewMode === 'comparison' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold' 
                      : 'text-gray-400 hover:text-cyan-400'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Comparison Matrix
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Properties</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {stats.totalProperties}
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Completeness</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {stats.avgCompleteness.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Value Range</div>
            <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              ${(stats.priceRange.min / 1000).toFixed(0)}K-${(stats.priceRange.max / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg SMART™</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {Math.round(stats.avgSmartScore)}
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Confidence</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {stats.avgAiConfidence.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <input
                type="number"
                placeholder="Max"
                className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>
          
          <div className="min-w-[100px]">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Min Beds</label>
            <input
              type="number"
              placeholder="Beds"
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
              value={filters.minBeds}
              onChange={(e) => setFilters({ ...filters, minBeds: e.target.value })}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Location</label>
            <input
              type="text"
              placeholder="City or Zip"
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          
          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Apply
          </button>
          
          <button
            onClick={exportData}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Content Area */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <ComparisonTable />
        )}
      </main>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 p-6 sticky top-0">
              <div className="flex justify-between items-start">
                <div className="text-black">
                  <h2 className="text-2xl font-bold">{selectedProperty.address}</h2>
                  <p>{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-black hover:bg-black/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Complete 110 Field Data Display */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(selectedProperty).map(([key, value]) => {
                  if (typeof value === 'object') return null;
                  return (
                    <div key={key} className="bg-black/50 p-3 rounded-lg border-l-2 border-cyan-400">
                      <div className="text-xs text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm font-mono text-white">
                        {typeof value === 'number' && key.includes('price') 
                          ? formatCurrency(value)
                          : value}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Features Section */}
              {selectedProperty.features && (
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-4">Additional Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(selectedProperty.features).map(([key, value]) => (
                      <div key={key} className="bg-black/50 p-3 rounded-lg border-l-2 border-purple-400">
                        <div className="text-xs text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm font-mono text-white">
                          {value === true ? 'Yes' : value === false ? 'No' : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-5%, 5%); }
          50% { transform: translate(5%, -5%); }
          75% { transform: translate(-5%, -5%); }
        }
        
        @keyframes slide {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default CLUESPropertyDashboard;