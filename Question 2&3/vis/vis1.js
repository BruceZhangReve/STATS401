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

// Ignore unclassified case
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
    // Count word frequency
    const wordCounts = d3.rollup(
        topics.flatMap(d => d),
        words => words.length,
        word => word.toLowerCase()
    );

    const filteredWordsArray = Array.from(wordCounts, ([word, count]) => ({ text: word, size: count }))
        .filter(d => !ignoredWords.has(d.text));

    const maxFontSize = 50; // Cap the maximum font size

    // Create word cloud layout
    const cloudLayout = d3.layout.cloud()
        .size([cloudWidth * 1.1, cloudHeight * 1.1])  // Increased layout size to avoid word cuts
        .words(filteredWordsArray)
        .padding(10)  // Increase padding to reduce word overlaps
        .rotate(() => (Math.random() > 0.5 ? 0 : 90))  // Adjust rotation for less overlap
        .fontSize(d => Math.min(Math.sqrt(d.size) * 10, maxFontSize))  // Adjust font size with a cap
        .on("end", words => renderCloud(words, index));

    cloudLayout.start();
}

function renderCloud(words, index) {
    const xOffset = index * cloudWidth;

    // Create group for each word cloud
    const cloudGroup = svg.append("g")
        .attr("transform", `translate(${xOffset + cloudWidth / 2},${cloudHeight / 2})`);

    // Append text for each word
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
                .style("font-size", d.size * 2 + "px")  // Enlarge on hover
                .attr("transform", `translate(${d.x},${d.y})rotate(0)`)  // Rotate back to 0 on hover
                .style("fill", "orange");  // Change color on hover
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("font-size", d.size + "px")  // Reset size after hover
                .attr("transform", `translate(${d.x},${d.y})rotate(${d.rotate})`)  // Reset rotation
                .style("fill", colorScale(d.text));  // Reset color
        });

    // Append year label
    svg.append("text")
        .attr("x", xOffset + cloudWidth / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(years[index]);
}
