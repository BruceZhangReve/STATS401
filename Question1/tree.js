var svg = d3.select("#my_dataviz")
    .append("svg")
    .style("border", "1px solid black")
    .attr("width", 400)
    .attr("height", 400);

var g = svg.append("g")
    .attr("transform", "translate(0, 20)");

var nodes = [
    { id: 1, name: "Premise 1", x: 100, y: 100 },
    { id: 2, name: "Premise 2", x: 300, y: 100 },
    { id: 3, name: "Conclusion", x: 200, y: 300 }
];

var links = [
    { source: nodes[0], target: nodes[2] },
    { source: nodes[1], target: nodes[2] }
];

links.forEach(function(linkData) {
    g.append("path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2)
        .attr("d", d3.linkVertical()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })(linkData));
});

nodes.forEach(function(nodeData) {
    g.append("circle")
        .attr("r", 10)
        .attr("fill", "#69b3a2")
        .attr("cx", nodeData.x)
        .attr("cy", nodeData.y)
        .on("mouseover", function() {
            if (nodeData.id === 1) { 
                document.querySelector(".premise1").style.color = "red";
            }
            if (nodeData.id === 2) { 
                document.querySelector(".premise2").style.color = "red";
            }
            if (nodeData.id === 3) { 
                document.querySelector(".conclusion").style.color = "red";
            }
        })
        .on("mouseout", function() {
            document.querySelector(".premise1").style.color = "black";
            document.querySelector(".premise2").style.color = "black";
            document.querySelector(".conclusion").style.color = "black";
        });

    g.append("text")
        .attr("class", "node-label")
        .attr("x", nodeData.x + 15)
        .attr("y", nodeData.y + 5)
        .text(nodeData.name);
});
