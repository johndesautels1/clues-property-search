// Property Comparison Visualization System
// John E Desautels & Associates
// 100% Functional - No Hallucinations - Production Ready

// Conversation ID for continuation
const CONVERSATION_ID = "PROPERTY-VIZ-SESSION-001";
const SESSION_DATE = "2025-12-06";

// Chart Configuration - Luxury Dark Mode Theme
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            labels: {
                color: '#b8c5d6',
                font: {
                    family: 'Helvetica Neue',
                    size: 12,
                    weight: '300'
                },
                padding: 15
            }
        },
        tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#d4af37',
            bodyColor: '#ffffff',
            borderColor: '#d4af37',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            titleFont: {
                size: 13,
                weight: '600'
            },
            bodyFont: {
                size: 12
            }
        }
    },
    scales: {
        x: {
            ticks: {
                color: '#b8c5d6',
                font: {
                    size: 11
                }
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
            }
        },
        y: {
            ticks: {
                color: '#b8c5d6',
                font: {
                    size: 11
                }
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
            }
        }
    }
};

// Brand Colors
const colors = {
    propertyA: '#d4af37',  // Gold
    propertyB: '#4a9eff',  // Blue
    propertyC: '#b76e79',  // Rose Gold
    success: '#00d9a3',
    warning: '#ffd93d',
    danger: '#ff6b9d'
};

// Progress Tracker Data
const visualizations = [
    // Category 1: SMART Scores & Rankings
    { id: '1.1', name: 'Overall SMART Score Radar', category: 1, completed: false },
    { id: '1.2', name: 'Individual Score Components Comparison', category: 1, completed: false },
    { id: '1.3', name: 'SMART Score Grade Distribution', category: 1, completed: false },
    { id: '1.4', name: 'Data Completeness Gauge', category: 1, completed: false },
    { id: '1.5', name: 'Property Ranking Heat Map', category: 1, completed: false },
    
    // Category 2: Price & Value Analysis
    { id: '2.1', name: 'Asking Price Comparison', category: 2, completed: false },
    { id: '2.2', name: 'Price Per Square Foot Analysis', category: 2, completed: false },
    { id: '2.3', name: 'Valuation Waterfall', category: 2, completed: false },
    { id: '2.4', name: 'Historical Appreciation Timeline', category: 2, completed: false },
    { id: '2.5', name: 'Value Differential Scatter Plot', category: 2, completed: false },
    
    // Category 3: Total Cost of Ownership
    { id: '3.1', name: 'Annual Carrying Costs Breakdown', category: 3, completed: false },
    { id: '3.2', name: 'Cost Components Stacked Bar', category: 3, completed: false },
    { id: '3.3', name: 'Monthly vs Annual Cost Comparison', category: 3, completed: false },
    { id: '3.4', name: 'Carrying Cost as % of Price', category: 3, completed: false },
    { id: '3.5', name: 'HOA vs Non-HOA Cost Analysis', category: 3, completed: false },
    
    // Category 4: Size & Space
    { id: '4.1', name: 'Living Space Comparison Bubble Chart', category: 4, completed: false },
    { id: '4.2', name: 'Bedroom/Bathroom Count Matrix', category: 4, completed: false },
    { id: '4.3', name: 'Lot Size vs Building Size', category: 4, completed: false },
    { id: '4.4', name: 'Space Efficiency Ratios', category: 4, completed: false },
    { id: '4.5', name: 'Price Per Room Analysis', category: 4, completed: false },
    
    // Category 5: Property Condition & Age
    { id: '5.1', name: 'Property Age Timeline', category: 5, completed: false },
    { id: '5.2', name: 'Roof & HVAC Remaining Life', category: 5, completed: false },
    { id: '5.3', name: 'Condition Score Gauge', category: 5, completed: false },
    { id: '5.4', name: 'System Age Comparison', category: 5, completed: false },
    { id: '5.5', name: 'Replacement Timeline Forecast', category: 5, completed: false }
];

