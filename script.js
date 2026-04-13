document.addEventListener('DOMContentLoaded', () => {
    // Input fields
    const costInput = document.getElementById('monthly-cost');
    const leadValueInput = document.getElementById('lead-value');
    const extraSalesInput = document.getElementById('extra-sales');
    const calculateBtn = document.getElementById('calculate-btn');

    // Output elements
    const roiOutput = document.getElementById('roi-percentage');
    const netProfitOutput = document.getElementById('net-profit');
    const annualizedProfitOutput = document.getElementById('annualized-profit');

    // Cards for styling
    const resultCards = document.querySelectorAll('.result-card');

    // Format numbers
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(val);
    };

    const formatPercent = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val / 100);
    };

    // Calculation logic
    const calculate = () => {
        const cost = parseFloat(costInput.value) || 0;
        const leadValue = parseFloat(leadValueInput.value) || 0;
        const extraSales = parseFloat(extraSalesInput.value) || 0;

        // Calculations
        const extraRevenue = leadValue * extraSales;
        const netProfit = extraRevenue - cost;
        
        let roi = 0;
        if (cost > 0) {
            roi = (netProfit / cost) * 100;
        } else if (extraRevenue > 0) {
            roi = 100; // if no cost but there's revenue
        }

        const annualizedProfit = netProfit * 12;

        // Update DOM
        roiOutput.textContent = formatPercent(roi);
        netProfitOutput.textContent = netProfit < 0 ? '-' + formatCurrency(Math.abs(netProfit)) : formatCurrency(Math.abs(netProfit));
        annualizedProfitOutput.textContent = annualizedProfit < 0 ? '-' + formatCurrency(Math.abs(annualizedProfit)) : formatCurrency(Math.abs(annualizedProfit));

        // Apply Color Classes based on profit/loss
        const isPositive = netProfit >= 0;
        resultCards.forEach(card => {
            card.classList.remove('positive', 'negative');
            card.classList.add(isPositive ? 'positive' : 'negative');
        });
        
        const textClass = isPositive ? 'positive-text' : 'negative-text';
        roiOutput.className = 'result-value ' + textClass;
        netProfitOutput.className = 'result-value ' + textClass;
        annualizedProfitOutput.className = 'result-value ' + textClass;
    };

    // Add event listeners
    if(calculateBtn) {
        calculateBtn.addEventListener('click', calculate);
    }
});
