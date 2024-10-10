// Global file paths and dimensions
const files = [
    "./Question 2&3/data_prepared/ICLR(Oral)2020.csv", 
    "./Question 2&3/data_prepared/ICLR(Oral)2021.csv", 
    "./Question 2&3/data_prepared/ICLR(Oral)2022.csv", 
    "./Question 2&3/data_prepared/ICLR(Oral)2023.csv", 
    "./Question 2&3/data_prepared/ICLR(Oral)2024.csv"
];

const width = 1200;
const height = 800;
const margin = { top: 50, right: 30, bottom: 100, left: 50 };

// Visualization 1: Parallel Tag Clouds
function renderVis1() {
    const width = 1200;
    const height = 800;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const cloudWidth = (width - margin.left - margin.right) / files.length;
    const cloudHeight = height - margin.top - margin.bottom;

    const svg = d3.select("#vis1").append("svg")
        .attr("width", width)
        .attr("height", height);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const years = ["2020", "2021", "2022", "2023", "2024"];
    const ignoredWords = new Set(["unclassified"]);

    Promise.all(files.map(file => d3.csv(file)))
        .then(data => {
            data.forEach((dataset, index) => {
                const topics = dataset.map(d => d["Topics"].split(", "));
                drawTagCloud(topics, index);  
            });
        })
        .catch(error => console.log("Error loading CSVs: ", error));

    function drawTagCloud(topics, index) {
        const wordCounts = d3.rollup(
            topics.flatMap(d => d),
            words => words.length,
            word => word.toLowerCase()
        );

        const filteredWordsArray = Array.from(wordCounts, ([word, count]) => ({ text: word, size: count }))
            .filter(d => !ignoredWords.has(d.text));

        const cloudLayout = d3.layout.cloud()
            .size([cloudWidth, cloudHeight])
            .words(filteredWordsArray)
            .padding(5)
            .rotate((d, i) => i % 2 === 0 ? 0 : 90)
            .fontSize(d => Math.sqrt(d.size) * 10)
            .on("end", words => renderCloud(words, index));

        cloudLayout.start();
    }

    function renderCloud(words, index) {
        const xOffset = index * cloudWidth;

        const cloudGroup = svg.append("g")
            .attr("transform", `translate(${xOffset + cloudWidth / 2},${cloudHeight / 2})`);

        cloudGroup.selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => d.size + "px")
            .style("fill", (d, i) => colorScale(i))
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
            .text(d => d.text)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("font-size", d.size * 2 + "px")  
                    .attr("transform", `translate(${d.x},${d.y})rotate(0)`)  
                    .style("fill", "orange");  
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("font-size", d.size + "px")  
                    .attr("transform", `translate(${d.x},${d.y})rotate(${d.rotate})`)  
                    .style("fill", colorScale(d.text)); 
            });

        svg.append("text")
            .attr("x", xOffset + cloudWidth / 2)
            .attr("y", height - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(years[index]);
    }
}


// Visualization 2: Bar Chart
function renderVis2() {
    const svg = d3.select("#vis2").append("svg")
        .attr("width", width)
        .attr("height", height);

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

        chartGroup.append("g").call(d3.axisLeft(y));

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
                    .attr("x", x0(d.word) + x1(d.year) + x1.bandwidth() / 2)
                    .attr("y", y(d.value) - 10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("fill", "black")
                    .text(`${d.word}: ${d.value}`);
            })
            .on("mouseout", function() {
                svg.select("#tooltip").remove();
            });
    }

    window.updateWordCount = function(value) {
        document.getElementById("wordCountDisplay").textContent = value; 
        updateChart(parseInt(value));
    };
}