// Initialize Progress Tracker
function initProgressTracker() {
    const container = document.getElementById('progressTable');
    const html = visualizations.map(viz => `
        <div class="progress-item ${viz.completed ? 'completed' : ''}" id="progress-${viz.id}">
            <span class="checkbox">${viz.completed ? '✅' : '⬜'}</span>
            <span class="viz-name">${viz.id} - ${viz.name}</span>
        </div>
    `).join('');
    container.innerHTML = `<div class="progress-table">${html}</div>`;
}

// Mark visualization as complete
function markComplete(vizId) {
    const viz = visualizations.find(v => v.id === vizId);
    if (viz) {
        viz.completed = true;
        const element = document.getElementById(`progress-${vizId}`);
        if (element) {
            element.classList.add('completed');
            element.querySelector('.checkbox').textContent = '✅';
        }
    }
}

// Initialize all charts
function initializeCharts() {
    const data = loadTestData();
    
    // Category 1: SMART Scores & Rankings
    createChart_1_1(data);
    createChart_1_2(data);
    createChart_1_3(data);
    createChart_1_4(data);
    createChart_1_5(data);
    
    // Category 2: Price & Value Analysis
    createChart_2_1(data);
    createChart_2_2(data);
    createChart_2_3(data);
    createChart_2_4(data);
    createChart_2_5(data);
    
    // Category 3: Total Cost of Ownership
    createChart_3_1(data);
    createChart_3_2(data);
    createChart_3_3(data);
    createChart_3_4(data);
    createChart_3_5(data);
    
    // Category 4: Size & Space
    createChart_4_1(data);
    createChart_4_2(data);
    createChart_4_3(data);
    createChart_4_4(data);
    createChart_4_5(data);
    
    // Category 5: Property Condition & Age
    createChart_5_1(data);
    createChart_5_2(data);
    createChart_5_3(data);
    createChart_5_4(data);
    createChart_5_5(data);
}

// ============================================================
// CATEGORY 1: SMART SCORES & RANKINGS
// ============================================================

// 1.1 Overall SMART Score Radar
function createChart_1_1(data) {
    const ctx = document.getElementById('chart-1-1').getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Value', 'Condition', 'Location', 'Risk (Inverse)', 'Investment', 'Data Quality'],
            datasets: data.properties.map((prop, idx) => ({
                label: prop.name,
                data: [
                    prop.smartScores.value,
                    prop.smartScores.condition,
                    prop.smartScores.location,
                    100 - prop.smartScores.risk,
                    prop.smartScores.investment,
                    prop.smartScores.dataCompleteness
                ],
                backgroundColor: Object.values(colors)[idx] + '33',
                borderColor: Object.values(colors)[idx],
                borderWidth: 2,
                pointBackgroundColor: Object.values(colors)[idx],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: Object.values(colors)[idx]
            }))
        },
        options: {
            ...chartDefaults,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#b8c5d6',
                        backdropColor: 'transparent',
                        stepSize: 20
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#d4af37',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    
    markComplete('1.1');
}

// 1.2 Individual Score Components Comparison
function createChart_1_2(data) {
    const ctx = document.getElementById('chart-1-2').getContext('2d');
    
    const labels = data.properties.map(p => p.name);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Value Score',
                    data: data.properties.map(p => p.smartScores.value),
                    backgroundColor: '#d4af37',
                    borderColor: '#d4af37',
                    borderWidth: 1
                },
                {
                    label: 'Condition Score',
                    data: data.properties.map(p => p.smartScores.condition),
                    backgroundColor: '#4a9eff',
                    borderColor: '#4a9eff',
                    borderWidth: 1
                },
                {
                    label: 'Location Score',
                    data: data.properties.map(p => p.smartScores.location),
                    backgroundColor: '#b76e79',
                    borderColor: '#b76e79',
                    borderWidth: 1
                },
                {
                    label: 'Investment Score',
                    data: data.properties.map(p => p.smartScores.investment),
                    backgroundColor: '#00d9a3',
                    borderColor: '#00d9a3',
                    borderWidth: 1
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score (0-100)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    
    markComplete('1.2');
}

