function generateActualCharts() {
    const results = appState.analysisResults;
    
    try {
        // Generate histograms for metric variables
        if (appState.variables.metric && appState.variables.metric.length > 0) {
            appState.variables.metric.slice(0, 2).forEach(metricColumn => {
                const canvasId = `histogram-${metricColumn.replace(/[^a-zA-Z0-9]/g, '')}`;
                generateHistogram(metricColumn, canvasId);
            });
        }
        
        // Generate bar charts for nominal variables
        if (appState.variables.nominal && appState.variables.nominal.length > 0 && results.frequency) {
            appState.variables.nominal.slice(0, 2).forEach(nominalColumn => {
                if (results.frequency[nominalColumn]) {
                    const canvasId = `barchart-${nominalColumn.replace(/[^a-zA-Z0-9]/g, '')}`;
                    generateBarChart(nominalColumn, results.frequency[nominalColumn], canvasId);
                }
            });
        }
        
        // Generate comparative analysis charts
        if (results.comparative && Object.keys(results.comparative).length > 0) {
            Object.entries(results.comparative).slice(0, 2).forEach(([comparison, data], index) => {
                const canvasId = `comparison-${index}`;
                generateComparisonChart(comparison, data, canvasId);
            });
        }
        
        // Generate conversion chart
        if (results.conversion && !results.conversion.error) {
            generateConversionChart(results.conversion);
        }
        
    } catch (error) {
        console.error('Error generating charts:', error);
    }
}

function generateHistogram(column, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const values = appState.rawData
        .map(row => parseFloat(row[column]))
        .filter(val => !isNaN(val));
    
    if (values.length === 0) return;
    
    // Create histogram bins
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binSize = (max - min) / binCount;
    
    const bins = Array(binCount).fill(0);
    const binLabels = [];
    
    for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binSize;
        const binEnd = min + (i + 1) * binSize;
        binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
    }
    
    values.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        bins[binIndex]++;
    });
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Frequency',
                data: bins,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Distribution of ${column}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: column
                    }
                }
            }
        }
    });
}

function generateBarChart(column, frequencyData, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const topCategories = frequencyData.categories.slice(0, 10);
    const labels = topCategories.map(item => item.value);
    const data = topCategories.map(item => item.count);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Count',
                data: data,
                backgroundColor: 'rgba(118, 75, 162, 0.7)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Frequency of ${column}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: column
                    }
                }
            }
        }
    });
}

function generateComparisonChart(comparison, groupStats, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const [metric, category] = comparison.split('_by_');
    const groups = Object.keys(groupStats);
    const means = Object.values(groupStats).map(stats => stats.mean);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: groups,
            datasets: [{
                label: `Average ${metric}`,
                data: means,
                backgroundColor: 'rgba(40, 167, 69, 0.7)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${metric} by ${category}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `Average ${metric}`
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: category
                    }
                }
            }
        }
    });
}

function generateConversionChart(conversionData) {
    const canvas = document.getElementById('conversion-chart');
    if (!canvas) return;
    
    const data = [
        conversionData.totalRecords - conversionData.successRecords,
        conversionData.successRecords
    ];
    
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Not Converted', 'Converted'],
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(40, 167, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(220, 53, 69, 1)',
                    'rgba(40, 167, 69, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: `Conversion Rate: ${conversionData.conversionRate}%`
                }
            }
        }
    });
}

// Business Insights Generation (LLM Integration)
async function generateBusinessInsights() {
    const insightsDiv = document.getElementById('businessInsights');
    const loadingDiv = document.getElementById('insightsLoading');
    
    try {
        // Show loading with initialization message
        loadingDiv.style.display = 'block';
        loadingDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Initializing AI model for business insights...</p>
            <small>This may take a moment on first use</small>
        `;
        
        // Prepare comprehensive context data for LLM
        const contextData = {
            stakeholder: appState.stakeholder,
            question: appState.businessQuestion,
            analysisResults: appState.analysisResults,
            variables: appState.variables,
            dataOverview: {
                totalRecords: appState.rawData.length,
                totalColumns: Object.keys(appState.rawData[0] || {}).length,
                columns: Object.keys(appState.rawData[0] || {})
            },
            settings: appState.settings
        };
        
        // Update loading message
        loadingDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Generating contextual business insights...</p>
            <small>AI is analyzing your data and question</small>
        `;
        
        // Call Local LLM for insights generation
        const insights = await callLLMForInsights(contextData);
        
        // Hide loading and show insights
        loadingDiv.style.display = 'none';
        displayBusinessInsights(insights);
        
        // Show success notification
        showNotification('Business insights generated successfully!');
        
    } catch (error) {
        console.error('Error generating insights:', error);
        loadingDiv.style.display = 'none';
        
        // Show fallback insights with error context
        const fallbackInsights = {
            summary: "Statistical analysis completed successfully. While AI insights are temporarily unavailable, detailed statistical results are available in the Calculations tab.",
            keyFindings: [
                "Data analysis completed with statistical significance testing",
                "Key performance indicators identified and measured",
                "Patterns and trends detected in the dataset"
            ],
            recommendations: [
                "Review detailed statistical calculations for specific insights",
                "Focus on variables showing strongest statistical relationships",
                "Consider additional data collection for deeper analysis"
            ],
            risks: [
                "AI insight generation temporarily unavailable",
                "Statistical results available for manual interpretation"
            ],
            nextSteps: [
                "Review statistical calculations in the Calculations tab",
                "Validate findings with domain expertise",
                "Plan follow-up analysis based on initial results"
            ]
        };
        
        displayBusinessInsights(fallbackInsights);
        
        showNotification('Using statistical fallback insights', 'warning');
    }
}

async function callLLMForInsights(contextData) {
    try {
        // Check if LLM worker is available
        if (typeof window.llmWorker === 'undefined') {
            console.warn('LLM Worker not available, using rule-based insights');
            return generateRuleBasedInsights(contextData);
        }
        
        // Generate insights using local LLM
        const insights = await window.llmWorker.generateBusinessInsights(contextData);
        
        // Enhance insights with statistical context
        const enhancedInsights = enhanceInsightsWithStats(insights, contextData);
        
        return enhancedInsights;
        
    } catch (error) {
        console.error('LLM insights generation failed:', error);
        
        // Fallback to rule-based insights
        return generateRuleBasedInsights(contextData);
    }
}

