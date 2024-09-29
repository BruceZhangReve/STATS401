const files = [
    "../data_prepared/ICLR(Oral)2020.csv", 
    "../data_prepared/ICLR(Oral)2021.csv", 
    "../data_prepared/ICLR(Oral)2022.csv", 
    "../data_prepared/ICLR(Oral)2023.csv", 
    "../data_prepared/ICLR(Oral)2024.csv"
];

const width = 1200;
const height = 800;
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

const margin = { top: 50, right: 30, bottom: 100, left: 50 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
const years = ["2020", "2021", "2022", "2023", "2024"];


const ignoredWords = new Set(["unclassified"]);


const chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let allWordsArray = [];  


Promise.all(files.map(file => d3.csv(file)))
    .then(data => {
        const allWords = new Map();

        data.forEach((dataset, yearIndex) => {
            dataset.forEach(d => {
                const topics = d["Topics"].split(", ");
                topics.forEach(topic => {
                    const word = topic.toLowerCase();
                    if (!ignoredWords.has(word)) {  
                        if (!allWords.has(word)) {
                            allWords.set(word, { word: word });
                        }
                        allWords.get(word)[years[yearIndex]] = (allWords.get(word)[years[yearIndex]] || 0) + 1;
                    }
                });
            });
        });

        allWordsArray = Array.from(allWords.values());

        allWordsArray.sort((a, b) => d3.sum(years, y => b[y] || 0) - d3.sum(years, y => a[y] || 0));

        updateChart(10);  
    })
    .catch(error => console.log("Error loading CSVs: ", error));

function updateChart(wordCount) {

    chartGroup.selectAll("*").remove();

    const topWords = allWordsArray.slice(0, wordCount);

    const x0 = d3.scaleBand()
        .domain(topWords.map(d => d.word))
        .range([0, chartWidth])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(years)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topWords, d => d3.max(years, y => d[y] || 0))])
        .range([chartHeight, 0]);

    chartGroup.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x0)
            .tickFormat(function(d) {
                return d.length > 10 ? d.slice(0, 10) + "..." : d; 
            }))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-40)");


    chartGroup.append("g")
        .call(d3.axisLeft(y));

    const barGroups = chartGroup.selectAll("g.bar-group")
        .data(topWords)
        .enter().append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${x0(d.word)},0)`);

    barGroups.selectAll("rect")
        .data(d => years.map(year => ({ year: year, value: d[year] || 0, word: d.word })))
        .enter().append("rect")
        .attr("x", d => x1(d.year))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => chartHeight - y(d.value))
        .attr("fill", d => colorScale(d.year))
        .on("mouseover", function(event, d) {
            const tooltip = svg.append("text")
                .attr("id", "tooltip")
                .attr("x", event.pageX - margin.left)
                .attr("y", event.pageY - margin.top - 20)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("background", "lightgray")
                .text(d.word);
        })
        .on("mouseout", function() {
            svg.select("#tooltip").remove();
        });
}


function updateWordCount(value) {
    document.getElementById("wordCountDisplay").textContent = value;  
    updateChart(parseInt(value));  
}