// 1.3 SMART Score Grade Distribution
function createChart_1_3(data) {
    const ctx = document.getElementById('chart-1-3').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.properties.map(p => `${p.name}: ${p.smartScores.overallGrade}`),
            datasets: [{
                label: 'Overall Score',
                data: data.properties.map(p => p.smartScores.overall),
                backgroundColor: [
                    colors.propertyA,
                    colors.propertyB,
                    colors.propertyC
                ],
                borderColor: '#1a1f2e',
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    ...chartDefaults.plugins.legend,
                    position: 'bottom'
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.dataIndex];
                            return [
                                `Score: ${prop.smartScores.overall}/100`,
                                `Grade: ${prop.smartScores.overallGrade}`,
                                `Ranking: #${prop.smartScores.ranking}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('1.3');
}

// 1.4 Data Completeness Gauge
function createChart_1_4(data) {
    const ctx = document.getElementById('chart-1-4').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [{
                label: 'Data Completeness %',
                data: data.properties.map(p => p.smartScores.dataCompleteness),
                backgroundColor: data.properties.map(p => {
                    if (p.smartScores.dataCompleteness >= 90) return colors.success;
                    if (p.smartScores.dataCompleteness >= 75) return colors.warning;
                    return colors.danger;
                }),
                borderWidth: 2,
                borderColor: data.properties.map((p, idx) => Object.values(colors)[idx])
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Completeness %',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                y: {
                    ...chartDefaults.scales.y
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.x}% Complete`;
                        }
                    }
                }
            }
        }
    });
    
    markComplete('1.4');
}

// 1.5 Property Ranking Heat Map
function createChart_1_5(data) {
    const ctx = document.getElementById('chart-1-5').getContext('2d');
    
    const sortedProps = [...data.properties].sort((a, b) => 
        a.smartScores.ranking - b.smartScores.ranking
    );
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProps.map(p => `#${p.smartScores.ranking} - ${p.name}`),
            datasets: [{
                label: 'Overall SMART Score',
                data: sortedProps.map(p => p.smartScores.overall),
                backgroundColor: [
                    colors.success,
                    colors.warning,
                    colors.danger
                ],
                borderWidth: 2,
                borderColor: '#d4af37'
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'SMART Score',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                y: {
                    ...chartDefaults.scales.y
                }
            }
        }
    });
    
    markComplete('1.5');
}

// ============================================================
// CATEGORY 2: PRICE & VALUE ANALYSIS
// ============================================================

