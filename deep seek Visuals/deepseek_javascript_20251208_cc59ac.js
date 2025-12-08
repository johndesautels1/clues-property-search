// Property Data and Utility Functions
class PropertyData {
    constructor() {
        this.data = {
            "property1": {
                id: "property1",
                name: "Lakeview Modern",
                address: "123 Lakeview Dr, San Francisco, CA",
                listingPrice: 1250000,
                pricePerSqFt: 450,
                marketValue: 1300000,
                lastSaleDate: "2022-03-15",
                lastSalePrice: 1100000,
                assessedValue: 1150000,
                redfinEstimate: 1280000,
                zillowEstimate: 1265000,
                daysOnMarket: 24,
                priceReduction: 0,
                bedrooms: 4,
                bathrooms: 3,
                sqft: 2778,
                yearBuilt: 2018,
                lotSize: 5000,
                propertyType: "Single Family",
                neighborhood: "Lakeview",
                schoolRating: 9.2,
                walkScore: 78,
                transitScore: 85,
                crimeScore: 12,
                color: "#3b82f6",
                priceHistory: [
                    { date: "2022-03-15", price: 1100000, event: "Last Sale" },
                    { date: "2022-06-15", price: 1150000, event: "Appraisal" },
                    { date: "2022-09-15", price: 1200000, event: "Market Adjustment" },
                    { date: "2023-01-15", price: 1250000, event: "Current Listing" }
                ],
                comps: [1200000, 1150000, 1300000, 1220000],
                tags: ["Waterfront", "Renovated", "Smart Home", "High ROI"]
            },
            "property2": {
                id: "property2",
                name: "Hillside Estate",
                address: "456 Hilltop Rd, Marin County, CA",
                listingPrice: 950000,
                pricePerSqFt: 600,
                marketValue: 980000,
                lastSaleDate: "2021-11-20",
                lastSalePrice: 850000,
                assessedValue: 900000,
                redfinEstimate: 970000,
                zillowEstimate: 960000,
                daysOnMarket: 45,
                priceReduction: 50000,
                bedrooms: 5,
                bathrooms: 3.5,
                sqft: 1583,
                yearBuilt: 2015,
                lotSize: 12000,
                propertyType: "Single Family",
                neighborhood: "West Hills",
                schoolRating: 8.7,
                walkScore: 42,
                transitScore: 35,
                crimeScore: 8,
                color: "#10b981",
                priceHistory: [
                    { date: "2021-11-20", price: 850000, event: "Last Sale" },
                    { date: "2022-05-20", price: 900000, event: "Appraisal" },
                    { date: "2022-10-20", price: 1000000, event: "Initial Listing" },
                    { date: "2023-01-20", price: 950000, event: "Price Reduction" }
                ],
                comps: [920000, 880000, 960000, 940000],
                tags: ["Mountain View", "Large Lot", "Updated Kitchen", "Good Schools"]
            },
            "property3": {
                id: "property3",
                name: "Urban Loft",
                address: "789 Downtown Ave, San Francisco, CA",
                listingPrice: 750000,
                pricePerSqFt: 350,
                marketValue: 780000,
                lastSaleDate: "2023-01-10",
                lastSalePrice: 720000,
                assessedValue: 740000,
                redfinEstimate: 760000,
                zillowEstimate: 755000,
                daysOnMarket: 12,
                priceReduction: 0,
                bedrooms: 2,
                bathrooms: 2,
                sqft: 2143,
                yearBuilt: 2020,
                lotSize: null,
                propertyType: "Condo",
                neighborhood: "Downtown",
                schoolRating: 7.8,
                walkScore: 95,
                transitScore: 98,
                crimeScore: 25,
                color: "#8b5cf6",
                priceHistory: [
                    { date: "2023-01-10", price: 720000, event: "Last Sale" },
                    { date: "2023-02-01", price: 750000, event: "Current Listing" }
                ],
                comps: [730000, 740000, 760000, 720000],
                tags: ["Downtown", "New Construction", "Amenities", "Walkable"]
            },
            "property4": {
                id: "property4",
                name: "Waterfront Villa",
                address: "101 Bayview Blvd, Sausalito, CA",
                listingPrice: 2200000,
                pricePerSqFt: 850,
                marketValue: 2400000,
                lastSaleDate: "2020-05-30",
                lastSalePrice: 1900000,
                assessedValue: 2100000,
                redfinEstimate: 2300000,
                zillowEstimate: 2250000,
                daysOnMarket: 120,
                priceReduction: 100000,
                bedrooms: 6,
                bathrooms: 4.5,
                sqft: 2588,
                yearBuilt: 2012,
                lotSize: 15000,
                propertyType: "Single Family",
                neighborhood: "Bayfront",
                schoolRating: 9.8,
                walkScore: 65,
                transitScore: 70,
                crimeScore: 5,
                color: "#f59e0b",
                priceHistory: [
                    { date: "2020-05-30", price: 1900000, event: "Last Sale" },
                    { date: "2021-05-30", price: 2100000, event: "Appraisal" },
                    { date: "2022-05-30", price: 2300000, event: "Initial Listing" },
                    { date: "2022-11-30", price: 2200000, event: "Price Reduction" }
                ],
                comps: [2100000, 2250000, 2350000, 2150000],
                tags: ["Waterfront", "Luxury", "Pool", "Premium Location"]
            },
            "property5": {
                id: "property5",
                name: "Suburban Family",
                address: "202 Maple St, San Jose, CA",
                listingPrice: 650000,
                pricePerSqFt: 280,
                marketValue: 680000,
                lastSaleDate: "2022-08-22",
                lastSalePrice: 620000,
                assessedValue: 640000,
                redfinEstimate: 670000,
                zillowEstimate: 665000,
                daysOnMarket: 30,
                priceReduction: 25000,
                bedrooms: 3,
                bathrooms: 2,
                sqft: 2321,
                yearBuilt: 2016,
                lotSize: 8000,
                propertyType: "Single Family",
                neighborhood: "Green Valley",
                schoolRating: 8.2,
                walkScore: 55,
                transitScore: 60,
                crimeScore: 15,
                color: "#ef4444",
                priceHistory: [
                    { date: "2022-08-22", price: 620000, event: "Last Sale" },
                    { date: "2022-11-22", price: 675000, event: "Initial Listing" },
                    { date: "2023-01-22", price: 650000, event: "Price Reduction" }
                ],
                comps: [640000, 660000, 670000, 630000],
                tags: ["Family Friendly", "Quiet Street", "Updated", "Good Value"]
            }
        };
        
        this.selectedProperties = ["property1", "property2", "property3"];
        this.chartViews = {
            marketRadar: "radar",
            valueMomentum: "vector",
            priceTopography: "contour",
            timeSeries: "line",
            compAnalysis: "matrix"
        };
    }
    
