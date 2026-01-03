// Property Comparison Data Structure
// This file contains test data that can be easily edited, cleared, or replaced
// Data is NOT embedded in code - it's stored here for easy management

let propertyData = {
    properties: [
        {
            id: "prop-a",
            name: "Property A",
            photo: "https://via.placeholder.com/400x300/1a1a2e/ffffff?text=Property+A",
            address: "9582 103rd Ave N",
            city: "Seminole",
            state: "FL",
            zip: "33772",
            propertyType: "Single Family",
            mlsNumber: "TB18234567",
            
            // Category 1: SMART Scores
            smartScores: {
                overall: 72,
                overallGrade: "B",
                value: 78,
                condition: 62,
                location: 68,
                risk: 34,
                investment: 71,
                dataCompleteness: 78,
                ranking: 2
            },
            
            // Category 2: Price & Value
            priceValue: {
                listingPrice: 475000,
                pricePerSqFt: 326,
                listingStatus: "Active",
                daysOnMarket: 12,
                marketValueEstimate: 485000,
                redfinEstimate: 479200,
                zillowEstimate: 481000,
                assessedValue: 412500,
                medianHomePrice: 465000,
                avgPricePerSqFt: 342,
                priceVsMarket: -10000,
                priceVsMarketPct: -2.1,
                lastSalePrice: 285000,
                lastSaleDate: "2018-06-01",
                totalAppreciation: 66.7,
                annualAppreciationRate: 8.5,
                equityPosition: 200000
            },
            
            // Category 3: Total Cost of Ownership
            costs: {
                annualPropertyTax: 5842,
                propertyTaxRate: 1.23,
                hoaFeeAnnual: 0,
                cddFeeAnnual: 0,
                insuranceAnnual: 3200,
                totalAnnualCarrying: 9042,
                monthlyCarrying: 754,
                carryingCostPctOfPrice: 1.90,
                hasHomestead: true
            },
            
            // Category 4: Size & Space
            sizeSpace: {
                bedrooms: 3,
                bathrooms: 2.0,
                halfBaths: 0,
                livingSqFt: 1458,
                totalSqFt: 1892,
                stories: 1,
                lotSizeSqFt: 8712,
                lotSizeAcres: 0.20,
                usableSpaceRatio: 77.1,
                lotToBuildingRatio: 4.6,
                sqFtPerBedroom: 486,
                bathroomBedroomRatio: 0.67,
                pricePerBedroom: 158333,
                pricePerBathroom: 237500
            },
            
            // Category 5: Condition & Age
            condition: {
                yearBuilt: 1974,
                propertyAge: 51,
                roofType: "Shingle",
                roofAge: 17,
                roofRemainingLife: 3,
                roofStatus: "Replace Soon",
                hvacType: "Central A/C",
                hvacAge: 10,
                hvacRemainingLife: 5,
                hvacStatus: "Monitor",
                waterHeaterType: "Electric Tank",
                foundation: "Slab",
                exteriorMaterial: "Stucco",
                interiorCondition: "Fair to Good"
            }
        },
        {
            id: "prop-b",
            name: "Property B",
            photo: "https://via.placeholder.com/400x300/0f3460/ffffff?text=Property+B",
            address: "4721 Gulf Blvd #206",
            city: "St Pete Beach",
            state: "FL",
            zip: "33706",
            propertyType: "Condo",
            mlsNumber: "TB18234892",
            
            // Category 1: SMART Scores
            smartScores: {
                overall: 85,
                overallGrade: "A-",
                value: 71,
                condition: 88,
                location: 91,
                risk: 58,
                investment: 82,
                dataCompleteness: 92,
                ranking: 1
            },
            
            // Category 2: Price & Value
            priceValue: {
                listingPrice: 549900,
                pricePerSqFt: 458,
                listingStatus: "Active",
                daysOnMarket: 6,
                marketValueEstimate: 535000,
                redfinEstimate: 541800,
                zillowEstimate: 538500,
                assessedValue: 478200,
                medianHomePrice: 625000,
                avgPricePerSqFt: 485,
                priceVsMarket: 14900,
                priceVsMarketPct: 2.8,
                lastSalePrice: 425000,
                lastSaleDate: "2021-03-01",
                totalAppreciation: 29.4,
                annualAppreciationRate: 7.1,
                equityPosition: 110000
            },
            
            // Category 3: Total Cost of Ownership
            costs: {
                annualPropertyTax: 7234,
                propertyTaxRate: 1.32,
                hoaFeeAnnual: 8400,
                cddFeeAnnual: 0,
                insuranceAnnual: 1850,
                totalAnnualCarrying: 17484,
                monthlyCarrying: 1457,
                carryingCostPctOfPrice: 3.18,
                hasHomestead: false
            },
            
            // Category 4: Size & Space
            sizeSpace: {
                bedrooms: 2,
                bathrooms: 2.0,
                halfBaths: 0,
                livingSqFt: 1200,
                totalSqFt: 1200,
                stories: 1,
                lotSizeSqFt: 0,
                lotSizeAcres: 0,
                usableSpaceRatio: 100,
                lotToBuildingRatio: 0,
                sqFtPerBedroom: 600,
                bathroomBedroomRatio: 1.0,
                pricePerBedroom: 274950,
                pricePerBathroom: 274950
            },
            
            // Category 5: Condition & Age
            condition: {
                yearBuilt: 2019,
                propertyAge: 6,
                roofType: "Concrete Tile",
                roofAge: 6,
                roofRemainingLife: 19,
                roofStatus: "Excellent",
                hvacType: "Central A/C w/ Zoning",
                hvacAge: 6,
                hvacRemainingLife: 11,
                hvacStatus: "Good",
                waterHeaterType: "Tankless Gas",
                foundation: "Slab",
                exteriorMaterial: "Concrete Block/Stucco",
                interiorCondition: "Excellent"
            }
        },
        {
            id: "prop-c",
            name: "Property C",
            photo: "https://via.placeholder.com/400x300/16213e/ffffff?text=Property+C",
            address: "2847 Bayshore Gardens",
            city: "Largo",
            state: "FL",
            zip: "33770",
            propertyType: "Single Family",
            mlsNumber: "TB18235103",
            
            // Category 1: SMART Scores
            smartScores: {
                overall: 68,
                overallGrade: "C+",
                value: 65,
                condition: 70,
                location: 54,
                risk: 42,
                investment: 69,
                dataCompleteness: 65,
                ranking: 3
            },
            
            // Category 2: Price & Value
            priceValue: {
                listingPrice: 389000,
                pricePerSqFt: 348,
                listingStatus: "Pending",
                daysOnMarket: 28,
                marketValueEstimate: 395000,
                redfinEstimate: 387500,
                zillowEstimate: 391200,
                assessedValue: 352100,
                medianHomePrice: 425000,
                avgPricePerSqFt: 365,
                priceVsMarket: -6000,
                priceVsMarketPct: -1.5,
                lastSalePrice: 310000,
                lastSaleDate: "2019-09-01",
                totalAppreciation: 25.5,
                annualAppreciationRate: 4.7,
                equityPosition: 85000
            },
            
            // Category 3: Total Cost of Ownership
            costs: {
                annualPropertyTax: 4156,
                propertyTaxRate: 1.07,
                hoaFeeAnnual: 1200,
                cddFeeAnnual: 890,
                insuranceAnnual: 2950,
                totalAnnualCarrying: 9196,
                monthlyCarrying: 766,
                carryingCostPctOfPrice: 2.36,
                hasHomestead: true
            },
            
            // Category 4: Size & Space
            sizeSpace: {
                bedrooms: 4,
                bathrooms: 2.0,
                halfBaths: 1,
                livingSqFt: 1850,
                totalSqFt: 2340,
                stories: 2,
                lotSizeSqFt: 12196,
                lotSizeAcres: 0.28,
                usableSpaceRatio: 79.1,
                lotToBuildingRatio: 5.2,
                sqFtPerBedroom: 463,
                bathroomBedroomRatio: 0.50,
                pricePerBedroom: 97250,
                pricePerBathroom: 194500
            },
            
            // Category 5: Condition & Age
            condition: {
                yearBuilt: 1989,
                propertyAge: 36,
                roofType: "Shingle",
                roofAge: 8,
                roofRemainingLife: 14,
                roofStatus: "Good",
                hvacType: "Central A/C",
                hvacAge: 5,
                hvacRemainingLife: 12,
                hvacStatus: "Good",
                waterHeaterType: "Electric Tank",
                foundation: "Slab",
                exteriorMaterial: "Vinyl Siding",
                interiorCondition: "Good"
            }
        }
    ],
    
    metadata: {
        lastUpdated: new Date().toISOString(),
        dataSource: "John E Desautels & Associates",
        version: "1.0",
        conversationId: "PROPERTY-VIZ-SESSION-001"
    }
};

// Data management functions
function loadTestData() {
    console.log("Test data loaded:", propertyData.properties.length, "properties");
    return propertyData;
}

function clearData() {
    if (confirm("Are you sure you want to clear all property data?")) {
        propertyData.properties = [];
        propertyData.metadata.lastUpdated = new Date().toISOString();
        console.log("All property data cleared");
        location.reload();
    }
}

function exportData() {
    const dataStr = JSON.stringify(propertyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'property-comparison-data.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    propertyData = JSON.parse(event.target.result);
                    alert("Data imported successfully!");
                    location.reload();
                } catch (error) {
                    alert("Error importing data: " + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
}