// Visualization 3: Box Plot with Interaction
function renderVis3() {
    const width = 1200;
    const height = 800;
    const margin = { top: 50, right: 30, bottom: 100, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const years = ["2020", "2021", "2022", "2023", "2024"];

    const svg = d3.select("#vis3").append("svg")
        .attr("width", width)
        .attr("height", height);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let ratingData = [];

    Promise.all(files.map(file => d3.csv(file)))
        .then(data => {
            data.forEach((dataset, yearIndex) => {
                dataset.forEach(d => {
                    if (d["Review_Rating"]) {
                        ratingData.push({
                            year: years[yearIndex],
                            rating: +d["Review_Rating"]  
                        });
                    }
                });
            });

            const dataByYear = d3.groups(ratingData, d => d.year);
            createBoxPlot(dataByYear);
        })
        .catch(error => console.log("Error loading CSVs: ", error));

    function createBoxPlot(dataByYear) {
        const x = d3.scaleBand()
            .domain(years)
            .range([0, chartWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(ratingData, d => d.rating)])
            .range([chartHeight, 0]);

        chartGroup.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x));

        chartGroup.append("g")
            .call(d3.axisLeft(y));

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #d3d3d3")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("visibility", "hidden");

        dataByYear.forEach(([year, data]) => {
            const sortedData = data.map(d => d.rating).sort(d3.ascending);
            const q1 = d3.quantile(sortedData, 0.25);
            const median = d3.quantile(sortedData, 0.5);
            const q3 = d3.quantile(sortedData, 0.75);
            const interQuantileRange = q3 - q1;
            const min = d3.max([d3.min(sortedData), q1 - 1.5 * interQuantileRange]);
            const max = d3.min([d3.max(sortedData), q3 + 1.5 * interQuantileRange]);
            const center = x(year) + x.bandwidth() / 2;

            // 绘制 Box
            chartGroup.append("rect")
                .attr("x", x(year))
                .attr("y", y(q3))
                .attr("width", x.bandwidth())
                .attr("height", y(q1) - y(q3))
                .attr("stroke", "black")
                .style("fill", "#64b")
                .on("mouseover", function(event) {
                    tooltip.style("visibility", "visible")
                        .html(`
                            <strong>Year:</strong> ${year}<br>
                            <strong>Max:</strong> ${max.toFixed(2)}<br>
                            <strong>Median:</strong> ${median.toFixed(2)}<br>
                            <strong>Min:</strong> ${min.toFixed(2)}
                        `);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 20) + "px")
                        .style("left", (event.pageX + 20) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });

            chartGroup.append("line")
                .attr("x1", x(year))
                .attr("x2", x(year) + x.bandwidth())
                .attr("y1", y(median))
                .attr("y2", y(median))
                .attr("stroke", "black");

            chartGroup.append("line")
                .attr("x1", center)
                .attr("x2", center)
                .attr("y1", y(min))
                .attr("y2", y(q1))
                .attr("stroke", "black");

            chartGroup.append("line")
                .attr("x1", center)
                .attr("x2", center)
                .attr("y1", y(max))
                .attr("y2", y(q3))
                .attr("stroke", "black");

            chartGroup.append("line")
                .attr("x1", center - 10)
                .attr("x2", center + 10)
                .attr("y1", y(min))
                .attr("y2", y(min))
                .attr("stroke", "black");

            chartGroup.append("line")
                .attr("x1", center - 10)
                .attr("x2", center + 10)
                .attr("y1", y(max))
                .attr("y2", y(max))
                .attr("stroke", "black");
        });
    }
}



// Visualization 4: Parallel Coordinates with Interaction
function renderVis4() {
    const margin = { top: 30, right: 50, bottom: 10, left: 50 };
    const width = 1400 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#vis4").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("./Question 2&3/data_prepared/vis4.csv").then(function(data) {
        data.forEach(function(d) {
            d.Review_Rating = +d.Review_Rating;
        });

        const weaknessCategories = Array.from(new Set(data.map(d => d.Weakness)));
        const topicsCategories = Array.from(new Set(data.map(d => d.Topics)));

        const y = {
            Weakness: d3.scalePoint()
                .domain(weaknessCategories)
                .range([height, 0])
                .padding(1),

            Topics: d3.scalePoint()
                .domain(topicsCategories)
                .range([height, 0])
                .padding(1),

            Review_Rating: d3.scaleLinear()
                .domain([d3.min(data, d => d.Review_Rating), d3.max(data, d => d.Review_Rating)])
                .range([height, 0])
        };

        const x = d3.scalePoint()
            .range([0, width])
            .domain(["Review_Rating", "Weakness", "Topics"]);

        const color = d3.scaleOrdinal()
            .domain(weaknessCategories)
            .range(d3.schemeCategory10);

        const lines = svg.selectAll("myPath")
            .data(data)
            .join("path")
            .attr("d", function(d) {
                return d3.line()([
                    [x("Review_Rating"), y["Review_Rating"](d.Review_Rating)],
                    [x("Weakness"), y["Weakness"](d.Weakness)],
                    [x("Topics"), y["Topics"](d.Topics)]
                ]);
            })
            .style("fill", "none")
            .style("stroke", d => color(d.Weakness))
            .style("opacity", 0.5)
            .attr("class", "line");

        lines
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .style("stroke-width", "4px")
                    .style("opacity", 1);
                
                lines.filter(function(data) { return data !== d; })
                    .transition().duration(200)
                    .style("opacity", 0.1);
            })
            .on("mouseout", function(event, d) {
                lines.transition().duration(200)
                    .style("stroke-width", "1.5px")
                    .style("opacity", 0.5);
            });

        svg.selectAll("myAxis")
            .data(["Review_Rating", "Weakness", "Topics"]).enter()
            .append("g")
            .attr("transform", d => `translate(${x(d)})`)
            .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(d => d)
            .style("fill", "black");
    });
}

// Initialize all visualizations
renderVis1();
renderVis2();
renderVis3();
renderVis4();