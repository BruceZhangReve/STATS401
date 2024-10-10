const margin = {top: 30, right: 50, bottom: 10, left: 50},
  width = 1400 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("../data_prepared/vis4.csv").then(function(data) {

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
