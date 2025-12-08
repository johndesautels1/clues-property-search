// Chart Generation Functions
class ChartGenerator {
    constructor() {
        this.tooltip = d3.select("#tooltip");
        this.colorScale = d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateBlues);
    }
    
    // Show tooltip
    showTooltip(event, content) {
        const [x, y] = d3.pointer(event);
        this.tooltip
            .style("left", (x + 20) + "px")
            .style("top", (y + 20) + "px")
            .style("opacity", 1)
            .html(content);
    }
    
    // Hide tooltip
    hideTooltip() {
        this.tooltip.style("opacity", 0);
    }
    
    // Create Market Radar Chart
    createMarketRadar(propertyIds, view = "radar") {
        const container = d3.select("#marketRadar");
        container.html("");
        
        const width = 500;
        const height = 320;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const radius = Math.min(width, height) / 2 - 40;
        
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width/2},${height/2})`);
        
        // Metrics for radar
        const metrics = [
            { key: "pricePerSqFt", label: "Price/SqFt", normalize: true },
            { key: "valueScore", label: "Value Score", normalize: true, calculate: (p) => propertyData.calculateMetrics(p).valueScore },
            { key: "schoolRating", label: "Schools", normalize: true },
            { key: "walkScore", label: "Walkability", normalize: true },
            { key: "crimeScore", label: "Safety", normalize: true, invert: true },
            { key: "daysOnMarket", label: "DOM", normalize: true, invert: true }
        ];
        
        // Calculate normalized values
        const properties = propertyIds.map(id => propertyData.getProperty(id));
        const normalizedData = properties.map(property => {
            const values = metrics.map(metric => {
                let value;
                if (metric.calculate) {
                    value = metric.calculate(property);
                } else {
                    value = property[metric.key];
                }
                
                if (metric.invert) {
                    value = 100 - value;
                }
                
                return value;
            });
            
            // Normalize to 0-1 scale
            const maxValues = metrics.map((metric, i) => 
                Math.max(...properties.map(p => {
                    let val;
                    if (metric.calculate) {
                        val = metric.calculate(p);
                    } else {
                        val = p[metric.key];
                    }
                    if (metric.invert) val = 100 - val;
                    return val;
                }))
            );
            
            const normalized = values.map((v, i) => v / maxValues[i]);
            return { property, values, normalized };
        });
        
        // Draw radar grid
        const levels = 5;
        const angleSlice = (Math.PI * 2) / metrics.length;
        
        for (let level = 0; level < levels; level++) {
            const levelFactor = radius * ((level + 1) / levels);
            
            svg.append("circle")
                .attr("r", levelFactor)
                .attr("fill", "none")
                .attr("stroke", "#e2e8f0")
                .attr("stroke-width", 1);
        }
        
        // Draw axes
        metrics.forEach((metric, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            // Axis line
            svg.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .attr("stroke", "#cbd5e1")
                .attr("stroke-width", 1);
            
            // Label
            svg.append("text")
                .attr("x", Math.cos(angle) * (radius + 25))
                .attr("y", Math.sin(angle) * (radius + 25))
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("font-size", "12px")
                .attr("fill", "#64748b")
                .text(metric.label);
        });
        
        // Draw property radars
        normalizedData.forEach((data, idx) => {
            const lineGenerator = d3.lineRadial()
                .radius(d => d * radius)
                .angle((d, i) => angleSlice * i - Math.PI / 2)
                .curve(d3.curveLinearClosed);
            
            // Area
            svg.append("path")
                .datum(data.normalized)
                .attr("d", lineGenerator)
                .attr("fill", data.property.color)
                .attr("fill-opacity", 0.1)
                .attr("stroke", data.property.color)
                .attr("stroke-width", 2);
            
            // Data points with tooltips
            data.normalized.forEach((value, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                const x = Math.cos(angle) * value * radius;
                const y = Math.sin(angle) * value * radius;
                
                svg.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 4)
                    .attr("fill", data.property.color)
                    .attr("stroke", "white")
                    .attr("stroke-width", 1)
                    .on("mouseover", (event) => {
                        const metric = metrics[i];
                        const actualValue = data.values[i];
                        this.showTooltip(event, `
                            <div class="tooltip-header">${data.property.name}</div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">${metric.label}:</span>
                                <span class="tooltip-value">${actualValue.toFixed(1)}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Percentile:</span>
                                <span class="tooltip-value">${(value * 100).toFixed(0)}%</span>
                            </div>
                        `);
                    })
                    .on("mouseout", () => this.hideTooltip());
            });
        });
    }
    
    // Create Value Momentum Chart
    createValueMomentum(propertyIds, view = "vector") {
        const container = d3.select("#valueMomentum");
        container.html("");
        
        const width = 500;
        const height = 320;
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const properties = propertyIds.map(id => propertyData.getProperty(id));
        
        // Prepare data points
        const dataPoints = [];
        properties.forEach(property => {
            const metrics = propertyData.calculateMetrics(property);
            
            dataPoints.push(
                { property, type: "Last Sale", value: property.lastSalePrice, color: property.color, opacity: 0.7 },
                { property, type: "Assessed", value: property.assessedValue, color: property.color, opacity: 0.8 },
                { property, type: "Market", value: property.marketValue, color: property.color, opacity: 0.9 },
                { property, type: "Listing", value: property.listingPrice, color: property.color, opacity: 1 }
            );
        });
        
        // Create scales
        const xScale = d3.scalePoint()
            .domain(["Last Sale", "Assessed", "Market", "Listing"])
            .range([0, innerWidth])
            .padding(0.5);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(dataPoints, d => d.value) * 1.1])
            .range([innerHeight, 0]);
        
        // Add grid
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickFormat("")
            )
            .selectAll("line")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-width", 1);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("font-size", "12px")
            .attr("fill", "#64748b");
        
        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => propertyData.formatCurrency(d)))
            .selectAll("text")
            .attr("font-size", "12px")
            .attr("fill", "#64748b");
        
        // Draw lines for each property
        properties.forEach(property => {
            const propertyPoints = dataPoints.filter(d => d.property.id === property.id);
            
            const line = d3.line()
                .x(d => xScale(d.type))
                .y(d => yScale(d.value));
            
            g.append("path")
                .datum(propertyPoints)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", property.color)
                .attr("stroke-width", 2)
                .attr("opacity", 0.3);
            
            // Draw points
            propertyPoints.forEach(point => {
                g.append("circle")
                    .attr("cx", xScale(point.type))
                    .attr("cy", yScale(point.value))
                    .attr("r", 5)
                    .attr("fill", point.color)
                    .attr("opacity", point.opacity)
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .on("mouseover", (event) => {
                        const momentum = ((property.listingPrice - property.lastSalePrice) / property.lastSalePrice * 100).toFixed(1);
                        this.showTooltip(event, `
                            <div class="tooltip-header">${property.name}</div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">${point.type}:</span>
                                <span class="tooltip-value">${propertyData.formatCurrency(point.value)}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Total Appreciation:</span>
                                <span class="tooltip-value ${momentum >= 0 ? "change-positive" : "change-negative"}">
                                    ${momentum >= 0 ? "+" : ""}${momentum}%
                                </span>
                            </div>
                        `);
                    })
                    .on("mouseout", () => this.hideTooltip());
            });
        });
    }
    
    // Create Price Topography Chart
    createPriceTopography(propertyIds, view = "contour") {
        const container = d3.select("#priceTopography");
        container.html("");
        
        const width = 500;
        const height = 320;
        
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const properties = propertyIds.map(id => propertyData.getProperty(id));
        
        // Generate simulated topography
        const gridSize = 40;
        const data = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                let value = 0;
                
                properties.forEach((property, idx) => {
                    const dx = (x / gridSize - idx / (properties.length - 1) * 0.8 - 0.1) * 2;
                    const dy = (y / gridSize - 0.5) * 2;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const peakHeight = property.listingPrice / 3000000;
                    value += peakHeight * Math.exp(-distance * 3);
                });
                
                data.push({
                    x: x / gridSize * width,
                    y: y / gridSize * height,
                    value: value * 100
                });
            }
        }
        
        // Create color scale
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(data, d => d.value)])
            .interpolator(d3.interpolateBlues);
        
        // Draw contour lines
        const contourGenerator = d3.contourDensity()
            .x(d => d.x)
            .y(d => d.y)
            .size([width, height])
            .bandwidth(15)
            .thresholds(15);
        
        const contours = contourGenerator(data);
        
        svg.selectAll("path")
            .data(contours)
            .enter().append("path")
            .attr("d", d3.geoPath())
            .attr("fill", d => colorScale(d.value))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.8);
        
        // Add property markers
        properties.forEach((property, idx) => {
            const x = (idx / (properties.length - 1) * 0.8 + 0.1) * width;
            const y = height / 2;
            
            // Marker
            svg.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 8)
                .attr("fill", property.color)
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .on("mouseover", (event) => {
                    const metrics = propertyData.calculateMetrics(property);
                    this.showTooltip(event, `
                        <div class="tooltip-header">${property.name}</div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Listing Price:</span>
                            <span class="tooltip-value">${propertyData.formatCurrency(property.listingPrice)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Price/SqFt:</span>
                            <span class="tooltip-value">$${property.pricePerSqFt}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Value Score:</span>
                            <span class="tooltip-value">${metrics.valueScore.toFixed(1)}/10</span>
                        </div>
                    `);
                })
                .on("mouseout", () => this.hideTooltip());
            
            // Label
            svg.append("text")
                .attr("x", x)
                .attr("y", y - 15)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "600")
                .attr("fill", property.color)
                .text(property.name.split(" ")[0]);
        });
    }
    
    // Create Time Series Chart
    createTimeSeries(propertyIds, view = "line") {
        const container = d3.select("#timeSeries");
        container.html("");
        
        const width = 500;
        const height = 320;
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const properties = propertyIds.map(id => propertyData.getProperty(id));
        
        // Prepare timeline data
        const allDates = [];
        properties.forEach(property => {
            property.priceHistory.forEach(point => {
                allDates.push(new Date(point.date));
            });
        });
        
        const minDate = d3.min(allDates);
        const maxDate = d3.max(allDates) || new Date();
        
        // Create scales
        const xScale = d3.scaleTime()
            .domain([minDate, d3.max(allDates)])
            .range([0, innerWidth]);
        
        const maxPrice = d3.max(properties, p => 
            d3.max(p.priceHistory, h => h.price)
        );
        
        const yScale = d3.scaleLinear()
            .domain([0, maxPrice * 1.1])
            .range([innerHeight, 0]);
        
        // Add grid
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickFormat("")
            )
            .selectAll("line")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-width", 1);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .selectAll("text")
            .attr("font-size", "12px")
            .attr("fill", "#64748b");
        
        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => propertyData.formatCurrency(d)))
            .selectAll("text")
            .attr("font-size", "12px")
            .attr("fill", "#64748b");
        
        // Draw lines for each property
        properties.forEach(property => {
            const line = d3.line()
                .x(d => xScale(new Date(d.date)))
                .y(d => yScale(d.price))
                .curve(d3.curveMonotoneX);
            
            g.append("path")
                .datum(property.priceHistory)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", property.color)
                .attr("stroke-width", 2);
            
            // Draw points
            property.priceHistory.forEach(point => {
                g.append("circle")
                    .attr("cx", xScale(new Date(point.date)))
                    .attr("cy", yScale(point.price))
                    .attr("r", 4)
                    .attr("fill", property.color)
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .on("mouseover", (event) => {
                        const date = new Date(point.date).toLocaleDateString();
                        this.showTooltip(event, `
                            <div class="tooltip-header">${property.name}</div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Date:</span>
                                <span class="tooltip-value">${date}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Price:</span>
                                <span class="tooltip-value">${propertyData.formatCurrency(point.price)}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Event:</span>
                                <span class="tooltip-value">${point.event}</span>
                            </div>
                        `);
                    })
                    .on("mouseout", () => this.hideTooltip());
            });
            
            // Add current price marker
            g.append("circle")
                .attr("cx", xScale(new Date()))
                .attr("cy", yScale(property.listingPrice))
                .attr("r", 6)
                .attr("fill", property.color)
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("filter", "drop-shadow(0 0 4px rgba(0,0,0,0.2))");
        });
    }
    
    // Create Comparative Analysis Matrix
    createComparativeAnalysis(propertyIds, view = "matrix") {
        const container = d3.select("#compAnalysis");
        container.html("");
        
        const width = 800;
        const height = 400;
        
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const properties = propertyIds.map(id => propertyData.getProperty(id));
        
        // Create matrix of comparison metrics
        const metrics = [
            { key: "listingPrice", label: "Listing Price", format: propertyData.formatCurrency },
            { key: "pricePerSqFt", label: "Price/SqFt", format: (v) => `$${v}` },
            { key: "sqft", label: "Square Feet", format: (v) => v.toLocaleString() },
            { key: "bedrooms", label: "Bedrooms", format: (v) => v },
            { key: "schoolRating", label: "School Rating", format: (v) => v.toFixed(1) },
            { key: "walkScore", label: "Walk Score", format: (v) => v },
            { key: "daysOnMarket", label: "Days on Market", format: (v) => v }
        ];
        
        const cellSize = 100;
        const margin = 60;
        
        // Draw property headers
        properties.forEach((property, i) => {
            // Column header
            svg.append("text")
                .attr("x", margin + cellSize * (i + 1))
                .attr("y", margin - 10)
                .attr("text-anchor", "middle")
                .attr("font-weight", "600")
                .attr("fill", property.color)
                .text(property.name);
            
            // Row header
            svg.append("text")
                .attr("x", margin - 10)
                .attr("y", margin + cellSize * (i + 1) - cellSize/2)
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle")
                .attr("font-weight", "600")
                .attr("fill", property.color)
                .text(property.name);
            
            // Property color indicator
            svg.append("circle")
                .attr("cx", margin - 20)
                .attr("cy", margin + cellSize * (i + 1) - cellSize/2)
                .attr("r", 6)
                .attr("fill", property.color);
        });
        
        // Draw comparison cells
        for (let i = 0; i < properties.length; i++) {
            for (let j = 0; j < properties.length; j++) {
                if (i === j) {
                    // Diagonal - show property metrics
                    const metricsBox = svg.append("g")
                        .attr("transform", `translate(${margin + cellSize * (j + 1) - cellSize/2}, ${margin + cellSize * (i + 1) - cellSize/2})`);
                    
                    metrics.slice(0, 3).forEach((metric, idx) => {
                        const value = properties[i][metric.key];
                        metricsBox.append("text")
                            .attr("x", 0)
                            .attr("y", idx * 16 - 16)
                            .attr("text-anchor", "middle")
                            .attr("font-size", "11px")
                            .attr("fill", "#64748b")
                            .text(`${metric.label}: ${metric.format(value)}`);
                    });
                } else {
                    // Comparison cell
                    const cellX = margin + cellSize * (j + 1) - cellSize/2;
                    const cellY = margin + cellSize * (i + 1) - cellSize/2;
                    
                    // Calculate comparison metrics
                    const prop1 = properties[i];
                    const prop2 = properties[j];
                    
                    const priceDiff = ((prop1.listingPrice - prop2.listingPrice) / prop2.listingPrice) * 100;
                    const pricePerSqFtDiff = ((prop1.pricePerSqFt - prop2.pricePerSqFt) / prop2.pricePerSqFt) * 100;
                    
                    // Draw comparison circle
                    const radius = Math.min(Math.abs(priceDiff) / 5, 30);
                    
                    svg.append("circle")
                        .attr("cx", cellX)
                        .attr("cy", cellY)
                        .attr("r", radius)
                        .attr("fill", priceDiff > 0 ? properties[i].color : properties[j].color)
                        .attr("fill-opacity", 0.2)
                        .attr("stroke", priceDiff > 0 ? properties[i].color : properties[j].color)
                        .attr("stroke-width", 2);
                    
                    // Add comparison text
                    svg.append("text")
                        .attr("x", cellX)
                        .attr("y", cellY)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .attr("font-size", "12px")
                        .attr("font-weight", "600")
                        .attr("fill", priceDiff > 0 ? properties[i].color : properties[j].color)
                        .text(`${priceDiff > 0 ? "+" : ""}${priceDiff.toFixed(1)}%`);
                    
                    // Make cell interactive
                    svg.append("rect")
                        .attr("x", cellX - cellSize/2)
                        .attr("y", cellY - cellSize/2)
                        .attr("width", cellSize)
                        .attr("height", cellSize)
                        .attr("fill", "transparent")
                        .on("mouseover", (event) => {
                            this.showTooltip(event, `
                                <div class="tooltip-header">${prop1.name} vs ${prop2.name}</div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Price Difference:</span>
                                    <span class="tooltip-value ${priceDiff >= 0 ? "change-positive" : "change-negative"}">
                                        ${priceDiff >= 0 ? "+" : ""}${priceDiff.toFixed(1)}%
                                    </span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Price/SqFt Difference:</span>
                                    <span class="tooltip-value ${pricePerSqFtDiff >= 0 ? "change-positive" : "change-negative"}">
                                        ${pricePerSqFtDiff >= 0 ? "+" : ""}${pricePerSqFtDiff.toFixed(1)}%
                                    </span>
                                </div>
                                <div class="tooltip-divider"></div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">${prop1.name}:</span>
                                    <span class="tooltip-value">${propertyData.formatCurrency(prop1.listingPrice)}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">${prop2.name}:</span>
                                    <span class="tooltip-value">${propertyData.formatCurrency(prop2.listingPrice)}</span>
                                </div>
                            `);
                        })
                        .on("mouseout", () => this.hideTooltip());
                }
            }
        }
        
        // Draw grid lines
        for (let i = 0; i <= properties.length + 1; i++) {
            // Vertical lines
            svg.append("line")
                .attr("x1", margin + cellSize * i)
                .attr("y1", margin)
                .attr("x2", margin + cellSize * i)
                .attr("y2", margin + cellSize * (properties.length + 1))
                .attr("stroke", "#e2e8f0")
                .attr("stroke-width", 1);
            
            // Horizontal lines
            svg.append("line")
                .attr("x1", margin)
                .attr("y1", margin + cellSize * i)
                .attr("x2", margin + cellSize * (properties.length + 1))
                .attr("y2", margin + cellSize * i)
                .attr("stroke", "#e2e8f0")
                .attr("stroke-width", 1);
        }
    }
}

// Create global instance
const chartGenerator = new ChartGenerator();