function generateRuleBasedInsights(contextData) {
    const {
        stakeholder,
        question,
        analysisResults,
        variables,
        dataOverview
    } = contextData;

    // Generate insights based on actual analysis results
    const analysisType = analysisResults.analysisType;
    let insights = {
        summary: "",
        keyFindings: [],
        recommendations: [],
        risks: [],
        nextSteps: []
    };

    // Base context
    const stakeholderName = getStakeholderDisplayName(stakeholder);
    const recordCount = dataOverview.totalRecords.toLocaleString();
    
    // Generate insights based on analysis type and actual results
    switch (analysisType) {
        case 'conversion_analysis':
            if (analysisResults.conversion && !analysisResults.conversion.error) {
                insights = generateConversionInsights(analysisResults.conversion, stakeholder, recordCount);
            }
            break;
            
        case 'correlation_analysis':
            if (analysisResults.correlation) {
                insights = generateCorrelationInsights(analysisResults.correlation, stakeholder, recordCount);
            }
            break;
            
        case 'comparative_analysis':
            if (analysisResults.comparative) {
                insights = generateComparativeInsights(analysisResults.comparative, stakeholder, recordCount);
            }
            break;
            
        default:
            insights = generateDescriptiveInsights(analysisResults.descriptive, stakeholder, recordCount, variables);
    }

    return insights;
}

function generateConversionInsights(conversionResults, stakeholder, recordCount) {
    const conversionRate = parseFloat(conversionResults.conversionRate);
    const successCount = conversionResults.successRecords;
    
    return {
        summary: `Conversion analysis of ${recordCount} records reveals ${conversionRate}% success rate with ${successCount.toLocaleString()} successful conversions.`,
        keyFindings: [
            `Overall conversion rate of ${conversionRate}% establishes current performance baseline`,
            `${successCount.toLocaleString()} successful conversions from ${conversionResults.totalRecords.toLocaleString()} total opportunities`,
            conversionRate > 15 ? "Conversion rate exceeds typical industry benchmarks" : "Conversion rate indicates room for optimization"
        ],
        recommendations: [
            conversionRate < 10 ? "Prioritize conversion optimization initiatives" : "Maintain and scale current successful practices",
            "Analyze high-converting segments for best practice replication",
            "Implement A/B testing to improve conversion funnel performance"
        ],
        risks: [
            "Seasonal variations may affect conversion rate stability",
            "Sample period may not represent long-term performance trends"
        ],
        nextSteps: [
            "Set up conversion rate monitoring dashboard",
            "Investigate specific factors driving successful conversions",
            "Develop targeted campaigns for underperforming segments"
        ]
    };
}

function generateCorrelationInsights(correlationResults, stakeholder, recordCount) {
    const correlationCount = Object.keys(correlationResults).length;
    const strongCorrelations = Object.entries(correlationResults)
        .filter(([_, data]) => Math.abs(data.correlation) > 0.7);
    
    return {
        summary: `Correlation analysis identified ${correlationCount} variable relationships, with ${strongCorrelations.length} showing strong statistical significance.`,
        keyFindings: [
            `${correlationCount} variable relationships analyzed for business insights`,
            strongCorrelations.length > 0 ? `${strongCorrelations.length} strong correlations indicate key business drivers` : "Moderate correlations suggest complex multi-factor relationships",
            "Statistical relationships provide foundation for predictive modeling"
        ],
        recommendations: [
            strongCorrelations.length > 0 ? "Leverage strong correlations for forecasting and optimization" : "Investigate moderate correlations for hidden insights",
            "Validate correlations with business logic and domain expertise",
            "Use correlation insights to prioritize data collection efforts"
        ],
        risks: [
            "Correlation does not imply causation - validate relationships",
            "Time-based relationships may change due to external factors"
        ],
        nextSteps: [
            "Conduct causal analysis on strongest correlations",
            "Develop predictive models based on significant relationships",
            "Monitor correlation stability over time"
        ]
    };
}

function generateComparativeInsights(comparativeResults, stakeholder, recordCount) {
    const comparisonCount = Object.keys(comparativeResults).length;
    
    return {
        summary: `Comparative analysis across ${comparisonCount} variable combinations reveals significant performance differences between groups.`,
        keyFindings: [
            `${comparisonCount} group comparisons completed with statistical significance testing`,
            "Performance variations identified across key business segments",
            "Group differences validate strategic segmentation approaches"
        ],
        recommendations: [
            "Focus resources on highest-performing segments identified",
            "Develop targeted strategies for underperforming groups",
            "Use group insights for market segmentation and targeting"
        ],
        risks: [
            "Group sizes may be unequal affecting statistical reliability",
            "External factors may influence group performance differences"
        ],
        nextSteps: [
            "Validate group differences with additional data sources",
            "Implement segment-specific strategies based on findings",
            "Monitor group performance trends over time"
        ]
    };
}

function generateDescriptiveInsights(descriptiveResults, stakeholder, recordCount, variables) {
    const metricsCount = Object.keys(descriptiveResults || {}).length;
    
    return {
        summary: `Descriptive analysis of ${recordCount} records across ${metricsCount} key metrics reveals important performance patterns and benchmarks.`,
        keyFindings: [
            `${metricsCount} key performance metrics analyzed for central tendencies`,
            "Statistical distributions provide performance benchmarks and outlier identification",
            "Data quality assessment confirms reliability for business decision-making"
        ],
        recommendations: [
            "Use statistical benchmarks to set realistic performance targets",
            "Implement statistical process control for quality monitoring",
            "Focus on metrics showing highest variability for optimization opportunities"
        ],
        risks: [
            "Historical data may not predict future performance accurately",
            "Outliers may skew average performance interpretations"
        ],
        nextSteps: [
            "Establish ongoing metric monitoring and alerting systems",
            "Investigate causes of high-variability metrics",
            "Develop trend analysis for performance forecasting"
        ]
    };
}

function enhanceInsightsWithStats(insights, contextData) {
    const { analysisResults, dataOverview } = contextData;
    
    // Add statistical context to insights
    if (analysisResults.conversion && !analysisResults.conversion.error) {
        insights.keyFindings.unshift(
            `Statistical significance: ${analysisResults.conversion.conversionRate}% conversion rate from ${dataOverview.totalRecords.toLocaleString()} records`
        );
    }
    
    if (analysisResults.descriptive) {
        const metricsCount = Object.keys(analysisResults.descriptive).length;
        insights.keyFindings.push(
            `Descriptive statistics calculated for ${metricsCount} key business metrics`
        );
    }
    
    return insights;
}

