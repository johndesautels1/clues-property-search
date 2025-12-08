// AI Insights Generation
class AIInsights {
    constructor() {
        this.insights = [];
    }
    
    // Generate insights based on selected properties
    generateInsights(propertyIds) {
        this.insights = [];
        const properties = propertyIds.map(id => propertyData.getProperty(id));
        
        // Calculate market insights
        const avgPrice = properties.reduce((sum, p) => sum + p.listingPrice, 0) / properties.length;
        const marketEfficiency = propertyData.calculateMarketEfficiency();
        const bestValueProperty = propertyData.findBestValueProperty();
        const fastestMovingProperty = propertyData.findFastestMovingProperty();
        
        // Update metric cards
        document.getElementById("marketEfficiency").textContent = `${marketEfficiency.toFixed(1)}%`;
        document.getElementById("pricePremium").textContent = `${(avgPrice / 1000000).toFixed(2)}M avg`;
        document.getElementById("roiPotential").textContent = `+${bestValueProperty ? propertyData.calculateMetrics(bestValueProperty).appreciation.toFixed(1) : 0}%`;
        
        // Generate insights
        this.insights = [
            {
                icon: "fas fa-lightbulb",
                text: `The market efficiency score is ${marketEfficiency.toFixed(1)}%, indicating ${marketEfficiency > 75 ? "highly efficient" : marketEfficiency > 50 ? "moderately efficient" : "inefficient"} pricing across selected properties.`
            },
            {
                icon: "fas fa-chart-line",
                text: `${bestValueProperty.name} shows the highest value score at ${propertyData.calculateMetrics(bestValueProperty).valueScore.toFixed(1)}/10, combining school quality, safety, and walkability.`
            },
            {
                icon: "fas fa-clock",
                text: `${fastestMovingProperty.name} has been on the market for only ${fastestMovingProperty.daysOnMarket} days, suggesting strong buyer interest in this ${fastestMovingProperty.propertyType.toLowerCase()}.`
            },
            {
                icon: "fas fa-balance-scale",
                text: `Price per square foot ranges from $${Math.min(...properties.map(p => p.pricePerSqFt))} to $${Math.max(...properties.map(p => p.pricePerSqFt))}, with ${properties.find(p => p.pricePerSqFt === Math.min(...properties.map(p => p.pricePerSqFt)))?.name} offering the best value.`
            },
            {
                icon: "fas fa-home",
                text: `Based on neighborhood scores, ${properties.sort((a, b) => (100 - a.crimeScore) - (100 - b.crimeScore))[0]?.name} offers the safest location with a crime score of ${properties.sort((a, b) => (100 - a.crimeScore) - (100 - b.crimeScore))[0]?.crimeScore}.`
            }
        ];
        
        return this.insights;
    }
    
    // Display insights in the UI
    displayInsights(propertyIds) {
        const insightsList = d3.select("#insightsList");
        insightsList.html("");
        
        const insights = this.generateInsights(propertyIds);
        
        insights.forEach(insight => {
            const li = insightsList.append("li")
                .attr("class", "insight-item");
            
            li.html(`
                <i class="fas ${insight.icon} insight-icon"></i>
                <div class="insight-text">${insight.text}</div>
            `);
        });
        
        // Add animation
        const insightsPanel = document.getElementById("aiInsights");
        insightsPanel.style.animation = "none";
        setTimeout(() => {
            insightsPanel.style.animation = "pulse 0.5s";
        }, 10);
    }
}

// Create global instance
const aiInsights = new AIInsights();