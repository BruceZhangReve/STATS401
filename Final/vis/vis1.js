// Load the CSVs and create parallel tag clouds
const files = [
    "../data_prepared/ICLR(Oral)2020.csv", 
    "../data_prepared/ICLR(Oral)2021.csv", 
    "../data_prepared/ICLR(Oral)2022.csv", 
    "../data_prepared/ICLR(Oral)2023.csv", 
    "../data_prepared/ICLR(Oral)2024.csv"
];

// Set dimensions and margins
const width = 1200;
const height = 800;
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const cloudWidth = (width - margin.left - margin.right) / files.length;
const cloudHeight = height - margin.top - margin.bottom;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
const years = ["2020", "2021", "2022", "2023", "2024"];  

// ignore unclassified case
const ignoredWords = new Set(["unclassified"]);  

// Load all CSV files
Promise.all(files.map(file => d3.csv(file)))
    .then(data => {
        data.forEach((dataset, index) => {
            const topics = dataset.map(d => d["Topics"].split(", ")); 

            drawTagCloud(topics, index);
        });
    })
    .catch(error => console.log("Error loading CSVs: ", error));

// Function to draw tag cloud
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
        .rotate(() => (Math.random() > 0.5 ? 0 : 90))
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