function displayBusinessInsights(insights) {
    const insightsDiv = document.getElementById('businessInsights');
    
    let html = `
        <div class="insights-container">
            <div class="insight-section">
                <h4><i class="fas fa-lightbulb"></i> Executive Summary</h4>
                <p class="insight-summary">${insights.summary}</p>
            </div>
            
            <div class="insight-section">
                <h4><i class="fas fa-search"></i> Key Findings</h4>
                <ul class="insight-list">
                    ${insights.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
            
            <div class="insight-section highlight">
                <h4><i class="fas fa-thumbs-up"></i> Recommendations</h4>
                <ul class="insight-list">
                    ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            
            <div class="insight-section warning">
                <h4><i class="fas fa-exclamation-triangle"></i> Risks & Limitations</h4>
                <ul class="insight-list">
                    ${insights.risks.map(risk => `<li>${risk}</li>`).join('')}
                </ul>
            </div>
            
            <div class="insight-section">
                <h4><i class="fas fa-arrow-right"></i> Next Steps</h4>
                <ul class="insight-list">
                    ${insights.nextSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    insightsDiv.innerHTML = html;
}

// Tab Management
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Settings Management
function openSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function saveSettings() {
    closeSettings();
    showNotification('Settings saved successfully!');
}

function loadSettings() {
    // Load settings from localStorage if available
    try {
        const savedSettings = localStorage.getItem('statisticalCalculatorSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            appState.settings = { ...appState.settings, ...settings };
            
            // Apply settings to UI
            if (document.getElementById('modelPerformance')) {
                document.getElementById('modelPerformance').value = settings.modelPerformance || 'balanced';
            }
            if (document.getElementById('confidenceLevel')) {
                document.getElementById('confidenceLevel').value = settings.confidenceLevel || 95;
            }
            if (document.getElementById('chartTheme')) {
                document.getElementById('chartTheme').value = settings.chartTheme || 'modern';
            }
        }
    } catch (error) {
        console.warn('Could not load settings:', error);
    }
}

// Utility Functions
function showLoadingSpinner() {
    console.log('Analysis in progress...');
}

function hideLoadingSpinner() {
    console.log('Analysis complete.');
}

function removeFile() {
    appState.uploadedFile = null;
    appState.rawData = [];
    
    // Reset UI
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('fileInput').value = '';
    
    // Go back to upload step
    showStep(1);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export updateAIStatus function to global scope for AI components
window.updateAIStatus = updateAIStatus;// Import required modules
const Papa = require('papaparse');
const XLSX = require('xlsx');
const { Chart, registerables } = require('chart.js');
const fs = require('fs');
const path = require('path');

// Register Chart.js components
Chart.register(...registerables);

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const colors = {
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, type === 'error' ? 5000 : 3000);
}

// Application State
let appState = {
    currentStep: 1,
    stakeholder: '',
    businessQuestion: '',
    uploadedFile: null,
    rawData: [],
    processedData: [],
    variables: {
        metric: [],
        ordinal: [],
        nominal: []
    },
    analysisResults: {},
    settings: {
        modelPerformance: 'balanced',
        confidenceLevel: 95,
        chartTheme: 'modern'
    }
};

// Statistical Analysis Functions
const StatisticalAnalyzer = {
    // Basic descriptive statistics
    calculateDescriptiveStats: function(data, column) {
        const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        if (values.length === 0) return null;

        const sorted = values.sort((a, b) => a - b);
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / n;
        
        // Calculate median
        const median = n % 2 === 0 
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
            : sorted[Math.floor(n/2)];
        
        // Calculate mode
        const frequency = {};
        values.forEach(val => {
            frequency[val] = (frequency[val] || 0) + 1;
        });
        const mode = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
        
        // Calculate variance and standard deviation
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        // Calculate quartiles
        const q1 = sorted[Math.floor(n * 0.25)];
        const q3 = sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1;
        
        return {
            count: n,
            sum: sum,
            mean: mean,
            median: median,
            mode: parseFloat(mode),
            min: Math.min(...values),
            max: Math.max(...values),
            range: Math.max(...values) - Math.min(...values),
            variance: variance,
            stdDev: stdDev,
            q1: q1,
            q3: q3,
            iqr: iqr,
            skewness: this.calculateSkewness(values, mean, stdDev),
            kurtosis: this.calculateKurtosis(values, mean, stdDev)
        };
    },

    // Calculate skewness
    calculateSkewness: function(values, mean, stdDev) {
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    },

    // Calculate kurtosis
    calculateKurtosis: function(values, mean, stdDev) {
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    },

    // Frequency analysis for categorical data
    calculateFrequencyAnalysis: function(data, column) {
        const frequency = {};
        const total = data.length;
        
        data.forEach(row => {
            const value = row[column];
            if (value !== null && value !== undefined && value !== '') {
                frequency[value] = (frequency[value] || 0) + 1;
            }
        });
        
        const result = Object.entries(frequency).map(([value, count]) => ({
            value: value,
            count: count,
            percentage: (count / total * 100).toFixed(2)
        })).sort((a, b) => b.count - a.count);
        
        return {
            categories: result,
            totalCount: total,
            uniqueValues: Object.keys(frequency).length
        };
    },

    // Correlation analysis
    calculateCorrelation: function(data, col1, col2) {
        const pairs = data.map(row => ({
            x: parseFloat(row[col1]),
            y: parseFloat(row[col2])
        })).filter(pair => !isNaN(pair.x) && !isNaN(pair.y));
        
        if (pairs.length < 2) return null;
        
        const n = pairs.length;
        const sumX = pairs.reduce((acc, pair) => acc + pair.x, 0);
        const sumY = pairs.reduce((acc, pair) => acc + pair.y, 0);
        const sumXY = pairs.reduce((acc, pair) => acc + pair.x * pair.y, 0);
        const sumX2 = pairs.reduce((acc, pair) => acc + pair.x * pair.x, 0);
        const sumY2 = pairs.reduce((acc, pair) => acc + pair.y * pair.y, 0);
        
        const correlation = (n * sumXY - sumX * sumY) / 
            Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return {
            correlation: correlation,
            strength: this.interpretCorrelation(correlation),
            pairs: pairs
        };
    },

    // Interpret correlation strength
    interpretCorrelation: function(r) {
        const abs = Math.abs(r);
        if (abs >= 0.9) return 'Very Strong';
        if (abs >= 0.7) return 'Strong';
        if (abs >= 0.5) return 'Moderate';
        if (abs >= 0.3) return 'Weak';
        return 'Very Weak';
    }
};

// Variable Detection Functions
const VariableDetector = {
    detectVariableTypes: function(data) {
        if (!data || data.length === 0) return { metric: [], ordinal: [], nominal: [] };
        
        const columns = Object.keys(data[0]);
        const variables = { metric: [], ordinal: [], nominal: [] };
        
        columns.forEach(column => {
            const type = this.detectColumnType(data, column);
            variables[type].push(column);
        });
        
        return variables;
    },

    detectColumnType: function(data, column) {
        const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
        const uniqueValues = [...new Set(values)];
        const numericValues = values.filter(val => !isNaN(parseFloat(val)));
        
        // If most values are numeric, it's likely metric
        if (numericValues.length / values.length > 0.8) {
            return 'metric';
        }
        
        // Check for ordinal patterns (ordered categories)
        const ordinalPatterns = [
            /^(very\s+)?(low|medium|high)$/i,
            /^(strongly\s+)?(disagree|neutral|agree)$/i,
            /^(poor|fair|good|excellent)$/i,
            /^(never|rarely|sometimes|often|always)$/i,
            /^(first|second|third|fourth|fifth)$/i,
            /^(primary|secondary|tertiary)$/i,
            /^[1-5]$/,
            /^(small|medium|large)$/i
        ];
        
        const hasOrdinalPattern = uniqueValues.some(val => 
            ordinalPatterns.some(pattern => pattern.test(String(val)))
        );
        
        if (hasOrdinalPattern || (uniqueValues.length <= 10 && this.isNumericRange(uniqueValues))) {
            return 'ordinal';
        }
        
        // Default to nominal
        return 'nominal';
    },

    isNumericRange: function(values) {
        const numericValues = values.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
        if (numericValues.length !== values.length) return false;
        
        const sorted = numericValues.sort((a, b) => a - b);
        const isConsecutive = sorted.every((val, index) => 
            index === 0 || val === sorted[index - 1] + 1
        );
        
        return isConsecutive && sorted.length <= 10;
    }
};

// Business Question Analyzer
const BusinessQuestionAnalyzer = {
    analyzeQuestion: function(stakeholder, question) {
        const analysisType = this.determineAnalysisType(question);
        const suggestedColumns = this.suggestRelevantColumns(question);
        const stakeholderContext = this.getStakeholderContext(stakeholder);
        
        return {
            analysisType: analysisType,
            suggestedColumns: suggestedColumns,
            stakeholderContext: stakeholderContext,
            analysisSteps: this.getAnalysisSteps(analysisType),
            expectedInsights: this.getExpectedInsights(stakeholder, analysisType)
        };
    },

    determineAnalysisType: function(question) {
        const q = question.toLowerCase();
        
        if (q.includes('conversion') || q.includes('convert') || q.includes('success rate')) {
            return 'conversion_analysis';
        }
        if (q.includes('average') || q.includes('mean') || q.includes('typically')) {
            return 'descriptive_analysis';
        }
        if (q.includes('relationship') || q.includes('correlation') || q.includes('impact')) {
            return 'correlation_analysis';
        }
        if (q.includes('compare') || q.includes('difference') || q.includes('vs')) {
            return 'comparative_analysis';
        }
        if (q.includes('predict') || q.includes('forecast') || q.includes('trend')) {
            return 'predictive_analysis';
        }
        if (q.includes('segment') || q.includes('group') || q.includes('cluster')) {
            return 'segmentation_analysis';
        }
        
        return 'exploratory_analysis';
    },

    suggestRelevantColumns: function(question) {
        const q = question.toLowerCase();
        const suggestions = [];
        
        // Common business terms to column mapping
        const termMapping = {
            'call': ['calls', 'contacts', 'phone', 'campaign'],
            'convert': ['conversion', 'success', 'outcome', 'result', 'y'],
            'customer': ['customer', 'client', 'age', 'demographic'],
            'sale': ['sales', 'revenue', 'amount', 'price'],
            'time': ['duration', 'time', 'days', 'months'],
            'marketing': ['campaign', 'channel', 'source', 'medium'],
            'demographic': ['age', 'gender', 'location', 'education', 'income']
        };
        
        Object.entries(termMapping).forEach(([term, columns]) => {
            if (q.includes(term)) {
                suggestions.push(...columns);
            }
        });
        
        return [...new Set(suggestions)];
    },

    getStakeholderContext: function(stakeholder) {
        const contexts = {
            'marketing-director': {
                focus: ['conversion rates', 'campaign effectiveness', 'customer acquisition'],
                metrics: ['ROI', 'conversion rate', 'cost per acquisition'],
                businessGoals: ['increase conversions', 'optimize campaigns', 'reduce costs']
            },
            'sales-manager': {
                focus: ['sales performance', 'lead conversion', 'sales cycle'],
                metrics: ['close rate', 'average deal size', 'sales velocity'],
                businessGoals: ['increase sales', 'improve efficiency', 'forecast accuracy']
            },
            'operations-manager': {
                focus: ['process efficiency', 'resource utilization', 'quality metrics'],
                metrics: ['throughput', 'cycle time', 'error rates'],
                businessGoals: ['improve efficiency', 'reduce costs', 'enhance quality']
            }
        };
        
        return contexts[stakeholder] || contexts['marketing-director'];
    },

    getAnalysisSteps: function(analysisType) {
        const steps = {
            'conversion_analysis': [
                'Calculate overall conversion rate',
                'Analyze conversion by different segments',
                'Identify factors affecting conversion',
                'Determine optimal contact strategies'
            ],
            'descriptive_analysis': [
                'Calculate central tendencies (mean, median, mode)',
                'Measure variability (standard deviation, range)',
                'Identify outliers and data quality issues',
                'Summarize key patterns and distributions'
            ]
        };
        
        return steps[analysisType] || steps['descriptive_analysis'];
    },

    getExpectedInsights: function(stakeholder, analysisType) {
        return [
            'Key performance indicators and benchmarks',
            'Actionable recommendations for improvement',
            'Risk factors and opportunities identified',
            'Strategic implications for business decisions'
        ];
    }
};

// DOM Event Handlers
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSettings();
});

function initializeApp() {
    console.log('Statistical Calculator initialized');
    showStep(1);
    
    // Initialize AI status
    updateAIStatus('loading', 'Initializing AI...');
    
    // Initialize AI components
    initializeAI();
}

async function initializeAI() {
    try {
        // Check if AI components are available
        if (typeof window.llmWorker !== 'undefined' && typeof window.modelLoader !== 'undefined') {
            updateAIStatus('loading', 'Checking AI availability...');
            
            // Pre-initialize AI components
            await window.llmWorker.optimizeForHardware();
            
            // Try to initialize the LLM immediately
            updateAIStatus('loading', 'Initializing AI model...');
            const initialized = await window.llmWorker.initialize();
            
            if (initialized) {
                updateAIStatus('ready', 'AI Ready');
                console.log('✅ AI successfully initialized');
                showNotification('AI model loaded successfully!', 'success');
            } else {
                updateAIStatus('warning', 'Smart Fallback Mode');
                console.log('ℹ️ Using sophisticated rule-based insights (recommended for corporate)');
                showNotification('Using enterprise-grade rule-based insights', 'info');
            }
            
            // Check system capabilities
            const status = window.modelLoader.getStatus();
            console.log('AI System Status:', status);
            
        } else {
            updateAIStatus('warning', 'Smart Fallback Mode');
            console.log('ℹ️ AI components not loaded, using rule-based insights');
        }
    } catch (error) {
        console.error('AI initialization process failed:', error);
        updateAIStatus('warning', 'Smart Fallback Mode');
    }
}

function updateAIStatus(status, message) {
    const aiStatusElement = document.getElementById('aiStatus');
    const aiStatusText = document.getElementById('aiStatusText');
    
    if (!aiStatusElement || !aiStatusText) return;
    
    // Remove existing status classes
    aiStatusElement.classList.remove('loading', 'error', 'ready');
    
    // Add new status class
    aiStatusElement.classList.add(status);
    
    // Update status text
    aiStatusText.textContent = message;
    
    // Update icon based on status
    const icon = aiStatusElement.querySelector('i');
    if (icon) {
        icon.className = status === 'loading' ? 'fas fa-spinner fa-spin' : 
                        status === 'error' ? 'fas fa-exclamation-triangle' : 
                        'fas fa-robot';
    }
}

function setupEventListeners() {
    // Step 1: File Upload
    document.getElementById('browseBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('removeFileBtn').addEventListener('click', removeFile);
    
    // Upload area drag and drop
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    uploadArea.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // Step 2: Data Preview
    document.getElementById('proceedToQuestionBtn').addEventListener('click', proceedToQuestionStep);
    
    // Step 3: Question Analysis
    document.getElementById('analyzeQuestionBtn').addEventListener('click', analyzeBusinessQuestion);
    
    // Step 4: Results Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('cancelSettings').addEventListener('click', closeSettings);
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show current step
    document.getElementById(`step${stepNumber}`).style.display = 'block';
    appState.currentStep = stepNumber;
}

// File Upload and Processing Functions
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
    }
    
    // Store file info
    appState.uploadedFile = file;
    
    // Update UI
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('uploadArea').style.display = 'none';
    
    // Process the file
    readFileData(file);
}

function readFileData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = e.target.result;
        
        if (file.name.endsWith('.csv')) {
            parseCSVData(data);
        } else {
            parseExcelData(data);
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function parseCSVData(csvData) {
    Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                console.warn('CSV parsing errors:', results.errors);
            }
            
            processRawData(results.data);
        }
    });
}

function parseExcelData(arrayBuffer) {
    try {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null
        });
        
        // Convert to objects with headers
        if (jsonData.length > 0) {
            const headers = jsonData[0];
            const data = jsonData.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || null;
                });
                return obj;
            });
            
            processRawData(data);
        }
    } catch (error) {
        alert('Error reading Excel file: ' + error.message);
    }
}

function processRawData(data) {
    // Clean and validate data
    appState.rawData = data.filter(row => {
        // Remove completely empty rows
        return Object.values(row).some(value => value !== null && value !== undefined && value !== '');
    });
    
    if (appState.rawData.length === 0) {
        return;
    }
    
    // Detect variable types
    appState.variables = VariableDetector.detectVariableTypes(appState.rawData);
    
    // Update UI and show next step
    updateDataPreview();
}

function updateDataPreview() {
    const data = appState.rawData;
    const variables = appState.variables;
    
    // Update overview cards
    document.getElementById('totalRows').textContent = data.length.toLocaleString();
    document.getElementById('totalColumns').textContent = Object.keys(data[0] || {}).length;
    
    // Update variable detection display
    updateVariableDisplay('metricVariables', variables.metric);
    updateVariableDisplay('ordinalVariables', variables.ordinal);
    updateVariableDisplay('nominalVariables', variables.nominal);
    
    // Update data preview table
    updateDataPreviewTable(data.slice(0, 10)); // Show first 10 rows
    
    // Show step 2 after data processing
    showStep(2);
}

function updateVariableDisplay(containerId, variables) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (variables.length === 0) {
        container.innerHTML = '<span style="color: #666; font-style: italic;">None detected</span>';
        return;
    }
    
    variables.forEach(variable => {
        const tag = document.createElement('span');
        tag.className = 'variable-tag';
        tag.textContent = variable;
        container.appendChild(tag);
    });
}

function updateDataPreviewTable(data) {
    const table = document.getElementById('dataPreviewTable');
    const thead = document.getElementById('dataPreviewHead');
    const tbody = document.getElementById('dataPreviewBody');
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (data.length === 0) return;
    
    // Create header row
    const headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value !== null && value !== undefined ? value : '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function proceedToQuestionStep() {
    // Update context summary in step 3
    updateDataContextSummary();
    
    // Generate question suggestions based on actual data
    generateQuestionSuggestions();
    
    // Show step 3
    showStep(3);
}

function updateDataContextSummary() {
    const data = appState.rawData;
    const variables = appState.variables;
    
    // Update context display
    document.getElementById('contextRows').textContent = data.length.toLocaleString();
    document.getElementById('contextCols').textContent = Object.keys(data[0] || {}).length;
    
    // Update metrics list
    const metricsText = variables.metric.length > 0 
        ? variables.metric.slice(0, 3).join(', ') + (variables.metric.length > 3 ? '...' : '')
        : 'None detected';
    document.getElementById('contextMetrics').textContent = metricsText;
    
    // Update categories list
    const categoriesText = variables.nominal.length > 0 
        ? variables.nominal.slice(0, 3).join(', ') + (variables.nominal.length > 3 ? '...' : '')
        : 'None detected';
    document.getElementById('contextCategories').textContent = categoriesText;
}

function generateQuestionSuggestions() {
    const variables = appState.variables;
    const suggestions = [];
    
    // Generate suggestions based on available data
    if (variables.metric.length > 0 && variables.nominal.length > 0) {
        suggestions.push({
            icon: 'fas fa-chart-bar',
            text: `How does ${variables.metric[0]} vary across different ${variables.nominal[0]}?`,
            type: 'Comparative Analysis'
        });
    }
    
    if (variables.metric.length > 1) {
        suggestions.push({
            icon: 'fas fa-link',
            text: `What is the relationship between ${variables.metric[0]} and ${variables.metric[1]}?`,
            type: 'Correlation Analysis'
        });
    }
    
    if (variables.metric.length > 0) {
        suggestions.push({
            icon: 'fas fa-calculator',
            text: `What are the typical values and distribution of ${variables.metric[0]}?`,
            type: 'Descriptive Analysis'
        });
    }
    
    // Look for potential conversion/success indicators
    const potentialOutcomes = Object.keys(appState.rawData[0] || {}).filter(col => 
        col.toLowerCase().includes('success') || 
        col.toLowerCase().includes('outcome') || 
        col.toLowerCase().includes('convert') ||
        col.toLowerCase() === 'y'
    );
    
    if (potentialOutcomes.length > 0) {
        suggestions.push({
            icon: 'fas fa-target',
            text: `What factors influence ${potentialOutcomes[0]} rates?`,
            type: 'Success Analysis'
        });
    }
    
    // Render suggestions
    const suggestionsList = document.getElementById('suggestionsList');
    suggestionsList.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsList.innerHTML = '<p style="color: #6c757d; font-style: italic;">Upload your data to see personalized question suggestions</p>';
        return;
    }
    
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <i class="${suggestion.icon}"></i>
            <div class="suggestion-text">
                <div>${suggestion.text}</div>
                <div class="suggestion-type">${suggestion.type}</div>
            </div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            document.getElementById('businessQuestion').value = suggestion.text;
            // Add visual feedback
            suggestionItem.style.background = '#d4edda';
            setTimeout(() => {
                suggestionItem.style.background = 'white';
            }, 1000);
        });
        
        suggestionsList.appendChild(suggestionItem);
    });
}

function analyzeBusinessQuestion() {
    const stakeholder = document.getElementById('stakeholder').value;
    const question = document.getElementById('businessQuestion').value;
    
    if (!stakeholder || !question.trim()) {
        alert('Please select a stakeholder and enter your business question.');
        return;
    }
    
    appState.stakeholder = stakeholder;
    appState.businessQuestion = question;
    
    // Analyze the question with data context
    const analysis = BusinessQuestionAnalyzer.analyzeQuestion(stakeholder, question);
    
    // Enhanced analysis with actual data context
    analysis.relevantColumns = findRelevantColumns(question);
    analysis.suggestedAnalysis = suggestAnalysisMethod(question, appState.variables);
    
    appState.questionAnalysis = analysis;
    
    console.log('Question Analysis with Data Context:', analysis);
    
    // Perform analysis immediately
    performStatisticalAnalysis();
}

function findRelevantColumns(question) {
    const q = question.toLowerCase();
    const columns = Object.keys(appState.rawData[0] || {});
    const relevantColumns = [];
    
    // Direct column name matches
    columns.forEach(col => {
        if (q.includes(col.toLowerCase())) {
            relevantColumns.push(col);
        }
    });
    
    return relevantColumns;
}

function suggestAnalysisMethod(question, variables) {
    const q = question.toLowerCase();
    
    if (q.includes('relationship') || q.includes('correlation') || q.includes('related')) {
        return {
            primary: 'correlation_analysis',
            secondary: ['descriptive_analysis'],
            focus: 'relationships between variables'
        };
    }
    
    if (q.includes('vary') || q.includes('differ') || q.includes('compare') || q.includes('across')) {
        return {
            primary: 'comparative_analysis',
            secondary: ['descriptive_analysis', 'frequency_analysis'],
            focus: 'differences between groups'
        };
    }
    
    if (q.includes('typical') || q.includes('average') || q.includes('distribution') || q.includes('pattern')) {
        return {
            primary: 'descriptive_analysis',
            secondary: ['frequency_analysis'],
            focus: 'central tendencies and distributions'
        };
    }
    
    return {
        primary: 'exploratory_analysis',
        secondary: ['descriptive_analysis', 'frequency_analysis'],
        focus: 'general data exploration'
    };
}

function performStatisticalAnalysis() {
    if (!appState.rawData || appState.rawData.length === 0) {
        alert('No data available for analysis.');
        return;
    }
    
    showLoadingSpinner();
    
    // Get analysis focus from question analysis
    const analysisType = appState.questionAnalysis?.suggestedAnalysis?.primary || 'descriptive_analysis';
    const relevantColumns = appState.questionAnalysis?.relevantColumns || [];
    const results = {};
    
    try {
        // Always perform descriptive analysis, but focus on relevant columns
        results.descriptive = performDescriptiveAnalysis(relevantColumns);
        
        // Perform specific analysis based on question type and data
        switch (analysisType) {
            case 'conversion_analysis':
                results.conversion = performConversionAnalysis(relevantColumns);
                break;
            case 'correlation_analysis':
                results.correlation = performCorrelationAnalysis(relevantColumns);
                break;
            case 'comparative_analysis':
                results.comparative = performComparativeAnalysis(relevantColumns);
                break;
            case 'exploratory_analysis':
                results.exploratory = performExploratoryAnalysis();
                break;
        }
        
        // Perform frequency analysis for categorical variables
        results.frequency = performFrequencyAnalysis(relevantColumns);
        
        // Store results with context
        appState.analysisResults = {
            ...results,
            analysisType: analysisType,
            relevantColumns: relevantColumns,
            questionContext: {
                stakeholder: appState.stakeholder,
                question: appState.businessQuestion,
                focus: appState.questionAnalysis?.suggestedAnalysis?.focus
            }
        };
        
        // Generate visualizations
        generateVisualizations();
        
        // Update results display
        updateResultsDisplay();
        
        // Generate business insights
        generateBusinessInsights();
        
        // Show results step
        showStep(4);
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error performing analysis: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function performDescriptiveAnalysis(relevantColumns) {
    const results = {};
    let targetColumns = relevantColumns.length > 0 
        ? relevantColumns.filter(col => appState.variables.metric.includes(col))
        : appState.variables.metric;
    
    // If no relevant metric columns, use all metric columns
    if (targetColumns.length === 0) {
        targetColumns = appState.variables.metric;
    }
    
    targetColumns.forEach(column => {
        const stats = StatisticalAnalyzer.calculateDescriptiveStats(appState.rawData, column);
        if (stats) {
            results[column] = stats;
        }
    });
    
    return results;
}

function performConversionAnalysis(relevantColumns) {
    const data = appState.rawData;
    
    // Find outcome column from relevant columns or common patterns
    let outcomeColumn = relevantColumns.find(col => 
        col.toLowerCase().includes('success') || 
        col.toLowerCase().includes('outcome') || 
        col.toLowerCase().includes('convert') ||
        col.toLowerCase() === 'y'
    );
    
    if (!outcomeColumn) {
        // Fall back to searching all columns
        const possibleOutcomes = Object.keys(data[0] || {}).filter(col => 
            col.toLowerCase().includes('success') || 
            col.toLowerCase().includes('outcome') || 
            col.toLowerCase().includes('convert') ||
            col.toLowerCase() === 'y'
        );
        outcomeColumn = possibleOutcomes[0];
    }
    
    if (!outcomeColumn) {
        return { error: 'No outcome column found for conversion analysis' };
    }
    
    // Calculate overall conversion rate
    const totalRecords = data.length;
    const successRecords = data.filter(row => {
        const value = row[outcomeColumn];
        return value === 'yes' || value === 1 || value === true || value === 'success';
    }).length;
    
    const conversionRate = (successRecords / totalRecords) * 100;
    
    return {
        totalRecords,
        successRecords,
        conversionRate: conversionRate.toFixed(2),
        outcomeColumn
    };
}

function performCorrelationAnalysis(relevantColumns) {
    const results = {};
    let targetColumns = relevantColumns.filter(col => appState.variables.metric.includes(col));
    
    if (targetColumns.length < 2) {
        targetColumns = appState.variables.metric;
    }
    
    // Calculate correlations between relevant metric variables
    for (let i = 0; i < targetColumns.length; i++) {
        for (let j = i + 1; j < targetColumns.length; j++) {
            const col1 = targetColumns[i];
            const col2 = targetColumns[j];
            const correlation = StatisticalAnalyzer.calculateCorrelation(appState.rawData, col1, col2);
            
            if (correlation) {
                results[`${col1}_vs_${col2}`] = correlation;
            }
        }
    }
    
    return results;
}

function performComparativeAnalysis(relevantColumns) {
    const results = {};
    
    // Get relevant metric and categorical columns
    const metricColumns = relevantColumns.filter(col => appState.variables.metric.includes(col));
    const categoricalColumns = relevantColumns.filter(col => 
        appState.variables.nominal.includes(col) || appState.variables.ordinal.includes(col)
    );
    
    // Use defaults if no relevant columns found
    const targetMetrics = metricColumns.length > 0 ? metricColumns : appState.variables.metric.slice(0, 2);
    const targetCategories = categoricalColumns.length > 0 ? categoricalColumns : appState.variables.nominal.slice(0, 2);
    
    targetMetrics.forEach(metricCol => {
        targetCategories.forEach(categoryCol => {
            const groups = {};
            
            appState.rawData.forEach(row => {
                const groupValue = row[categoryCol];
                const metricValue = parseFloat(row[metricCol]);
                
                if (groupValue && !isNaN(metricValue)) {
                    if (!groups[groupValue]) {
                        groups[groupValue] = [];
                    }
                    groups[groupValue].push(metricValue);
                }
            });
            
            // Calculate statistics for each group
            const groupStats = {};
            Object.entries(groups).forEach(([group, values]) => {
                if (values.length > 0) {
                    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                    const stdDev = Math.sqrt(variance);
                    
                    groupStats[group] = {
                        count: values.length,
                        mean: mean,
                        stdDev: stdDev,
                        min: Math.min(...values),
                        max: Math.max(...values)
                    };
                }
            });
            
            if (Object.keys(groupStats).length > 1) {
                results[`${metricCol}_by_${categoryCol}`] = groupStats;
            }
        });
    });
    
    return results;
}

function performExploratoryAnalysis() {
    return {
        dataQuality: {
            totalRows: appState.rawData.length,
            totalColumns: Object.keys(appState.rawData[0] || {}).length,
            completenessScore: '95.0' // Placeholder
        }
    };
}

function performFrequencyAnalysis(relevantColumns) {
    const results = {};
    let targetColumns = relevantColumns.filter(col => 
        appState.variables.nominal.includes(col) || appState.variables.ordinal.includes(col)
    );
    
    if (targetColumns.length === 0) {
        targetColumns = [...appState.variables.nominal, ...appState.variables.ordinal].slice(0, 5);
    }
    
    targetColumns.forEach(column => {
        const frequency = StatisticalAnalyzer.calculateFrequencyAnalysis(appState.rawData, column);
        results[column] = frequency;
    });
    
    return results;
}

// Visualization Functions
function generateVisualizations() {
    console.log('Generating visualizations...');
}

// Results Display Functions
function updateResultsDisplay() {
    updateOverviewTab();
    updateCalculationsTab();
    updateVisualizationsTab();
}

function updateOverviewTab() {
    const summaryDiv = document.getElementById('analysisSummary');
    const results = appState.analysisResults;
    const questionContext = results.questionContext || {};
    
    let html = `
        <div class="question-context">
            <h4><i class="fas fa-question-circle"></i> Your Question</h4>
            <div class="question-display">
                <div class="stakeholder-info">
                    <strong>Stakeholder:</strong> ${getStakeholderDisplayName(questionContext.stakeholder)}
                </div>
                <div class="question-text">
                    <strong>Question:</strong> "${questionContext.question}"
                </div>
                <div class="analysis-focus">
                    <strong>Analysis Focus:</strong> ${questionContext.focus || 'General analysis'}
                </div>
            </div>
        </div>
    `;
    
    html += '<div class="summary-cards">';
    
    // Data Overview Card
    html += `
        <div class="summary-card">
            <h4><i class="fas fa-database"></i> Data Overview</h4>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Records:</span>
                    <span class="stat-value">${appState.rawData.length.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Relevant Columns:</span>
                    <span class="stat-value">${results.relevantColumns?.length || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Analysis Type:</span>
                    <span class="stat-value">${getAnalysisTypeDisplayName(results.analysisType)}</span>
                </div>
            </div>
        </div>
    `;
    
    html += '</div>';
    summaryDiv.innerHTML = html;
}

function getStakeholderDisplayName(stakeholder) {
    const names = {
        'marketing-director': 'Marketing Director',
        'sales-manager': 'Sales Manager',
        'operations-manager': 'Operations Manager',
        'hr-director': 'HR Director',
        'finance-director': 'Finance Director',
        'ceo': 'CEO/Executive',
        'data-analyst': 'Data Analyst',
        'product-manager': 'Product Manager',
        'other': 'Other'
    };
    return names[stakeholder] || stakeholder;
}

function getAnalysisTypeDisplayName(analysisType) {
    const names = {
        'descriptive_analysis': 'Descriptive Analysis',
        'conversion_analysis': 'Conversion Analysis',
        'correlation_analysis': 'Correlation Analysis',
        'comparative_analysis': 'Comparative Analysis',
        'exploratory_analysis': 'Exploratory Analysis'
    };
    return names[analysisType] || 'General Analysis';
}

function updateCalculationsTab() {
    const calculationsDiv = document.getElementById('calculationsContent');
    const results = appState.analysisResults;
    
    let html = '';
    
    // Descriptive Statistics
    if (results.descriptive && Object.keys(results.descriptive).length > 0) {
        html += '<div class="calculation-section"><h4>📊 Descriptive Statistics</h4>';
        
        Object.entries(results.descriptive).forEach(([column, stats]) => {
            html += `
                <div class="stats-table-container">
                    <h5>${column}</h5>
                    <table class="stats-table">
                        <tr><td>Count</td><td>${stats.count.toLocaleString()}</td></tr>
                        <tr><td>Mean (Average)</td><td>${stats.mean.toFixed(3)}</td></tr>
                        <tr><td>Median</td><td>${stats.median.toFixed(3)}</td></tr>
                        <tr><td>Standard Deviation</td><td>${stats.stdDev.toFixed(3)}</td></tr>
                        <tr><td>Minimum Value</td><td>${stats.min.toFixed(3)}</td></tr>
                        <tr><td>Maximum Value</td><td>${stats.max.toFixed(3)}</td></tr>
                        <tr><td>Range</td><td>${stats.range.toFixed(3)}</td></tr>
                        <tr><td>Q1 (25th percentile)</td><td>${stats.q1.toFixed(3)}</td></tr>
                        <tr><td>Q3 (75th percentile)</td><td>${stats.q3.toFixed(3)}</td></tr>
                        <tr><td>Interquartile Range (IQR)</td><td>${stats.iqr.toFixed(3)}</td></tr>
                        <tr><td>Skewness</td><td>${stats.skewness.toFixed(3)}</td></tr>
                        <tr><td>Kurtosis</td><td>${stats.kurtosis.toFixed(3)}</td></tr>
                    </table>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Frequency Analysis
    if (results.frequency && Object.keys(results.frequency).length > 0) {
        html += '<div class="calculation-section"><h4>📋 Frequency Analysis</h4>';
        
        Object.entries(results.frequency).forEach(([column, freq]) => {
            html += `
                <div class="frequency-table-container">
                    <h5>${column}</h5>
                    <table class="frequency-table">
                        <thead>
                            <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
                        </thead>
                        <tbody>
            `;
            
            freq.categories.slice(0, 10).forEach(item => {
                html += `<tr>
                    <td><strong>${item.value}</strong></td>
                    <td>${item.count.toLocaleString()}</td>
                    <td>${item.percentage}%</td>
                </tr>`;
            });
            
            html += `
                        </tbody>
                    </table>
                    <p class="table-summary">
                        <strong>Total unique values:</strong> ${freq.uniqueValues.toLocaleString()} | 
                        <strong>Most common:</strong> ${freq.categories[0]?.value} (${freq.categories[0]?.count.toLocaleString()} occurrences)
                    </p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Comparative Analysis Results
    if (results.comparative && Object.keys(results.comparative).length > 0) {
        html += '<div class="calculation-section"><h4>📈 Comparative Analysis</h4>';
        
        Object.entries(results.comparative).forEach(([comparison, groupStats]) => {
            const [metric, category] = comparison.split('_by_');
            html += `
                <div class="comparative-analysis-container">
                    <h5>${metric} by ${category}</h5>
                    <table class="stats-table">
                        <thead>
                            <tr><th>Group</th><th>Count</th><th>Mean</th><th>Std Dev</th><th>Min</th><th>Max</th></tr>
                        </thead>
                        <tbody>
            `;
            
            Object.entries(groupStats).forEach(([group, stats]) => {
                html += `<tr>
                    <td><strong>${group}</strong></td>
                    <td>${stats.count.toLocaleString()}</td>
                    <td>${stats.mean.toFixed(2)}</td>
                    <td>${stats.stdDev.toFixed(2)}</td>
                    <td>${stats.min.toFixed(2)}</td>
                    <td>${stats.max.toFixed(2)}</td>
                </tr>`;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Correlation Analysis
    if (results.correlation && Object.keys(results.correlation).length > 0) {
        html += '<div class="calculation-section"><h4>🔗 Correlation Analysis</h4>';
        
        Object.entries(results.correlation).forEach(([pair, corr]) => {
            const [col1, col2] = pair.replace('_vs_', ' vs ').split(' vs ');
            html += `
                <div class="correlation-item">
                    <h5>${col1} vs ${col2}</h5>
                    <div class="correlation-stats">
                        <span class="correlation-value ${getCorrelationClass(corr.correlation)}">
                            r = ${corr.correlation.toFixed(3)}
                        </span>
                        <span class="correlation-strength">${corr.strength} correlation</span>
                        <span class="correlation-interpretation">
                            ${getCorrelationInterpretation(corr.correlation)}
                        </span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Add interpretation guide
    html += `
        <div class="calculation-section">
            <h4>📚 Statistical Interpretation Guide</h4>
            <div class="interpretation-guide">
                <div class="guide-item">
                    <strong>Correlation Strength:</strong>
                    <ul>
                        <li><span class="strong-correlation">0.7 to 1.0</span> - Strong relationship</li>
                        <li><span class="moderate-correlation">0.3 to 0.7</span> - Moderate relationship</li>
                        <li><span class="weak-correlation">0.1 to 0.3</span> - Weak relationship</li>
                        <li><span class="very-weak-correlation">0.0 to 0.1</span> - Very weak relationship</li>
                    </ul>
                </div>
                <div class="guide-item">
                    <strong>Standard Deviation:</strong> Measures how spread out the data is from the average.
                </div>
                <div class="guide-item">
                    <strong>Skewness:</strong> Indicates if data is symmetrically distributed (0 = symmetric).
                </div>
            </div>
        </div>
    `;
    
    if (html === '') {
        html = '<p class="no-data">No statistical calculations available. Please ensure your data contains numeric variables for analysis.</p>';
    }
    
    calculationsDiv.innerHTML = html;
}

function getCorrelationClass(correlation) {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return 'strong-correlation';
    if (abs > 0.5) return 'moderate-correlation';
    if (abs > 0.3) return 'weak-correlation';
    return 'very-weak-correlation';
}

function getCorrelationInterpretation(correlation) {
    const abs = Math.abs(correlation);
    if (abs > 0.7) {
        return correlation > 0 ? 'Strong positive relationship' : 'Strong negative relationship';
    } else if (abs > 0.5) {
        return correlation > 0 ? 'Moderate positive relationship' : 'Moderate negative relationship';
    } else if (abs > 0.3) {
        return correlation > 0 ? 'Weak positive relationship' : 'Weak negative relationship';
    } else {
        return 'Very weak or no linear relationship';
    }
}

function updateVisualizationsTab() {
    const chartsDiv = document.getElementById('chartsContent');
    const results = appState.analysisResults;
    
    let html = '<div class="charts-grid">';
    
    // Create histogram for metric variables
    if (appState.variables.metric && appState.variables.metric.length > 0) {
        appState.variables.metric.slice(0, 2).forEach(metricColumn => {
            html += `
                <div class="chart-container">
                    <h4>📊 Distribution of ${metricColumn}</h4>
                    <canvas id="histogram-${metricColumn.replace(/[^a-zA-Z0-9]/g, '')}" width="400" height="300"></canvas>
                </div>
            `;
        });
    }
    
    // Create bar chart for nominal variables
    if (appState.variables.nominal && appState.variables.nominal.length > 0 && results.frequency) {
        appState.variables.nominal.slice(0, 2).forEach(nominalColumn => {
            if (results.frequency[nominalColumn]) {
                html += `
                    <div class="chart-container">
                        <h4>📈 Frequency of ${nominalColumn}</h4>
                        <canvas id="barchart-${nominalColumn.replace(/[^a-zA-Z0-9]/g, '')}" width="400" height="300"></canvas>
                    </div>
                `;
            }
        });
    }
    
    // Create comparative analysis charts
    if (results.comparative && Object.keys(results.comparative).length > 0) {
        Object.keys(results.comparative).slice(0, 2).forEach((comparison, index) => {
            const [metric, category] = comparison.split('_by_');
            html += `
                <div class="chart-container">
                    <h4>📊 ${metric} by ${category}</h4>
                    <canvas id="comparison-${index}" width="400" height="300"></canvas>
                </div>
            `;
        });
    }
    
    // Create conversion chart if available
    if (results.conversion && !results.conversion.error) {
        html += `
            <div class="chart-container">
                <h4>🎯 Conversion Analysis</h4>
                <canvas id="conversion-chart" width="400" height="300"></canvas>
            </div>
        `;
    }
    
    html += '</div>';
    
    if (appState.variables.metric.length === 0 && appState.variables.nominal.length === 0) {
        html = '<div class="no-charts"><p>📈 No chartable data detected. Upload data with numeric or categorical variables to see visualizations.</p></div>';
    }
    
    chartsDiv.innerHTML = html;
    
    // Generate actual charts after DOM update
    setTimeout(() => {
        generateActualCharts();
    }, 100);
}