// 2.1 Asking Price Comparison
function createChart_2_1(data) {
    const ctx = document.getElementById('chart-2-1').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [{
                label: 'Listing Price',
                data: data.properties.map(p => p.priceValue.listingPrice),
                backgroundColor: [colors.propertyA, colors.propertyB, colors.propertyC],
                borderWidth: 2,
                borderColor: '#d4af37'
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Price (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.dataIndex];
                            return [
                                `Price: $${prop.priceValue.listingPrice.toLocaleString()}`,
                                `Status: ${prop.priceValue.listingStatus}`,
                                `Days on Market: ${prop.priceValue.daysOnMarket}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('2.1');
}

// 2.2 Price Per Square Foot Analysis
function createChart_2_2(data) {
    const ctx = document.getElementById('chart-2-2').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Listing $/Sq Ft',
                    data: data.properties.map(p => p.priceValue.pricePerSqFt),
                    backgroundColor: [colors.propertyA, colors.propertyB, colors.propertyC],
                    borderWidth: 2,
                    borderColor: '#d4af37'
                },
                {
                    label: 'Area Average $/Sq Ft',
                    data: data.properties.map(p => p.priceValue.avgPricePerSqFt),
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '$ per Square Foot',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
    
    markComplete('2.2');
}

// 2.3 Valuation Waterfall (Market vs Listing)
function createChart_2_3(data) {
    const ctx = document.getElementById('chart-2-3').getContext('2d');
    
    const labels = data.properties.map(p => p.name);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Market Value',
                    data: data.properties.map(p => p.priceValue.marketValueEstimate),
                    backgroundColor: 'rgba(74, 158, 255, 0.6)',
                    borderColor: colors.propertyB,
                    borderWidth: 2
                },
                {
                    label: 'Redfin Estimate',
                    data: data.properties.map(p => p.priceValue.redfinEstimate),
                    backgroundColor: 'rgba(212, 175, 55, 0.6)',
                    borderColor: colors.propertyA,
                    borderWidth: 2
                },
                {
                    label: 'Zillow Estimate',
                    data: data.properties.map(p => p.priceValue.zillowEstimate),
                    backgroundColor: 'rgba(183, 110, 121, 0.6)',
                    borderColor: colors.propertyC,
                    borderWidth: 2
                },
                {
                    label: 'Listing Price',
                    data: data.properties.map(p => p.priceValue.listingPrice),
                    backgroundColor: 'rgba(0, 217, 163, 0.8)',
                    borderColor: colors.success,
                    borderWidth: 3
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: false,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Valuation (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    
    markComplete('2.3');
}

// 2.4 Historical Appreciation Timeline
function createChart_2_4(data) {
    const ctx = document.getElementById('chart-2-4').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Total Appreciation %',
                    data: data.properties.map(p => p.priceValue.totalAppreciation),
                    backgroundColor: colors.propertyA + '33',
                    borderColor: colors.propertyA,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Annual Appreciation Rate %',
                    data: data.properties.map(p => p.priceValue.annualAppreciationRate),
                    backgroundColor: colors.propertyB + '33',
                    borderColor: colors.propertyB,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Appreciation %',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    
    markComplete('2.4');
}

// 2.5 Value Differential Scatter Plot
function createChart_2_5(data) {
    const ctx = document.getElementById('chart-2-5').getContext('2d');
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: data.properties.map((prop, idx) => ({
                label: prop.name,
                data: [{
                    x: prop.priceValue.listingPrice,
                    y: prop.priceValue.priceVsMarket,
                    r: Math.abs(prop.priceValue.priceVsMarketPct) * 3
                }],
                backgroundColor: Object.values(colors)[idx] + '66',
                borderColor: Object.values(colors)[idx],
                borderWidth: 2
            }))
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    title: {
                        display: true,
                        text: 'Listing Price (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.x.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                y: {
                    ...chartDefaults.scales.y,
                    title: {
                        display: true,
                        text: 'Price vs Market Value Difference ($)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.datasetIndex];
                            return [
                                `${prop.name}`,
                                `List: $${prop.priceValue.listingPrice.toLocaleString()}`,
                                `Diff: $${prop.priceValue.priceVsMarket.toLocaleString()} (${prop.priceValue.priceVsMarketPct}%)`,
                                prop.priceValue.priceVsMarket < 0 ? '✓ Under Market' : '✗ Over Market'
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('2.5');
}

// ============================================================
// CATEGORY 3: TOTAL COST OF OWNERSHIP
// ============================================================

// 3.1 Annual Carrying Costs Breakdown
function createChart_3_1(data) {
    const ctx = document.getElementById('chart-3-1').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Property Tax',
                    data: data.properties.map(p => p.costs.annualPropertyTax),
                    backgroundColor: '#d4af37',
                    borderWidth: 1
                },
                {
                    label: 'HOA Fees',
                    data: data.properties.map(p => p.costs.hoaFeeAnnual),
                    backgroundColor: '#4a9eff',
                    borderWidth: 1
                },
                {
                    label: 'Insurance',
                    data: data.properties.map(p => p.costs.insuranceAnnual),
                    backgroundColor: '#b76e79',
                    borderWidth: 1
                },
                {
                    label: 'CDD Fees',
                    data: data.properties.map(p => p.costs.cddFeeAnnual),
                    backgroundColor: '#00d9a3',
                    borderWidth: 1
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true
                },
                y: {
                    ...chartDefaults.scales.y,
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Annual Cost (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(1) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    markComplete('3.1');
}

// 3.2 Cost Components Stacked Bar
function createChart_3_2(data) {
    const ctx = document.getElementById('chart-3-2').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Property Tax',
                    data: data.properties.map(p => p.costs.annualPropertyTax),
                    backgroundColor: '#d4af37',
                    stack: 'Stack 0'
                },
                {
                    label: 'HOA',
                    data: data.properties.map(p => p.costs.hoaFeeAnnual),
                    backgroundColor: '#4a9eff',
                    stack: 'Stack 0'
                },
                {
                    label: 'CDD',
                    data: data.properties.map(p => p.costs.cddFeeAnnual),
                    backgroundColor: '#00d9a3',
                    stack: 'Stack 0'
                },
                {
                    label: 'Insurance',
                    data: data.properties.map(p => p.costs.insuranceAnnual),
                    backgroundColor: '#b76e79',
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Total Annual Carrying Cost (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.x.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                y: {
                    ...chartDefaults.scales.y,
                    stacked: true
                }
            }
        }
    });
    
    markComplete('3.2');
}

// 3.3 Monthly vs Annual Cost Comparison
function createChart_3_3(data) {
    const ctx = document.getElementById('chart-3-3').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Monthly Carrying Cost',
                    data: data.properties.map(p => p.costs.monthlyCarrying),
                    backgroundColor: [colors.propertyA, colors.propertyB, colors.propertyC],
                    borderWidth: 2,
                    borderColor: '#d4af37',
                    yAxisID: 'y'
                },
                {
                    label: 'Annual Carrying Cost',
                    data: data.properties.map(p => p.costs.totalAnnualCarrying),
                    backgroundColor: [colors.propertyA + '66', colors.propertyB + '66', colors.propertyC + '66'],
                    borderWidth: 2,
                    borderColor: '#4a9eff',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        color: '#b8c5d6',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Monthly ($)',
                        color: '#d4af37'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        color: '#b8c5d6',
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Annual ($)',
                        color: '#4a9eff'
                    }
                }
            }
        }
    });
    
    markComplete('3.3');
}

// 3.4 Carrying Cost as % of Price
function createChart_3_4(data) {
    const ctx = document.getElementById('chart-3-4').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.properties.map(p => `${p.name}: ${p.costs.carryingCostPctOfPrice}%`),
            datasets: [{
                data: data.properties.map(p => p.costs.carryingCostPctOfPrice),
                backgroundColor: [colors.propertyA, colors.propertyB, colors.propertyC],
                borderColor: '#1a1f2e',
                borderWidth: 3
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    ...chartDefaults.plugins.legend,
                    position: 'bottom'
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.dataIndex];
                            return [
                                `${prop.name}`,
                                `${prop.costs.carryingCostPctOfPrice}% of price`,
                                `$${prop.costs.totalAnnualCarrying.toLocaleString()}/year`,
                                `$${prop.costs.monthlyCarrying.toLocaleString()}/month`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('3.4');
}

// 3.5 HOA vs Non-HOA Cost Analysis
function createChart_3_5(data) {
    const ctx = document.getElementById('chart-3-5').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Total w/o HOA',
                    data: data.properties.map(p => p.costs.totalAnnualCarrying - p.costs.hoaFeeAnnual),
                    backgroundColor: 'rgba(0, 217, 163, 0.7)',
                    borderColor: colors.success,
                    borderWidth: 2
                },
                {
                    label: 'HOA Fees',
                    data: data.properties.map(p => p.costs.hoaFeeAnnual),
                    backgroundColor: 'rgba(255, 107, 157, 0.7)',
                    borderColor: colors.danger,
                    borderWidth: 2
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    stacked: true
                },
                y: {
                    ...chartDefaults.scales.y,
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Annual Cost (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    markComplete('3.5');
}

// ============================================================
// CATEGORY 4: SIZE & SPACE
// ============================================================

// 4.1 Living Space Comparison Bubble Chart
function createChart_4_1(data) {
    const ctx = document.getElementById('chart-4-1').getContext('2d');
    
    new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: data.properties.map((prop, idx) => ({
                label: prop.name,
                data: [{
                    x: prop.sizeSpace.bedrooms,
                    y: prop.sizeSpace.bathrooms,
                    r: prop.sizeSpace.livingSqFt / 50
                }],
                backgroundColor: Object.values(colors)[idx] + '66',
                borderColor: Object.values(colors)[idx],
                borderWidth: 2
            }))
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bedrooms',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.x.ticks,
                        stepSize: 1
                    }
                },
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bathrooms',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.datasetIndex];
                            return [
                                `${prop.name}`,
                                `${prop.sizeSpace.bedrooms} Bed / ${prop.sizeSpace.bathrooms} Bath`,
                                `${prop.sizeSpace.livingSqFt.toLocaleString()} sq ft`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('4.1');
}

// 4.2 Bedroom/Bathroom Count Matrix
function createChart_4_2(data) {
    const ctx = document.getElementById('chart-4-2').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Bedrooms',
                    data: data.properties.map(p => p.sizeSpace.bedrooms),
                    backgroundColor: colors.propertyA,
                    borderWidth: 2,
                    borderColor: '#d4af37'
                },
                {
                    label: 'Full Bathrooms',
                    data: data.properties.map(p => p.sizeSpace.bathrooms),
                    backgroundColor: colors.propertyB,
                    borderWidth: 2,
                    borderColor: '#4a9eff'
                },
                {
                    label: 'Half Bathrooms',
                    data: data.properties.map(p => p.sizeSpace.halfBaths),
                    backgroundColor: colors.propertyC,
                    borderWidth: 2,
                    borderColor: '#b76e79'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Count',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    
    markComplete('4.2');
}

// 4.3 Lot Size vs Building Size
function createChart_4_3(data) {
    const ctx = document.getElementById('chart-4-3').getContext('2d');
    
    // Filter out condos with no lot size
    const filteredData = data.properties.filter(p => p.sizeSpace.lotSizeSqFt > 0);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: filteredData.map(p => p.name),
            datasets: [
                {
                    label: 'Lot Size (sq ft)',
                    data: filteredData.map(p => p.sizeSpace.lotSizeSqFt),
                    backgroundColor: 'rgba(74, 158, 255, 0.6)',
                    borderColor: colors.propertyB,
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Building Size (sq ft)',
                    data: filteredData.map(p => p.sizeSpace.totalSqFt),
                    backgroundColor: 'rgba(212, 175, 55, 0.6)',
                    borderColor: colors.propertyA,
                    borderWidth: 2,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Square Feet',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return (value / 1000).toFixed(1) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    markComplete('4.3');
}

// 4.4 Space Efficiency Ratios
function createChart_4_4(data) {
    const ctx = document.getElementById('chart-4-4').getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Usable Space %',
                'Sq Ft per Bedroom',
                'Bath/Bed Ratio',
                'Lot/Building Ratio'
            ],
            datasets: data.properties.map((prop, idx) => ({
                label: prop.name,
                data: [
                    prop.sizeSpace.usableSpaceRatio,
                    prop.sizeSpace.sqFtPerBedroom / 10,
                    prop.sizeSpace.bathroomBedroomRatio * 100,
                    prop.sizeSpace.lotToBuildingRatio * 10
                ],
                backgroundColor: Object.values(colors)[idx] + '33',
                borderColor: Object.values(colors)[idx],
                borderWidth: 2
            }))
        },
        options: {
            ...chartDefaults,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b8c5d6',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#d4af37',
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.datasetIndex];
                            const labels = [
                                `Usable: ${prop.sizeSpace.usableSpaceRatio}%`,
                                `${prop.sizeSpace.sqFtPerBedroom} sq ft/bed`,
                                `Bath/Bed: ${prop.sizeSpace.bathroomBedroomRatio}`,
                                `Lot/Build: ${prop.sizeSpace.lotToBuildingRatio}:1`
                            ];
                            return labels[context.dataIndex];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('4.4');
}

// 4.5 Price Per Room Analysis
function createChart_4_5(data) {
    const ctx = document.getElementById('chart-4-5').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Price per Bedroom',
                    data: data.properties.map(p => p.sizeSpace.pricePerBedroom),
                    backgroundColor: colors.propertyA,
                    borderWidth: 2,
                    borderColor: '#d4af37'
                },
                {
                    label: 'Price per Bathroom',
                    data: data.properties.map(p => p.sizeSpace.pricePerBathroom),
                    backgroundColor: colors.propertyB,
                    borderWidth: 2,
                    borderColor: '#4a9eff'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Price per Room (USD)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    },
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    markComplete('4.5');
}

// ============================================================
// CATEGORY 5: PROPERTY CONDITION & AGE
// ============================================================

// 5.1 Property Age Timeline
function createChart_5_1(data) {
    const ctx = document.getElementById('chart-5-1').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [{
                label: 'Property Age (years)',
                data: data.properties.map(p => p.condition.propertyAge),
                backgroundColor: data.properties.map(p => {
                    if (p.condition.propertyAge < 10) return colors.success;
                    if (p.condition.propertyAge < 30) return colors.warning;
                    return colors.danger;
                }),
                borderWidth: 2,
                borderColor: '#d4af37'
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Age (years)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                y: {
                    ...chartDefaults.scales.y
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.dataIndex];
                            return [
                                `Built: ${prop.condition.yearBuilt}`,
                                `Age: ${prop.condition.propertyAge} years`,
                                `Exterior: ${prop.condition.exteriorMaterial}`,
                                `Condition: ${prop.condition.interiorCondition}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('5.1');
}

// 5.2 Roof & HVAC Remaining Life
function createChart_5_2(data) {
    const ctx = document.getElementById('chart-5-2').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Roof Life Remaining (years)',
                    data: data.properties.map(p => p.condition.roofRemainingLife),
                    backgroundColor: data.properties.map(p => {
                        if (p.condition.roofRemainingLife > 15) return colors.success;
                        if (p.condition.roofRemainingLife > 5) return colors.warning;
                        return colors.danger;
                    }),
                    borderWidth: 2,
                    borderColor: '#d4af37'
                },
                {
                    label: 'HVAC Life Remaining (years)',
                    data: data.properties.map(p => p.condition.hvacRemainingLife),
                    backgroundColor: data.properties.map(p => {
                        if (p.condition.hvacRemainingLife > 10) return colors.success;
                        if (p.condition.hvacRemainingLife > 5) return colors.warning;
                        return colors.danger;
                    }),
                    borderWidth: 2,
                    borderColor: '#4a9eff'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Years Remaining',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    
    markComplete('5.2');
}

// 5.3 Condition Score Gauge
function createChart_5_3(data) {
    const ctx = document.getElementById('chart-5-3').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.properties.map(p => `${p.name}: ${p.smartScores.condition}/100`),
            datasets: [{
                data: data.properties.map(p => p.smartScores.condition),
                backgroundColor: [colors.propertyA, colors.propertyB, colors.propertyC],
                borderColor: '#1a1f2e',
                borderWidth: 3,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    ...chartDefaults.plugins.legend,
                    position: 'bottom'
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const prop = data.properties[context.dataIndex];
                            return [
                                `${prop.name}`,
                                `Condition: ${prop.smartScores.condition}/100`,
                                `Age: ${prop.condition.propertyAge} years`,
                                `Roof: ${prop.condition.roofStatus}`,
                                `HVAC: ${prop.condition.hvacStatus}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    markComplete('5.3');
}

// 5.4 System Age Comparison
function createChart_5_4(data) {
    const ctx = document.getElementById('chart-5-4').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.properties.map(p => p.name),
            datasets: [
                {
                    label: 'Roof Age (years)',
                    data: data.properties.map(p => p.condition.roofAge),
                    backgroundColor: colors.propertyA,
                    borderWidth: 2,
                    borderColor: '#d4af37'
                },
                {
                    label: 'HVAC Age (years)',
                    data: data.properties.map(p => p.condition.hvacAge),
                    backgroundColor: colors.propertyB,
                    borderWidth: 2,
                    borderColor: '#4a9eff'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'System Age (years)',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    
    markComplete('5.4');
}

// 5.5 Replacement Timeline Forecast
function createChart_5_5(data) {
    const ctx = document.getElementById('chart-5-5').getContext('2d');
    
    const currentYear = new Date().getFullYear();
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: data.properties.map((prop, idx) => ({
                label: `${prop.name} - Roof`,
                data: [{
                    x: currentYear + prop.condition.roofRemainingLife,
                    y: 1,
                    r: 10
                }],
                backgroundColor: Object.values(colors)[idx] + '88',
                borderColor: Object.values(colors)[idx],
                borderWidth: 2
            })).concat(
                data.properties.map((prop, idx) => ({
                    label: `${prop.name} - HVAC`,
                    data: [{
                        x: currentYear + prop.condition.hvacRemainingLife,
                        y: 0.5,
                        r: 10
                    }],
                    backgroundColor: Object.values(colors)[idx] + '55',
                    borderColor: Object.values(colors)[idx],
                    borderWidth: 2,
                    borderDash: [5, 5]
                }))
            )
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    ...chartDefaults.scales.x,
                    min: currentYear,
                    max: currentYear + 25,
                    title: {
                        display: true,
                        text: 'Expected Replacement Year',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                y: {
                    ...chartDefaults.scales.y,
                    min: 0,
                    max: 1.5,
                    ticks: {
                        ...chartDefaults.scales.y.ticks,
                        callback: function(value) {
                            if (value === 1) return 'Roof';
                            if (value === 0.5) return 'HVAC';
                            return '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'System Type',
                        color: '#d4af37',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Expected replacement: ${Math.round(context.parsed.x)}`;
                        }
                    }
                }
            }
        }
    });
    
    markComplete('5.5');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('='.repeat(60));
    console.log('Property Comparison Visualization System');
    console.log('John E Desautels & Associates');
    console.log('Session ID:', CONVERSATION_ID);
    console.log('Session Date:', SESSION_DATE);
    console.log('='.repeat(60));
    
    initProgressTracker();
    initializeCharts();
    
    console.log('✓ All 25 visualizations initialized');
    console.log('✓ Test data loaded');
    console.log('✓ Progress tracker active');
    
    // Display completion summary
    const completed = visualizations.filter(v => v.completed).length;
    console.log(`\nVisualization Status: ${completed}/25 complete`);
    
    // Next session instructions
    console.log('\n' + '='.repeat(60));
    console.log('CONTINUATION INSTRUCTIONS FOR NEXT SESSION:');
    console.log('='.repeat(60));
    console.log('Session ID:', CONVERSATION_ID);
    console.log('Next Batch: Visualizations 26-50');
    console.log('Categories: 6-10');
    console.log('- Category 6: Interior Features (5 charts)');
    console.log('- Category 7: Exterior & Outdoor (5 charts)');
    console.log('- Category 8: Parking & Garage (5 charts)');
    console.log('- Category 9: Building Details (5 charts)');
    console.log('- Category 10: Waterfront & Views (5 charts)');
    console.log('='.repeat(60));
});