    // Get all property IDs
    getAllPropertyIds() {
        return Object.keys(this.data);
    }
    
    // Get property by ID
    getProperty(id) {
        return this.data[id];
    }
    
    // Get selected properties
    getSelectedProperties() {
        return this.selectedProperties.map(id => this.data[id]);
    }
    
    // Calculate metrics for a property
    calculateMetrics(property) {
        const priceVsMarket = ((property.listingPrice - property.marketValue) / property.marketValue) * 100;
        const appreciation = ((property.marketValue - property.lastSalePrice) / property.lastSalePrice) * 100;
        const daysSinceLastSale = Math.floor((new Date() - new Date(property.lastSaleDate)) / (1000 * 60 * 60 * 24));
        const valueScore = (property.schoolRating * 0.3 + (100 - property.crimeScore) * 0.3 + property.walkScore * 0.2 + property.transitScore * 0.2) / 10;
        
        return {
            priceVsMarket,
            appreciation,
            daysSinceLastSale,
            valueScore
        };
    }
    
    // Format currency
    formatCurrency(value) {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    }
    
    // Calculate market efficiency across selected properties
    calculateMarketEfficiency() {
        const properties = this.getSelectedProperties();
        const efficiency = properties.reduce((sum, property) => {
            const metrics = this.calculateMetrics(property);
            return sum + (100 - Math.abs(metrics.priceVsMarket));
        }, 0) / properties.length;
        
        return efficiency;
    }
    
    // Find best value property
    findBestValueProperty() {
        const properties = this.getSelectedProperties();
        return properties.reduce((best, current) => {
            const currentMetrics = this.calculateMetrics(current);
            const bestMetrics = best ? this.calculateMetrics(best) : { valueScore: 0 };
            return currentMetrics.valueScore > bestMetrics.valueScore ? current : best;
        });
    }
    
    // Find fastest moving property
    findFastestMovingProperty() {
        const properties = this.getSelectedProperties();
        return properties.reduce((best, current) => {
            return current.daysOnMarket < (best?.daysOnMarket || Infinity) ? current : best;
        });
    }
}

// Create global instance
const propertyData = new PropertyData();