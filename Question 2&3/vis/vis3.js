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


    dataByYear.forEach(([year, data]) => {

        const sortedData = data.map(d => d.rating).sort(d3.ascending);
        const q1 = d3.quantile(sortedData, 0.25);
        const median = d3.quantile(sortedData, 0.5);
        const q3 = d3.quantile(sortedData, 0.75);
        const interQuantileRange = q3 - q1;
        const min = d3.max([d3.min(sortedData), q1 - 1.5 * interQuantileRange]);
        const max = d3.min([d3.max(sortedData), q3 + 1.5 * interQuantileRange]);

        const center = x(year) + x.bandwidth() / 2;  


        chartGroup.append("rect")
            .attr("x", x(year))
            .attr("y", y(q3))
            .attr("width", x.bandwidth())
            .attr("height", y(q1) - y(q3))
            .attr("stroke", "black")
            .style("fill", "#69b3a2");

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
