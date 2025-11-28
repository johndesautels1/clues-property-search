import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Radar, PolarArea, Doughnut, Bar, Line, Bubble } from 'react-chartjs-2';
import type { Property, PropertyComparisonProps, ViewType } from './types';
import './PropertyComparisonAnalytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PropertyComparisonAnalytics: React.FC<PropertyComparisonProps> = ({
  properties,
  onClose
}) => {
  const [view, setView] = useState<ViewType>('all');
  
  const [prop1, prop2, prop3] = properties;
  
  // Color schemes for each property
  const colors = {
    prop1: {
      primary: 'rgba(247, 231, 206, 0.6)',
      border: 'rgba(247, 231, 206, 1)',
      bg: 'rgba(247, 231, 206, 0.3)'
    },
    prop2: {
      primary: 'rgba(229, 228, 226, 0.6)',
      border: 'rgba(229, 228, 226, 1)',
      bg: 'rgba(229, 228, 226, 0.3)'
    },
    prop3: {
      primary: 'rgba(80, 200, 120, 0.6)',
      border: 'rgba(80, 200, 120, 1)',
      bg: 'rgba(80, 200, 120, 0.3)'
    }
  };
  
  const chartColors = {
    platinum: '#E5E4E2',
    champagne: '#F7E7CE',
    navy: '#1C2951',
    hunter: '#2C5F2D',
    burgundy: '#800020',
    amber: '#FFBF00',
    crimson: '#DC143C',
    emerald: '#50C878',
    sapphire: '#0F52BA',
    gold: '#FFD700'
  };
  
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.platinum,
          font: { size: 10 }
        }
      }
    }
  };
  
  // Helper function for formatting currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  // CHART 1: Radial Value Compass
  const radialCompassData = {
    labels: ['List Price', 'Market Est.', 'Redfin Est.', 'Assessed'],
    datasets: [
      {
        label: prop1.address,
        data: [prop1.listPrice, prop1.marketEstimate, prop1.redfinEstimate, prop1.assessedValue],
        backgroundColor: [colors.prop1.bg, colors.prop1.bg, colors.prop1.bg, colors.prop1.bg],
        borderColor: [colors.prop1.border, colors.prop1.border, colors.prop1.border, colors.prop1.border],
        borderWidth: 2
      }
    ]
  };

  // CHART 2: Appreciation Velocity
  const appreciationData1 = {
    datasets: [{
      data: [prop1.appreciation5yr, 100 - prop1.appreciation5yr],
      backgroundColor: ['rgba(44, 95, 45, 0.6)', 'rgba(255, 255, 255, 0.05)'],
      borderColor: ['rgba(44, 95, 45, 1)', 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };
  
  const appreciationData2 = {
    datasets: [{
      data: [prop2.appreciation5yr, 100 - prop2.appreciation5yr],
      backgroundColor: [colors.prop2.primary, 'rgba(255, 255, 255, 0.05)'],
      borderColor: [colors.prop2.border, 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };
  
  const appreciationData3 = {
    datasets: [{
      data: [prop3.appreciation5yr, 100 - prop3.appreciation5yr],
      backgroundColor: [colors.prop3.primary, 'rgba(255, 255, 255, 0.05)'],
      borderColor: [colors.prop3.border, 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };

  // CHARTS 3A-C: Investment Trinity Dials
  const createDialData = (value: number, color: string) => ({
    datasets: [{
      data: [value, 10 - value],
      backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
      borderColor: [color, 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2
    }]
  });

  // CHART 4: Mobility Trifecta
  const mobilityData = {
    labels: ['Walk Score', 'Transit Score', 'Bike Score'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [prop1.walkScore, prop1.transitScore, prop1.bikeScore],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop1.border,
        pointBorderColor: '#fff',
        pointRadius: 6
      },
      {
        label: prop2.address.split(',')[0],
        data: [prop2.walkScore, prop2.transitScore, prop2.bikeScore],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop2.border,
        pointBorderColor: '#fff',
        pointRadius: 6
      },
      {
        label: prop3.address.split(',')[0],
        data: [prop3.walkScore, prop3.transitScore, prop3.bikeScore],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop3.border,
        pointBorderColor: '#fff',
        pointRadius: 6
      }
    ]
  };
  
  const radarOptions = {
    ...commonOptions,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: chartColors.platinum,
          backdropColor: 'transparent'
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: {
          color: chartColors.champagne,
          font: { size: 11, weight: 500 }
        }
      }
    }
  };

  // CHART 5: Climate Risk Spider
  const climateRiskData = {
    labels: ['Flood', 'Hurricane', 'Sea Level', 'Wildfire', 'Earthquake', 'Tornado', 'Air Quality', 'Radon'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.floodRisk,
          prop1.hurricaneRisk,
          prop1.seaLevelRisk,
          prop1.wildfireRisk,
          prop1.earthquakeRisk,
          prop1.tornadoRisk,
          prop1.airQualityRisk,
          prop1.radonRisk
        ],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop1.border,
        pointRadius: 5
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.floodRisk,
          prop2.hurricaneRisk,
          prop2.seaLevelRisk,
          prop2.wildfireRisk,
          prop2.earthquakeRisk,
          prop2.tornadoRisk,
          prop2.airQualityRisk,
          prop2.radonRisk
        ],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop2.border,
        pointRadius: 5
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.floodRisk,
          prop3.hurricaneRisk,
          prop3.seaLevelRisk,
          prop3.wildfireRisk,
          prop3.earthquakeRisk,
          prop3.tornadoRisk,
          prop3.airQualityRisk,
          prop3.radonRisk
        ],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop3.border,
        pointRadius: 5
      }
    ]
  };
  
  const riskRadarOptions = {
    ...commonOptions,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          color: chartColors.platinum,
          backdropColor: 'transparent'
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: chartColors.platinum, font: { size: 9 } }
      }
    }
  };

  // CHART 6: Safety Barometer
  const safetyData = {
    labels: [prop1.address.split(',')[0], prop2.address.split(',')[0], prop3.address.split(',')[0]],
    datasets: [{
      label: 'Safety Score',
      data: [prop1.safetyScore, prop2.safetyScore, prop3.safetyScore],
      backgroundColor: [colors.prop1.primary, colors.prop2.primary, colors.prop3.primary],
      borderColor: [colors.prop1.border, colors.prop2.border, colors.prop3.border],
      borderWidth: 2,
      borderRadius: 10
    }]
  };
  
  const barOptions = {
    ...commonOptions,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: chartColors.platinum },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: chartColors.champagne },
        grid: { display: false }
      }
    }
  };

  // CHART 7: Investment Score Constellation (Crown Jewel)
  const investmentConstellationData = {
    labels: ['Financial Health', 'Location Value', 'Property Condition', 'Risk Profile', 'Market Position', 'Growth Potential'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.investmentScore.financialHealth,
          prop1.investmentScore.locationValue,
          prop1.investmentScore.propertyCondition,
          prop1.investmentScore.riskProfile,
          prop1.investmentScore.marketPosition,
          prop1.investmentScore.growthPotential
        ],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 3,
        pointBackgroundColor: colors.prop1.border,
        pointBorderColor: '#fff',
        pointRadius: 8,
        pointBorderWidth: 2
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.investmentScore.financialHealth,
          prop2.investmentScore.locationValue,
          prop2.investmentScore.propertyCondition,
          prop2.investmentScore.riskProfile,
          prop2.investmentScore.marketPosition,
          prop2.investmentScore.growthPotential
        ],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 3,
        pointBackgroundColor: colors.prop2.border,
        pointBorderColor: '#fff',
        pointRadius: 8,
        pointBorderWidth: 2
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.investmentScore.financialHealth,
          prop3.investmentScore.locationValue,
          prop3.investmentScore.propertyCondition,
          prop3.investmentScore.riskProfile,
          prop3.investmentScore.marketPosition,
          prop3.investmentScore.growthPotential
        ],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 3,
        pointBackgroundColor: colors.prop3.border,
        pointBorderColor: '#fff',
        pointRadius: 8,
        pointBorderWidth: 2
      }
    ]
  };

  // CHART 8: Competitive Landscape Bubble
  const bubbleData = {
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [{ x: prop1.pricePerSqft, y: prop1.price, r: Math.sqrt(prop1.lotSize) / 15 }],
        backgroundColor: colors.prop1.primary,
        borderColor: colors.prop1.border,
        borderWidth: 3
      },
      {
        label: prop2.address.split(',')[0],
        data: [{ x: prop2.pricePerSqft, y: prop2.price, r: Math.sqrt(prop2.lotSize) / 15 }],
        backgroundColor: colors.prop2.primary,
        borderColor: colors.prop2.border,
        borderWidth: 3
      },
      {
        label: prop3.address.split(',')[0],
        data: [{ x: prop3.pricePerSqft, y: prop3.price, r: Math.sqrt(prop3.lotSize) / 15 }],
        backgroundColor: colors.prop3.primary,
        borderColor: colors.prop3.border,
        borderWidth: 3
      }
    ]
  };
  
  const bubbleOptions = {
    ...commonOptions,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Price Per Sq Ft ($)',
          color: chartColors.champagne,
          font: { size: 12, weight: 600 }
        },
        ticks: { color: chartColors.platinum },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        title: {
          display: true,
          text: 'Total Price ($)',
          color: chartColors.champagne,
          font: { size: 12, weight: 600 }
        },
        ticks: {
          color: chartColors.platinum,
          callback: (value: any) => formatCurrency(value)
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  // CHART 9: Environmental Quality
  const envQualityData = {
    labels: ['Air Quality', 'Solar Potential', 'Water Quality', 'Foundation Stability'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [prop1.airQuality, prop1.solarPotential, prop1.waterQuality, prop1.foundationStability],
        backgroundColor: colors.prop1.primary,
        borderColor: colors.prop1.border,
        borderWidth: 2
      },
      {
        label: prop2.address.split(',')[0],
        data: [prop2.airQuality, prop2.solarPotential, prop2.waterQuality, prop2.foundationStability],
        backgroundColor: colors.prop2.primary,
        borderColor: colors.prop2.border,
        borderWidth: 2
      },
      {
        label: prop3.address.split(',')[0],
        data: [prop3.airQuality, prop3.solarPotential, prop3.waterQuality, prop3.foundationStability],
        backgroundColor: colors.prop3.primary,
        borderColor: colors.prop3.border,
        borderWidth: 2
      }
    ]
  };
  
  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    ...commonOptions,
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { color: chartColors.platinum },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: chartColors.champagne, font: { size: 11 } },
        grid: { display: false }
      }
    }
  };

  // CHART 10: Spatial Efficiency
  const spatialEfficiencyData1 = {
    labels: ['Living Space', 'Garage/Storage', 'Covered Areas'],
    datasets: [{
      data: [prop1.livingSpace, prop1.garageStorage, prop1.coveredAreas],
      backgroundColor: [
        'rgba(247, 231, 206, 0.6)',
        'rgba(28, 41, 81, 0.6)',
        'rgba(44, 95, 45, 0.3)'
      ],
      borderColor: [
        'rgba(247, 231, 206, 1)',
        'rgba(28, 41, 81, 1)',
        'rgba(44, 95, 45, 1)'
      ],
      borderWidth: 2
    }]
  };

  // CHART 11: Room Distribution
  const roomDistributionData1 = {
    labels: ['Bedrooms', 'Bathrooms', 'Living Areas', 'Storage'],
    datasets: [{
      data: [
        prop1.roomDistribution.bedrooms,
        prop1.roomDistribution.bathrooms,
        prop1.roomDistribution.livingAreas,
        prop1.roomDistribution.storage
      ],
      backgroundColor: [
        'rgba(15, 82, 186, 0.6)',
        'rgba(229, 228, 226, 0.6)',
        'rgba(247, 231, 206, 0.6)',
        'rgba(28, 41, 81, 0.6)'
      ],
      borderColor: [
        'rgba(15, 82, 186, 1)',
        'rgba(229, 228, 226, 1)',
        'rgba(247, 231, 206, 1)',
        'rgba(28, 41, 81, 1)'
      ],
      borderWidth: 2
    }]
  };

  // CHART 12: Schools Accessibility
  const schoolsData = {
    labels: ['Elementary', 'Middle', 'High', 'District Rating'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.schools.elementaryDistance,
          prop1.schools.middleDistance,
          prop1.schools.highDistance,
          prop1.schools.districtRating
        ],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop1.border,
        pointRadius: 6
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.schools.elementaryDistance,
          prop2.schools.middleDistance,
          prop2.schools.highDistance,
          prop2.schools.districtRating
        ],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop2.border,
        pointRadius: 6
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.schools.elementaryDistance,
          prop3.schools.middleDistance,
          prop3.schools.highDistance,
          prop3.schools.districtRating
        ],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop3.border,
        pointRadius: 6
      }
    ]
  };

  // CHART 13: Neighborhood Market Pulse
  const neighborhoodPulseData = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.neighborhoodPulse.year2020,
          prop1.neighborhoodPulse.year2021,
          prop1.neighborhoodPulse.year2022,
          prop1.neighborhoodPulse.year2023,
          prop1.neighborhoodPulse.year2024,
          prop1.neighborhoodPulse.year2025
        ],
        borderColor: colors.prop1.border,
        backgroundColor: colors.prop1.bg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.prop1.border
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.neighborhoodPulse.year2020,
          prop2.neighborhoodPulse.year2021,
          prop2.neighborhoodPulse.year2022,
          prop2.neighborhoodPulse.year2023,
          prop2.neighborhoodPulse.year2024,
          prop2.neighborhoodPulse.year2025
        ],
        borderColor: colors.prop2.border,
        backgroundColor: colors.prop2.bg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.prop2.border
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.neighborhoodPulse.year2020,
          prop3.neighborhoodPulse.year2021,
          prop3.neighborhoodPulse.year2022,
          prop3.neighborhoodPulse.year2023,
          prop3.neighborhoodPulse.year2024,
          prop3.neighborhoodPulse.year2025
        ],
        borderColor: colors.prop3.border,
        backgroundColor: colors.prop3.bg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.prop3.border
      }
    ]
  };
  
  const lineOptions = {
    ...commonOptions,
    scales: {
      y: {
        ticks: {
          color: chartColors.platinum,
          callback: (value: any) => formatCurrency(value)
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: chartColors.platinum },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  // CHART 14: Commute Time Spiral
  const commuteData = {
    labels: ['City Center', 'Elementary', 'Transit Hub', 'Emergency'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.commute.cityCenter,
          prop1.commute.elementary,
          prop1.commute.transitHub,
          prop1.commute.emergency
        ],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop1.border,
        pointRadius: 6
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.commute.cityCenter,
          prop2.commute.elementary,
          prop2.commute.transitHub,
          prop2.commute.emergency
        ],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop2.border,
        pointRadius: 6
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.commute.cityCenter,
          prop3.commute.elementary,
          prop3.commute.transitHub,
          prop3.commute.emergency
        ],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop3.border,
        pointRadius: 6
      }
    ]
  };

  // CHART 15: Insurance Breakdown
  const insuranceData = {
    labels: ['Base', 'Flood', 'Wind'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [prop1.insuranceBase, prop1.insuranceFlood, prop1.insuranceWind],
        backgroundColor: colors.prop1.primary,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        borderRadius: 10
      },
      {
        label: prop2.address.split(',')[0],
        data: [prop2.insuranceBase, prop2.insuranceFlood, prop2.insuranceWind],
        backgroundColor: colors.prop2.primary,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        borderRadius: 10
      },
      {
        label: prop3.address.split(',')[0],
        data: [prop3.insuranceBase, prop3.insuranceFlood, prop3.insuranceWind],
        backgroundColor: colors.prop3.primary,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        borderRadius: 10
      }
    ]
  };

  // CHART 16: Utility Cost Meter
  const utilityData1 = {
    labels: [`Electric $${prop1.utilitiesElectric}`, `Water $${prop1.utilitiesWater}`, `Internet $${prop1.utilitiesInternet}`],
    datasets: [{
      data: [prop1.utilitiesElectric, prop1.utilitiesWater, prop1.utilitiesInternet],
      backgroundColor: [
        'rgba(255, 191, 0, 0.6)',
        'rgba(28, 41, 81, 0.6)',
        'rgba(15, 82, 186, 0.6)'
      ],
      borderColor: [
        'rgba(255, 191, 0, 1)',
        'rgba(28, 41, 81, 1)',
        'rgba(15, 82, 186, 1)'
      ],
      borderWidth: 2
    }]
  };

  // CHART 17: Market Velocity
  const marketVelocityData1 = {
    datasets: [{
      data: [prop1.marketVelocityDays, 100 - prop1.marketVelocityDays],
      backgroundColor: ['rgba(44, 95, 45, 0.6)', 'rgba(255, 255, 255, 0.05)'],
      borderColor: ['rgba(44, 95, 45, 1)', 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };
  
  const marketVelocityData2 = {
    datasets: [{
      data: [prop2.marketVelocityDays, 100 - prop2.marketVelocityDays],
      backgroundColor: [colors.prop2.primary, 'rgba(255, 255, 255, 0.05)'],
      borderColor: [colors.prop2.border, 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };
  
  const marketVelocityData3 = {
    datasets: [{
      data: [prop3.marketVelocityDays, 100 - prop3.marketVelocityDays],
      backgroundColor: [colors.prop3.primary, 'rgba(255, 255, 255, 0.05)'],
      borderColor: [colors.prop3.border, 'rgba(255, 255, 255, 0.1)'],
      borderWidth: 2,
      circumference: 180,
      rotation: 270
    }]
  };

  // CHART 18: Price History
  const priceHistoryData = {
    labels: ['2018 Sale', '2024 Assessment', '2025 List', 'Market Est.'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.pricingHistory.salePrice,
          prop1.pricingHistory.assessmentPrice,
          prop1.pricingHistory.currentListPrice,
          prop1.pricingHistory.marketEstimatePrice
        ],
        borderColor: colors.prop1.border,
        backgroundColor: colors.prop1.bg,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: colors.prop1.border
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.pricingHistory.salePrice,
          prop2.pricingHistory.assessmentPrice,
          prop2.pricingHistory.currentListPrice,
          prop2.pricingHistory.marketEstimatePrice
        ],
        borderColor: colors.prop2.border,
        backgroundColor: colors.prop2.bg,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: colors.prop2.border
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.pricingHistory.salePrice,
          prop3.pricingHistory.assessmentPrice,
          prop3.pricingHistory.currentListPrice,
          prop3.pricingHistory.marketEstimatePrice
        ],
        borderColor: colors.prop3.border,
        backgroundColor: colors.prop3.bg,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: colors.prop3.border
      }
    ]
  };

  // CHART 19: ROI Projection Mountain
  const roiProjectionData = {
    labels: ['Today', '1 Yr', '2 Yr', '3 Yr', '4 Yr', '5 Yr', '7 Yr', '10 Yr'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.roiProjection.today,
          prop1.roiProjection.year1,
          prop1.roiProjection.year2,
          prop1.roiProjection.year3,
          prop1.roiProjection.year4,
          prop1.roiProjection.year5,
          prop1.roiProjection.year7,
          prop1.roiProjection.year10
        ],
        borderColor: colors.prop1.border,
        backgroundColor: colors.prop1.bg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.prop1.border
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.roiProjection.today,
          prop2.roiProjection.year1,
          prop2.roiProjection.year2,
          prop2.roiProjection.year3,
          prop2.roiProjection.year4,
          prop2.roiProjection.year5,
          prop2.roiProjection.year7,
          prop2.roiProjection.year10
        ],
        borderColor: colors.prop2.border,
        backgroundColor: colors.prop2.bg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.prop2.border
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.roiProjection.today,
          prop3.roiProjection.year1,
          prop3.roiProjection.year2,
          prop3.roiProjection.year3,
          prop3.roiProjection.year4,
          prop3.roiProjection.year5,
          prop3.roiProjection.year7,
          prop3.roiProjection.year10
        ],
        borderColor: colors.prop3.border,
        backgroundColor: colors.prop3.bg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.prop3.border
      }
    ]
  };

  // CHART 20: Property Age & Condition
  const conditionData = {
    labels: ['Roof', 'HVAC', 'Kitchen', 'Overall'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [prop1.condition.roof, prop1.condition.hvac, prop1.condition.kitchen, prop1.condition.overall],
        backgroundColor: colors.prop1.primary,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        borderRadius: 10
      },
      {
        label: prop2.address.split(',')[0],
        data: [prop2.condition.roof, prop2.condition.hvac, prop2.condition.kitchen, prop2.condition.overall],
        backgroundColor: colors.prop2.primary,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        borderRadius: 10
      },
      {
        label: prop3.address.split(',')[0],
        data: [prop3.condition.roof, prop3.condition.hvac, prop3.condition.kitchen, prop3.condition.overall],
        backgroundColor: colors.prop3.primary,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        borderRadius: 10
      }
    ]
  };

  // CHART 21: Luxury Features
  const luxuryFeaturesData = {
    labels: ['Pool', 'Deck', 'Smart Home', 'Fireplace', 'EV Charging', 'Beach Access'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.features.pool,
          prop1.features.deck,
          prop1.features.smartHome,
          prop1.features.fireplace,
          prop1.features.evCharging,
          prop1.features.beachAccess
        ],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop1.border,
        pointRadius: 6
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.features.pool,
          prop2.features.deck,
          prop2.features.smartHome,
          prop2.features.fireplace,
          prop2.features.evCharging,
          prop2.features.beachAccess
        ],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop2.border,
        pointRadius: 6
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.features.pool,
          prop3.features.deck,
          prop3.features.smartHome,
          prop3.features.fireplace,
          prop3.features.evCharging,
          prop3.features.beachAccess
        ],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 2,
        pointBackgroundColor: colors.prop3.border,
        pointRadius: 6
      }
    ]
  };

  // CHART 22: Location Excellence Score
  const locationExcellenceData = {
    labels: ['Beach Access', 'School Proximity', 'Transit Access', 'Safety', 'Walkability', 'Commute'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.locationExcellence.beachAccess,
          prop1.locationExcellence.schoolProximity,
          prop1.locationExcellence.transitAccess,
          prop1.locationExcellence.safety,
          prop1.locationExcellence.walkability,
          prop1.locationExcellence.commute
        ],
        backgroundColor: colors.prop1.bg,
        borderColor: colors.prop1.border,
        borderWidth: 3,
        pointBackgroundColor: colors.prop1.border,
        pointBorderColor: '#fff',
        pointRadius: 8,
        pointBorderWidth: 2
      },
      {
        label: prop2.address.split(',')[0],
        data: [
          prop2.locationExcellence.beachAccess,
          prop2.locationExcellence.schoolProximity,
          prop2.locationExcellence.transitAccess,
          prop2.locationExcellence.safety,
          prop2.locationExcellence.walkability,
          prop2.locationExcellence.commute
        ],
        backgroundColor: colors.prop2.bg,
        borderColor: colors.prop2.border,
        borderWidth: 3,
        pointBackgroundColor: colors.prop2.border,
        pointBorderColor: '#fff',
        pointRadius: 8,
        pointBorderWidth: 2
      },
      {
        label: prop3.address.split(',')[0],
        data: [
          prop3.locationExcellence.beachAccess,
          prop3.locationExcellence.schoolProximity,
          prop3.locationExcellence.transitAccess,
          prop3.locationExcellence.safety,
          prop3.locationExcellence.walkability,
          prop3.locationExcellence.commute
        ],
        backgroundColor: colors.prop3.bg,
        borderColor: colors.prop3.border,
        borderWidth: 3,
        pointBackgroundColor: colors.prop3.border,
        pointBorderColor: '#fff',
        pointRadius: 8,
        pointBorderWidth: 2
      }
    ]
  };

  // CHART 23-30: Mission Control variants (gold-themed variations)
  // Chart 23 uses same data as Chart 7 (Investment Constellation)
  // Chart 24 uses same data as Chart 1 (Radial Compass)
  // Chart 25 uses same data as Chart 19 (ROI Projection)
  // Chart 26: Risk Assessment (simplified climate risks)
  const riskAssessmentData = {
    labels: ['Flood', 'Hurricane', 'Sea Level Rise', 'Wildfire'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [prop1.floodRisk, prop1.hurricaneRisk, prop1.seaLevelRisk, prop1.wildfireRisk],
        backgroundColor: 'rgba(220, 20, 60, 0.3)',
        borderColor: 'rgba(220, 20, 60, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(220, 20, 60, 1)',
        pointRadius: 6
      },
      {
        label: prop2.address.split(',')[0],
        data: [prop2.floodRisk, prop2.hurricaneRisk, prop2.seaLevelRisk, prop2.wildfireRisk],
        backgroundColor: 'rgba(255, 140, 0, 0.3)',
        borderColor: 'rgba(255, 140, 0, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 140, 0, 1)',
        pointRadius: 6
      },
      {
        label: prop3.address.split(',')[0],
        data: [prop3.floodRisk, prop3.hurricaneRisk, prop3.seaLevelRisk, prop3.wildfireRisk],
        backgroundColor: 'rgba(255, 69, 0, 0.3)',
        borderColor: 'rgba(255, 69, 0, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 69, 0, 1)',
        pointRadius: 6
      }
    ]
  };

  // Chart 27: Market Position (same as bubble chart 8)
  // Chart 28: Location Intelligence (same as location excellence 22)

  // CHART 29: Monthly Cash Flow Analysis
  const cashFlowData = {
    labels: ['Rent', 'Tax', 'Insurance', 'HOA', 'Utilities', 'Maintenance', 'Net'],
    datasets: [
      {
        label: prop1.address.split(',')[0],
        data: [
          prop1.rentalIncome,
          -prop1.propertyTax / 12,
          -prop1.insurance / 12,
          -prop1.hoaFees,
          -prop1.utilities,
          -prop1.maintenance,
          prop1.rentalIncome - (prop1.propertyTax / 12) - (prop1.insurance / 12) - prop1.hoaFees - prop1.utilities - prop1.maintenance
        ],
        backgroundColor: (context: any) => {
          const value = context.parsed?.y;
          return value >= 0 ? 'rgba(44, 95, 45, 0.6)' : 'rgba(220, 20, 60, 0.6)';
        },
        borderColor: (context: any) => {
          const value = context.parsed?.y;
          return value >= 0 ? 'rgba(44, 95, 45, 1)' : 'rgba(220, 20, 60, 1)';
        },
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };
  
  const cashFlowOptions = {
    ...commonOptions,
    scales: {
      y: {
        ticks: {
          color: chartColors.platinum,
          callback: (value: any) => formatCurrency(Math.abs(value))
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: chartColors.champagne, font: { size: 10 } },
        grid: { display: false }
      }
    }
  };

  // CHART 30: Luxury Amenities Profile (gold-themed version of features)
  // Uses same data as Chart 21
  
  return (
    <div className="comparison-analytics">
      {/* Header with close button */}
      <div className="analytics-header">
        <h1>Property Comparison Analytics</h1>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      {/* Property Summary Cards */}
      <div className="property-cards">
        <div className="property-card prop-1">
          <div className="property-address">{prop1.address}</div>
          <div className="property-price">{formatCurrency(prop1.price)}</div>
          <div className="property-details">{prop1.bedrooms}bd | {prop1.bathrooms}ba | {prop1.sqft.toLocaleString()} sqft</div>
        </div>
        <div className="property-card prop-2">
          <div className="property-address">{prop2.address}</div>
          <div className="property-price">{formatCurrency(prop2.price)}</div>
          <div className="property-details">{prop2.bedrooms}bd | {prop2.bathrooms}ba | {prop2.sqft.toLocaleString()} sqft</div>
        </div>
        <div className="property-card prop-3">
          <div className="property-address">{prop3.address}</div>
          <div className="property-price">{formatCurrency(prop3.price)}</div>
          <div className="property-details">{prop3.bedrooms}bd | {prop3.bathrooms}ba | {prop3.sqft.toLocaleString()} sqft</div>
        </div>
      </div>
      
      {/* View Selector */}
      <div className="view-selector">
        <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>All Charts</button>
        <button className={view === 'financial' ? 'active' : ''} onClick={() => setView('financial')}>Financial</button>
        <button className={view === 'location' ? 'active' : ''} onClick={() => setView('location')}>Location</button>
        <button className={view === 'risk' ? 'active' : ''} onClick={() => setView('risk')}>Risk</button>
        <button className={view === 'amenities' ? 'active' : ''} onClick={() => setView('amenities')}>Amenities</button>
      </div>
      
      {/* Charts Grid */}
      <div className="charts-grid">
        
        {/* Financial Charts */}
        {(view === 'all' || view === 'financial') && (
          <>
            <div className="chart-card">
              <h3 className="chart-title">1. RADIAL VALUE COMPASS</h3>
              <div className="chart-container">
                <PolarArea data={radialCompassData} options={commonOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">2. APPRECIATION VELOCITY</h3>
              <div className="chart-container chart-row">
                <div className="mini-chart">
                  <Doughnut data={appreciationData1} options={{ ...commonOptions, plugins: { legend: { display: false } } }} />
                  <div className="chart-label">{prop1.address.split(',')[0]}</div>
                  <div className="chart-value">{prop1.appreciation5yr}%</div>
                </div>
                <div className="mini-chart">
                  <Doughnut data={appreciationData2} options={{ ...commonOptions, plugins: { legend: { display: false } } }} />
                  <div className="chart-label">{prop2.address.split(',')[0]}</div>
                  <div className="chart-value">{prop2.appreciation5yr}%</div>
                </div>
                <div className="mini-chart">
                  <Doughnut data={appreciationData3} options={{ ...commonOptions, plugins: { legend: { display: false } } }} />
                  <div className="chart-label">{prop3.address.split(',')[0]}</div>
                  <div className="chart-value">{prop3.appreciation5yr}%</div>
                </div>
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">3. INVESTMENT TRINITY</h3>
              <div className="chart-container chart-row">
                <div className="mini-chart">
                  <Doughnut data={createDialData(prop1.capRate, colors.prop1.primary)} options={{ ...commonOptions, cutout: '70%', plugins: { legend: { display: false } } }} />
                  <div className="chart-label">Cap Rate</div>
                  <div className="chart-value">{prop1.capRate}%</div>
                </div>
                <div className="mini-chart">
                  <Doughnut data={createDialData(prop1.rentalYield, 'rgba(28, 41, 81, 0.6)')} options={{ ...commonOptions, cutout: '70%', plugins: { legend: { display: false } } }} />
                  <div className="chart-label">Rental Yield</div>
                  <div className="chart-value">{prop1.rentalYield}%</div>
                </div>
                <div className="mini-chart">
                  <Doughnut data={createDialData(prop1.priceToRent, 'rgba(128, 0, 32, 0.6)')} options={{ ...commonOptions, cutout: '70%', plugins: { legend: { display: false } } }} />
                  <div className="chart-label">Price/Rent</div>
                  <div className="chart-value">{prop1.priceToRent}</div>
                </div>
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">7. INVESTMENT SCORE CONSTELLATION ⭐</h3>
              <div className="chart-container">
                <Radar data={investmentConstellationData} options={radarOptions} />
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">8. COMPETITIVE LANDSCAPE</h3>
              <div className="chart-container">
                <Bubble data={bubbleData} options={bubbleOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">15. INSURANCE BREAKDOWN</h3>
              <div className="chart-container">
                <Bar data={insuranceData} options={barOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">16. UTILITY COSTS</h3>
              <div className="chart-container">
                <Doughnut data={utilityData1} options={commonOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Location Charts */}
        {(view === 'all' || view === 'location') && (
          <>
            <div className="chart-card">
              <h3 className="chart-title">4. MOBILITY TRIFECTA</h3>
              <div className="chart-container">
                <Radar data={mobilityData} options={radarOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">12. SCHOOLS ACCESSIBILITY</h3>
              <div className="chart-container">
                <Radar data={schoolsData} options={radarOptions} />
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">13. NEIGHBORHOOD MARKET PULSE</h3>
              <div className="chart-container">
                <Line data={neighborhoodPulseData} options={lineOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">14. COMMUTE TIME SPIRAL</h3>
              <div className="chart-container">
                <Radar data={commuteData} options={radarOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Risk Charts */}
        {(view === 'all' || view === 'risk') && (
          <>
            <div className="chart-card">
              <h3 className="chart-title">5. CLIMATE RISK SPIDER</h3>
              <div className="chart-container">
                <Radar data={climateRiskData} options={riskRadarOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">6. SAFETY BAROMETER</h3>
              <div className="chart-container">
                <Bar data={safetyData} options={barOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">9. ENVIRONMENTAL QUALITY</h3>
              <div className="chart-container">
                <Bar data={envQualityData} options={horizontalBarOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Property Details Charts */}
        {(view === 'all' || view === 'amenities') && (
          <>
            <div className="chart-card">
              <h3 className="chart-title">10. SPATIAL EFFICIENCY</h3>
              <div className="chart-container">
                <Doughnut data={spatialEfficiencyData1} options={commonOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">11. ROOM DISTRIBUTION</h3>
              <div className="chart-container">
                <Doughnut data={roomDistributionData1} options={{ ...commonOptions, cutout: '60%' }} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">20. PROPERTY CONDITION</h3>
              <div className="chart-container">
                <Bar data={conditionData} options={barOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">21. LUXURY FEATURES</h3>
              <div className="chart-container">
                <Radar data={luxuryFeaturesData} options={radarOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">30. LUXURY AMENITIES PROFILE</h3>
              <div className="chart-container">
                <Radar data={luxuryFeaturesData} options={radarOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Advanced Financial Charts */}
        {(view === 'all' || view === 'financial') && (
          <>
            <div className="chart-card">
              <h3 className="chart-title">17. MARKET VELOCITY</h3>
              <div className="chart-container chart-row">
                <div className="mini-chart">
                  <Doughnut data={marketVelocityData1} options={{ ...commonOptions, plugins: { legend: { display: false } } }} />
                  <div className="chart-label">{prop1.address.split(',')[0]}</div>
                  <div className="chart-value">{prop1.marketVelocityDays} days</div>
                </div>
                <div className="mini-chart">
                  <Doughnut data={marketVelocityData2} options={{ ...commonOptions, plugins: { legend: { display: false } } }} />
                  <div className="chart-label">{prop2.address.split(',')[0]}</div>
                  <div className="chart-value">{prop2.marketVelocityDays} days</div>
                </div>
                <div className="mini-chart">
                  <Doughnut data={marketVelocityData3} options={{ ...commonOptions, plugins: { legend: { display: false } } }} />
                  <div className="chart-label">{prop3.address.split(',')[0]}</div>
                  <div className="chart-value">{prop3.marketVelocityDays} days</div>
                </div>
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">18. PRICE HISTORY</h3>
              <div className="chart-container">
                <Line data={priceHistoryData} options={lineOptions} />
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">19. ROI PROJECTION MOUNTAIN</h3>
              <div className="chart-container">
                <Line data={roiProjectionData} options={lineOptions} />
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">25. 10-YEAR ROI TRAJECTORY</h3>
              <div className="chart-container">
                <Line data={roiProjectionData} options={lineOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">29. MONTHLY CASH FLOW ANALYSIS</h3>
              <div className="chart-container">
                <Bar data={cashFlowData} options={cashFlowOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Location Excellence Charts */}
        {(view === 'all' || view === 'location') && (
          <>
            <div className="chart-card featured">
              <h3 className="chart-title">22. LOCATION EXCELLENCE SCORE</h3>
              <div className="chart-container">
                <Radar data={locationExcellenceData} options={radarOptions} />
              </div>
            </div>
            
            <div className="chart-card featured">
              <h3 className="chart-title">28. LOCATION INTELLIGENCE</h3>
              <div className="chart-container">
                <Radar data={locationExcellenceData} options={radarOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Mission Control Variants */}
        {(view === 'all' || view === 'financial') && (
          <>
            <div className="chart-card featured mission-control">
              <h3 className="chart-title">23. MASTER INVESTMENT SCORE</h3>
              <div className="chart-container">
                <Radar data={investmentConstellationData} options={radarOptions} />
              </div>
            </div>
            
            <div className="chart-card mission-control">
              <h3 className="chart-title">24. VALUE POSITIONING COMPASS</h3>
              <div className="chart-container">
                <PolarArea data={radialCompassData} options={commonOptions} />
              </div>
            </div>
            
            <div className="chart-card mission-control">
              <h3 className="chart-title">27. MARKET POSITION BUBBLE</h3>
              <div className="chart-container">
                <Bubble data={bubbleData} options={bubbleOptions} />
              </div>
            </div>
          </>
        )}
        
        {/* Risk Assessment Charts */}
        {(view === 'all' || view === 'risk') && (
          <>
            <div className="chart-card mission-control">
              <h3 className="chart-title">26. RISK ASSESSMENT RADAR</h3>
              <div className="chart-container">
                <Radar data={riskAssessmentData} options={riskRadarOptions} />
              </div>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default PropertyComparisonAnalytics;
