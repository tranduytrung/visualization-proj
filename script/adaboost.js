// custom variables
var margin = {top: 20, right: 20, bottom: 60, left: 30};
var width = 600;
var height = 600;
var speed = 1000;
var iterators;
var states = {"initial": 0, "start": 1, "running": 2, "stop": 3, "finished": 4};
var current_state = states.initial;
var current_iterator = -1;
var timer;
var svg;

var max_x_axis = 10;
var max_y_axis = 10;

var color_point = {"blue": "#1f77b4", "red": "#ff7f0e"}
var color_region = {"blue": "#aec7e8", "red": "#ffbb78"}
	 
var rScale = d3.scale.linear().domain([0,width]).range([0,20]);
var rCircle = 200;
var o = d3.scale.linear().domain([10000,100000]).range([.5,1]);

var lineId = 'regline';

data = [];

// init the graph
current_state = states.initial;
initialGraph();

$(document).keydown(function(event){
    if(event.which=="17")
        cntrlIsPressed = true;
});

$(document).keyup(function(){
    cntrlIsPressed = false;
});

var cntrlIsPressed = false;

// create empty graph in svg
function initialGraph() {
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
                .domain([0, max_x_axis]);

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
                .domain([0, max_y_axis]);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    // group: y Axis
    g.append("g")
        // apply css .axis to "y Axis"
        .attr("class", "y axis")
        .call(yAxis);
	
	//draw dashed lines
	g.selectAll(".h").data(d3.range(0,10,1)).enter()
	  .append("line").classed("h",1)
	  .attr("x1", 0).attr("x2",height)
	  .attr("y1", yScale).attr("y2", yScale)
	  
	g.selectAll(".v").data(d3.range(0,10,1)).enter()
	  .append("line").classed("v",1)
	  .attr("y1", 0).attr("y2",width)
	  .attr("x1", xScale).attr("x2", xScale)
	
	svg.on('contextmenu', function() {
		//handle right click
		drawCircle(d3.mouse(this)[0], d3.mouse(this)[1], color_point.red);
		//stop showing browser menu
		d3.event.preventDefault();
	});

	//click event: draw blue circle
	svg.on('click', function(){
		drawCircle(d3.mouse(this)[0], d3.mouse(this)[1], color_point.blue);
	});
	
}

function enableButtons(){
	buttonStates = {"play": false, "stop": false, "reset": false, "clear": false, "speed": true};
	textButtons = {"play": "Play"}
	
	switch(current_state) {
		case states.initial:
			buttonStates.play = false;
			buttonStates.stop = false;
			buttonStates.reset = false;
			buttonStates.clear = true;
			buttonStates.speed = true;
			textButtons.play = "Play";
			break;
		case states.start:
			buttonStates.play = true;
			buttonStates.stop = false;
			buttonStates.reset = false;
			buttonStates.clear = true;
			buttonStates.speed = true;
			textButtons.play = "Play";
			break;
		case states.running:
			buttonStates.play = false;
			buttonStates.stop = true;
			buttonStates.reset = true;
			buttonStates.clear = true;
			buttonStates.speed = false;
			textButtons.play = "Play";			
			break;
		case states.stop:
			buttonStates.play = true;
			buttonStates.stop = false;
			buttonStates.reset = true;
			buttonStates.clear = true;
			buttonStates.speed = false;
			textButtons.play = "Resume";
			break;
		case states.finished:
			buttonStates.play = false;
			buttonStates.stop = false;
			buttonStates.reset = true;
			buttonStates.clear = true;			
			buttonStates.speed = true;
			textButtons.play = "Play";
			break;
		default:
			buttonStates.play = false;
			buttonStates.stop = false;
			buttonStates.reset = false;	
			buttonStates.clear = false;		
			buttonStates.speed = true;
			textButtons.play = "Play";
	}

	$('#btnPlay').prop('disabled', !buttonStates.play);
	$('#btnPlay').text(textButtons.play);
	
	$('#btnStop').prop('disabled', !buttonStates.stop);
	$('#btnReset').prop('disabled', !buttonStates.reset);
	$('#btnClear').prop('disabled', !buttonStates.clear);
	$('#speed').prop('disabled', !buttonStates.speed);
}

