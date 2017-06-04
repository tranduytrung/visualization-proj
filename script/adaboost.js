// custom variables
var margin = {top: 20, right: 20, bottom: 60, left: 60};
var width = 950;
var height = 600;
var speed = 50;
var datapoints;
var iterators;
var states = {"start": -1, "finished": -2};
var current_state = states.start;
var timer;
var svg;

data = {
    "datapoints": [
                {"x": 5, "y": 2, "label": "red"},
                {"x": 3, "y": 1, "label": "red"},
                {"x": 8, "y": 2.5, "label": "red"},
                {"x": 2, "y": 2, "label": "red"},
                {"x": 1, "y": 2, "label": "blue"},
                {"x": 10, "y": 3, "label": "blue"},
                {"x": 15, "y": 7, "label": "blue"},
                {"x": 9, "y": 4, "label": "blue"},
    ],
    "iterators": [
        {
            "iterator": 1,
            "size_of_points": [1, 1.5, 1.2, 1.5, 1.8, 1, 1, 1.2],
            "lines": [
                {"a": 0.4, "b": 1, "label_upper": "red", "label_lower": "blue"}
            ]
        },
        {
            "iterator": 2,
            "size_of_points": [1.6, 1.3, 1, 1.5, 2, 1.6, 1.8, 1],
            "lines": [
                {"a": 0.5, "b": 0.8, "label_upper": "red", "label_lower": "blue"}
            ]
        },

        {
            "iterator": 3,
            "size_of_points": [1.6, 1.3, 1.9, 1.5, 2, 1.2, 1.8, 2],
            "lines": [
                {"a": 0.8, "b": 0.8, "label_upper": "blue", "label_lower": "red"}
            ]
        },
    ]
};

// init the graph
current_state = states.start;
loadData();

// generate random dataset
function loadData() {
    datapoints = data.datapoints;
    iterators = data.iterators;

    setDotSize();

    // draw data
    drawGraph();

    // var data = d3.json("/input/data.adaboost.json", function(data) {
    //     datapoints = data.datapoints;
    //     iterators = data.iterators;
        
    //     draw data
    //     drawGraph();

    //     enable play button
    //     TODO
    // });
}

function setDotSize(){
    // set default size for each data point if current state is "start"
    // otherwise, set size of current iterator
    for (var i = 0; i < datapoints.length; i++) {
        if (current_state == states.start) {
            datapoints[i].size = 1;
        } else {
            datapoints[i].size = iterators[current_state].size_of_points[i];
        }
        
    }

}

// create scatter chart in svg
function drawGraph() {
    adaboost_graph = document.getElementById("adaboost_graph").innerHTML = "";
    while (adaboost_graph.firstChild) {
        adaboost_graph.removeChild(adaboost_graph.firstChild);
    };
    
    svg = d3.select("#adaboost_graph")
            .append("svg:svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom);

    // g: group all elements
    var g = svg.append("g")
                // move from (0,0) to (margin.left, margin.top)
                .attr("transform", 
                    "translate(" + margin.left + "," + margin.top + ")");

    // xAxis
    var xScale = d3.scale.linear()
                .range([0, width])
                .domain([0, d3.max(datapoints, function(d) { return d.x; })]);

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    // group: x Axis
    g.append("g")
        // apply css .axis to "y Axis"
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // yAxis
    var yScale = d3.scale.linear()
                .range([height, 0])
                .domain([0, d3.max(datapoints, function(d) { return d.y; })]);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    // group: y Axis
    g.append("g")
        // apply css .axis to "y Axis"
        .attr("class", "y axis")
        .call(yAxis);

    // setup fill color
    var color = d3.scale.category10();

    // draw bestfit line
    if (current_state > states.start){
        for (var i = 0; i < iterators[current_state].lines.length; i++) {            
            var line = iterators[current_state].lines[i];
            var x1 = xScale.domain()[0];
            var y1 = line.a * x1 + line.b;
            var x2 = xScale.domain()[1];
            var y2 = line.a * x2 + line.b;
            line_data = [ 
                {"x": x1, "y": y1 }, 
                {"x": x2, "y": y2 }
            ];

            var below_area = d3.svg.area()
                .x(function(d) { return xScale(d.x); })
                .y0(height)
                .y1(function(d) { return yScale(d.y); });

            // define the line
            var valueline = d3.svg.line()
                .x(function(d) { return xScale(d.x); })
                .y(function(d) { return yScale(d.y); });


            g.append("path")      // Add the valueline path
                .datum(line_data)
                .attr("d", below_area)
                .style("fill", d3.rgb(color(line.label_lower)).brighter(1));

            // area above
            var above_area = d3.svg.area()
                .x(function(d) { return xScale(d.x); })
                .y0(0)
                .y1(function(d) { return yScale(d.y); });

            g.append("path")      // Add the valueline path
                .datum(line_data)
                .attr("d", above_area)
                .style("fill", d3.rgb(color(line.label_upper)).brighter(1));
        }
    }

    // draw scatter chart
    g.selectAll("scatter-dots")
        .data(datapoints)
        .enter()
        .append("svg:circle")
        .attr("class", "bar")
        .attr("cx", function(d) { return xScale(d.x); })
        .attr("cy", function(d) { return yScale(d.y); })
        .attr("r", function(d) { return d.size * 8; })
        .style("fill", function(d) { return color(d.label); }) ;
}

function displayResult() {
    start_idx = 0;    
    timer = setInterval(function() {
        if (start_idx < iterators.length) {
            current_state = start_idx;
            setDotSize();
            drawGraph();
            start_idx++;

        } else {
            current_state = states.finished;
            clearInterval(timer);
        }
        
    }, speed);
};

// reset
document.getElementById("reset").addEventListener("click", function() {
    clearInterval(timer);

    speed = document.getElementById("speed").value;
    current_state = states.start;
    loadData();
});

// play
document.getElementById("play").addEventListener("click", function() {
    clearInterval(timer);
    speed = document.getElementById("speed").value;
    displayResult();
});