function drawCircle(mouse_x, mouse_y, color){
	if(mouse_x >= (margin.left + rScale(rCircle)) 
		&& mouse_x <= (margin.left + width - rScale(rCircle)) 
		&& mouse_y >= (margin.top + rScale(rCircle)) 
		&& mouse_y <= (margin.top + height - rScale(rCircle))){
		//push new data point to data array
		data.push({"id": "point_" + (data.length + 1), "x": mouse_x, "y": mouse_y, "radius": rCircle, "fill": color, "opacity": 90000});

		//select each circle and append the data
		var selection = svg.selectAll("circle").data(data)

		//update selection and draw new circle
		selection.enter()
		.append("circle")
		.attr("id",function(d) {return d.id;})
		.attr("cx",function(d) {return d.x;})
		.attr("cy",function(d) {return d.y;})
		.attr("r",function(d) {return rScale(d.radius);})
		.style("fill",function(d) {return d.fill;})
		.style("opacity",function(d) { return o(+d.opacity);});

		//exit selection
		selection.exit().remove()

		if (data.length > 2) {
			current_state = states.start;
		}
		enableButtons();
	}
}

function transition() {
    svg.selectAll("circle")
        .data(data)
        .transition()
        .duration(1500)
        .style("fill",function(d) {return d.fill;})
        .attr("r",function(d) {return rScale(d.radius);})
        .attr("cx",function(d) {return d.x;})
        .attr("cy",function(d) {return d.y;});
	
	if (current_iterator == 0){
		drawline(iterators[current_iterator].line);
	} else {
		transitionline(iterators[current_iterator].line);
	}
}

var transitionline = function(lsCoef){
	var a = lsCoef.a;
	var b = lsCoef.b;
	
	var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; });

	d3.select('#' + lineId)
		.transition()
		.duration(1500)
		.attr("d", lineFunction([{"x": margin.left, "y": a * margin.left + b},
								{"x": (margin.left + width), "y": a * (margin.left + width) + b}]));
}

function drawline(lsCoef){
	var a = lsCoef.a;
	var b = lsCoef.b;
	
	var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
	.y(function(d) { return d.y; });

	svg.append('path')
		.attr("d", lineFunction([{"x": margin.left, "y": a * margin.left + b},
								{"x": (margin.left + width), "y": a * (margin.left + width) + b}]))
		.attr("stroke-width", 2)
		.attr("stroke", "black")
		.attr('id', lineId);
}

function displayResult() {    
    timer = setInterval(function() {
        if (current_iterator < iterators.length) {
			// update data
			$.each(data, function(i, item) {
				data[i].radius = data[i].radius + rCircle * iterators[current_iterator].size_of_points[i] * 2;
			})
            transition();
            current_iterator++;
        } else {
            current_state = states.finished;
            clearInterval(timer);
			enableButtons();
        }
        
    }, speed);
};

// play
document.getElementById("btnPlay").addEventListener("click", function() {
	if (current_state == states.start) {
		current_iterator = 0;
	}
	current_state = states.running;
	enableButtons();
	
	// run adaboost
	iterators =  [
        {
            "iterator": 1,
            "size_of_points": [0.1, 0.5, 0.2, 0, 0, 0, 0, 0.2],
			"line": { "a": 0.1, "b": 1}
		},
		{
            "iterator": 2,
            "size_of_points": [0.3, 0.4, 0, 0, 0, 0, 0, 0.3],
			"line": { "a": 0.5, "b": 2}
		},
		{
            "iterator": 3,
            "size_of_points": [0, 0, 0, 0, 0.5, 0.2, 0.2, 0.1],
			"line": { "a": 1, "b": 3}
		},
		{
            "iterator": 4,
            "size_of_points": [0, 0, 0, 0.1, 0.3, 0.5, 0.1, 0],
			"line": { "a": 2, "b": 4}
		}];
		
    clearInterval(timer);
    speed = $("#speed").val();
    displayResult();
});

// reset
document.getElementById("btnReset").addEventListener("click", function() {
	current_iterator = -1;
	current_state = states.start;
	enableButtons();
	clearInterval(timer);
	
	// update data
	$.each(data, function(i, item) {
		data[i].radius = rCircle;
	})
	
	// remove line
	$('#' + lineId).remove();

	transition();	
});

// stop
document.getElementById("btnStop").addEventListener("click", function() {
	current_state = states.stop;
	enableButtons();
    clearInterval(timer);
});

// clear
document.getElementById("btnClear").addEventListener("click", function() {
	current_state = states.initial;
	current_iterator = -1;
	clearInterval(timer);
	enableButtons();
	data = [];
    initialGraph();
});

