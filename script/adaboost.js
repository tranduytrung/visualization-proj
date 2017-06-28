// custom variables
var margin = {top: 20, right: 20, bottom: 60, left: 30};
var width = Math.floor($('#adaboost_graph').width()/100) * 100;
var height = width;
var speed = 1000;
var max_nb_iterator = 5;
var iterators;
var states = {"initial": 0, "start": 1, "running": 2, "stop": 3, "finished": 4};
var current_state = states.initial;
var current_iterator = -1;
var timer;
var svg;
var g;

var max_x_axis = 10;
var max_y_axis = 10;

var color_point = {"blue": "#1f77b4", "red": "#ff7f0e"}
var color_region = {"blue": "#aec7e8", "red": "#ffbb78"}

// Scale
var xScale = d3.scale.linear().range([0, width]).domain([0, max_x_axis]);
var yScale = d3.scale.linear().range([height, 0]).domain([0, max_y_axis]);
var rScale = d3.scale.linear().range([0, width]).domain([0, 20]);
var rCircle = 0.25;

var oScale = d3.scale.linear().range([.5,1]).domain([10000,100000]);

data = [];
lines = [];

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
    g = svg.append("g")
			// move from (0,0) to (margin.left, margin.top)
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    // group: y Axis
    g.append("g")
        // apply css .axis to "y Axis"
        .attr("class", "y axis")
        .call(yAxis);
	
	//draw dashed lines
	g.selectAll(".h").data(d3.range(0, max_y_axis, 1)).enter()
	  .append("line").classed("h",1)
	  .attr("x1", 0).attr("x2",height)
	  .attr("y1", yScale).attr("y2", yScale)
	  
	g.selectAll(".v").data(d3.range(0, max_x_axis,1)).enter()
	  .append("line").classed("v",1)
	  .attr("y1", 0).attr("y2",width)
	  .attr("x1", xScale).attr("x2", xScale)
	
	svg.on('contextmenu', function() {
		//handle right click
		checkCirclePosition(d3.mouse(this)[0], d3.mouse(this)[1], color_point.red);
		//stop showing browser menu
		d3.event.preventDefault();
	});

	//click event: draw blue circle
	svg.on('click', function(){
		checkCirclePosition(d3.mouse(this)[0], d3.mouse(this)[1], color_point.blue);
	});
	
}

function enableButtons(){
	buttonStates = {"play": false, "stop": false, "reset": false, "clear": false, "speed": true, "nbIterator": true};
	textButtons = {"play": "Play"}
	
	switch(current_state) {
		case states.initial:
			buttonStates.play = false;
			buttonStates.stop = false;
			buttonStates.reset = false;
			buttonStates.clear = true;
			buttonStates.speed = true;
			buttonStates.nbIterator = true;
			textButtons.play = "Play";
			break;
		case states.start:
			buttonStates.play = true;
			buttonStates.stop = false;
			buttonStates.reset = false;
			buttonStates.clear = true;
			buttonStates.speed = true;
			buttonStates.nbIterator = true;
			textButtons.play = "Play";
			break;
		case states.running:
			buttonStates.play = false;
			buttonStates.stop = true;
			buttonStates.reset = true;
			buttonStates.clear = true;
			buttonStates.speed = false;
			buttonStates.nbIterator = false;
			textButtons.play = "Play";			
			break;
		case states.stop:
			buttonStates.play = true;
			buttonStates.stop = false;
			buttonStates.reset = true;
			buttonStates.clear = true;
			buttonStates.speed = false;
			buttonStates.nbIterator = false;
			textButtons.play = "Resume";
			break;
		case states.finished:
			buttonStates.play = false;
			buttonStates.stop = false;
			buttonStates.reset = true;
			buttonStates.clear = true;			
			buttonStates.speed = true;
			buttonStates.nbIterator = true;
			textButtons.play = "Play";
			break;
		default:
			buttonStates.play = false;
			buttonStates.stop = false;
			buttonStates.reset = false;	
			buttonStates.clear = false;		
			buttonStates.speed = true;
			buttonStates.nbIterator = true;
			textButtons.play = "Play";
	}

	$('#btnPlay').prop('disabled', !buttonStates.play);
	$('#btnPlay').text(textButtons.play);
	
	$('#btnStop').prop('disabled', !buttonStates.stop);
	$('#btnReset').prop('disabled', !buttonStates.reset);
	$('#btnClear').prop('disabled', !buttonStates.clear);
	$('#speed').prop('disabled', !buttonStates.speed);
	$('#txtNbIterators').prop('disabled', !buttonStates.nbIterator);
}

function checkCirclePosition(mouse_x, mouse_y, color) {
	if(mouse_x >= (margin.left + rScale(rCircle)) 
		&& mouse_x <= (margin.left + width - rScale(rCircle)) 
		&& mouse_y >= (margin.top + rScale(rCircle)) 
		&& mouse_y <= (margin.top + height - rScale(rCircle))){
		//push new data point to data array
		x = xScale.invert(mouse_x - margin.left);
		y = yScale.invert(mouse_y - margin.top);
		data.push({"id": "point_" + (data.length + 1), "x": x, "y": y, "radius": rCircle, "fill": color});
		
		drawCircles();
	}
}

function drawCircles(){
	//select each circle and append the data
	var selection = g.selectAll("circle").data(data)

	//update selection and draw new circle
	selection.enter()
	.append("circle")
	.attr("id",function(d) {return d.id;})
	.attr("cx",function(d) {return xScale(d.x);})
	.attr("cy",function(d) {return yScale(d.y);})
	.attr("r",function(d) {return rScale(d.radius);})
	.style("fill",function(d) {return d.fill;});

	//exit selection
	selection.exit().remove()

	if (data.length > 2) {
		current_state = states.start;
	}
	enableButtons();
}

function transition() {
	// transition circles
    g.selectAll("circle")
        .data(data)
        .transition()
        .duration(1500)
        .style("fill",function(d) {return d.fill;})
        .attr("r",function(d) {return rScale(d.radius);})
        .attr("cx",function(d) {return xScale(d.x);})
        .attr("cy",function(d) {return yScale(d.y);})
		; 
	
	lines.push(calculateLineArea(iterators[current_iterator].line));
	
	// draw previous line - then move to new position
	lineId = "line_" + (current_iterator + 1);
	if (current_iterator == 0){
		drawLineAndArea(lines[0], lineId, true);
	} else {
		drawLineAndArea(lines[current_iterator - 1], lineId, false);
		transitionLineAndArea(lines[current_iterator], lineId);
	}
}
var lineFunction = d3.svg.line()
		.x(function(d) { return xScale(d.x); })
		.y(function(d) { return yScale(d.y); });

// define the area
var areaFunction = d3.svg.area()
    .x(function(d) { return xScale(d.x); })
    .y0(height)
    .y1(function(d) { return yScale(d.y); });

// define the area
var aboveAreaFunction = d3.svg.area()
    .x(function(d) { return xScale(d.x); })
    .y0(0)
    .y1(function(d) { return yScale(d.y); });
	
function transitionLineAndArea(lineInfo, lineId){
	line = lineInfo.line;
	
	var t0 = svg.transition().duration(1500).delay(1000);
	
	t0.select('#' + lineId)
		.attr("d", lineFunction([{"x": line.x1, "y": line.y1},
								{"x": line.x2, "y": line.y2}]))
		.attr("stroke-width", 4 * oScale(line.weight))
		.attr("opacity", oScale(line.weight));
		
	// transition area below line
	t0.select('#area_below_line')
		.attr("d", areaFunction(lineInfo.below_area))
		.attr("fill", lineInfo.below_color);
								
	// transition area aove line
	t0.select('#area_above_line')
		.attr("d", aboveAreaFunction(lineInfo.above_area))
		.attr("fill", lineInfo.above_color);
}

function drawLineAndArea(lineInfo, lineId, appendArea){
	// draw line
	line = lineInfo.line;
	g.append('path')
		.attr("d", lineFunction([{"x": line.x1, "y": line.y1},
								{"x": line.x2, "y": line.y2}]))
		.attr("stroke-width", 4 * oScale(line.weight))
		.attr("stroke", "green")
		.attr("opacity", oScale(line.weight))
		.attr("fill", "none")
		.attr('id', lineId);
	
	if (appendArea){		
		// fill area below the line
		g.append("path")
			.attr("d", areaFunction(lineInfo.below_area))
			.attr("fill", lineInfo.below_color)
			.attr("opacity", 0.5)
			.attr('id', "area_below_line");
		
		// fill area above the line
		g.append("path")
			.attr("d", aboveAreaFunction(lineInfo.above_area))
			.attr("fill", lineInfo.above_color)
			.attr("opacity", 0.5)
			.attr('id', "area_above_line");
	}
}

function calculateLineArea(lineInfo) {
	var a = lineInfo.a;
	var b = lineInfo.b;
	
	origin = b <= 0;
	top_left = (b - max_y_axis) <= 0;
	top_right = (a * max_x_axis + b - max_y_axis) <= 0;
	bottom_right = (a * max_x_axis + b) <= 0;
	
	// the order of cases is important, we set higher priority for group of 3 points before group of 2 points
	cases = [origin == !top_left && !top_left == !top_right && !top_right == !bottom_right,
			origin == top_left && top_left == top_right && top_right == !bottom_right,
			origin == top_left && top_left == bottom_right && bottom_right == !top_right ,
			origin == top_right && top_right == bottom_right && bottom_right == !top_left,
			origin == bottom_right && bottom_right == !top_left && !top_left == !top_right,
			origin == top_left && top_left == !top_right && !top_right == !bottom_right];
	correct_cases_idx = -1;
	$.each(cases, function(i){
		if (cases[i]) {
			correct_cases_idx = i;
			return false;
		}
	});
	console.log(correct_cases_idx);
	
	var line = {};
	var area_below = {};
	var area_above = {};
	var below_color, above_color;
	
	switch(correct_cases_idx){
		case 0:
			line = {"weight": lineInfo.alpha, "x1": 0, "y1": b, "x2": -b/a, "y2": 0};
			area_below = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			area_above = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}, {"x": max_x_axis, "y": 0}];
			
			// if origin belongs to negative region, set color of below region with negative; otherwise, set it with position color
			below_color = origin ? lineInfo.negative_region : lineInfo.positive_region;
			
			break;
		case 1:
			line = {"weight": lineInfo.alpha, "x1": -b/a, "y1": 0, "x2": max_x_axis, "y2": max_x_axis * a + b};
			area_below = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			area_above = [{"x": 0, "y": 0}, {"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			
			below_color = origin ? lineInfo.positive_region : lineInfo.negative_region;			
			break;
		case 2:
			line = {"weight": lineInfo.alpha, "x1": (max_y_axis - b)/a, "y1": max_y_axis, "x2": max_x_axis, "y2": max_x_axis * a + b};
			area_below = [{"x": 0, "y": max_y_axis}, {"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			area_above = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			
			below_color = origin ? lineInfo.negative_region : lineInfo.positive_region;			
			break;		
		case 3:
			line = {"weight": lineInfo.alpha, "x1": 0, "y1": b, "x2": (max_y_axis - b)/a, "y2": max_y_axis};
			area_below = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}, {"x": max_x_axis, "y": max_y_axis}];
			area_above = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			
			below_color = origin ? lineInfo.negative_region : lineInfo.positive_region;
			break;
		case 4:
			line = {"weight": lineInfo.alpha, "x1": 0, "y1": b, "x2": max_x_axis, "y2": max_x_axis * a + b};
			area_below = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			area_above = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			
			below_color = origin ? lineInfo.negative_region : lineInfo.positive_region;
			break;
		case 5:
			line = {"weight": lineInfo.alpha, "x1": (max_y_axis - b)/a, "y1": max_y_axis, "x2": -b/a, "y2": 0};
			area_below = [{"x": 0, "y": max_y_axis}, {"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}];
			area_above = [{"x": line.x1, "y": line.y1}, {"x": line.x2, "y": line.y2}, {"x": max_x_axis, "y": 0}];
			
			below_color = origin ? lineInfo.negative_region : lineInfo.positive_region;
			break;
	};
	
	if (below_color == lineInfo.negative_region) {		
		return {"line": line, "below_area": area_below, "above_area": area_above,
				"below_color": below_color, "above_color": lineInfo.positive_region};
	} else {
		return {"line": line, "below_area": area_below, "above_area": area_above,
				"below_color": below_color, "above_color": lineInfo.negative_region};
	}
}

function displayResult() {    
    timer = setInterval(function() {
        if (current_iterator < iterators.length) {
			$('#txtIteratorInfo').html('Iterator: ' + (current_iterator + 1));
			
			// update radius
			var weight_points = iterators[current_iterator].size_of_points;
			var wScale = scalePoint(weight_points);
			$.each(data, function(i, item) {
				data[i].radius = wScale(weight_points[i]);
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

function scalePoint(weight_points){
	// scale radius: [min_weight, max_weight] -> [0, rCircle/2]
	var max_weight = weight_points[0];
	var min_weight = weight_points[0];
	$.each(weight_points, function(i){
		if (weight_points[i] > max_weight)
			max_weight = weight_points[i];
		if (weight_points[i] < min_weight)
			min_weight = weight_points[i];
	})
	return d3.scale.linear().range([rCircle, 3*rCircle]).domain([min_weight, max_weight]);
}

function scaleOpacity() {
	max_alpha = iterators[0].line.alpha;
	min_alpha = iterators[0].line.alpha;
	$.each(iterators, function(i){
		if (iterators[i].line.alpha > max_alpha){
			max_alpha = iterators[i].line.alpha;
		}
		if (iterators[i].line.alpha < min_alpha){
			min_alpha = iterators[i].line.alpha;
		}
	});
	return d3.scale.linear().range([.4,1]).domain([min_alpha,max_alpha]);
}

// play
document.getElementById("btnPlay").addEventListener("click", function() {
	if (current_state == states.start) {
		current_iterator = 0;
	}
	current_state = states.running;
	enableButtons();
	
	// run adaboost
	max_nb_iterator = parseInt($("#txtNbIterators").val());
	iterators = adaboost_func(data);
	
	// calculate scale of opacity for lines
	oScale = scaleOpacity();
		
    clearInterval(timer);
    speed = $("#speed").val();
    displayResult();
});

// reset
document.getElementById("btnReset").addEventListener("click", function() {
	reset();
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
	lines = [];
    initialGraph();
});

$("#btnLoadFile").on('click', function () {
    var file = document.getElementById("inputFile").files[0];
	if (file) {
		var reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = function (evt) {
			//$("#errorLoadingFile").html(evt.target.result);
			parseFile(evt.target.result, file.name);
			reset();
		}
		reader.onerror = function (evt) {
			$("#errorLoadingFile").html("Error reading file");
		}
	}
})

function parseFile(fileContent, fileName){
	file_ext = fileName.substr(fileName.lastIndexOf('.') + 1);
	data = [];
	switch(file_ext){
		case 'json':
			json_data = JSON.parse(fileContent);
			$.each(json_data, function(i) {
				if (json_data[i].label == "blue" || json_data[i].label == 1){
					color = color_point.blue;
				} else {
					color = color_point.red;
				}
				data.push({"id": "point_" + (i + 1), "x": json_data[i].x, "y": json_data[i].y, "radius": rCircle, "fill": color});
			})
			break;
		case 'csv':
		case 'txt':
			break;
		default:			
	}
}

function reset(){
	current_iterator = -1;
	current_state = states.start;
	enableButtons();
	clearInterval(timer);
	
	// update data
	$.each(data, function(i, item) {
		data[i].radius = rCircle;
	})
	
	lines = [];
	
	initialGraph();

	drawCircles();
}

$("#btnGenerateData").on('click', function () {
	data = [];
	reset();
	
	var nbPoints = $('#txtNumberPoint').val();
	for(i = 0; i < nbPoints; i++){
		x = Math.random() * max_x_axis;
		y = Math.random() * max_y_axis;
		label = Math.floor(Math.random() * 2) + 1;
		color = label == 1 ? color_point.blue : color_point.red;
		data.push({"id": "point_" + (i + 1), "x": x, "y": y, "radius": rCircle, "fill": color});
	}
	current_state = states.start;
	enableButtons();
	
	drawCircles();
});

function adaboost_func(dataset) {	
	// convert label & initial weight
	weights = [];
	$.each(dataset, function(i){
		dataset[i].label = dataset[i].fill == color_point.blue ? -1 : 1;
		weights.push(1/dataset.length);
	})
	
	iterators = [];
	
	for(i = 0; i < max_nb_iterator; i++){
		// create simple classifier
		classifier = simple_classifier(dataset, weights);
					
		// compute weight of the classifier
		alpha = 0.5 * Math.log((1 - classifier.error)/classifier.error);
		
		iterators.push({"iterator": (i+1),
            "size_of_points": weights,
			"line": { "a": classifier.a, "b": classifier.b, "alpha": alpha, 
						"negative_region": classifier.negative_region,
						"positive_region": classifier.positive_region}});
		
		// update sample weights
		new_weights = [];
		sum_new_weight = 0;
		$.each(dataset, function(j){
			new_weights.push(weights[j] * Math.exp(-classifier.predicted_labels[j] * dataset[j].label * alpha));
			sum_new_weight += new_weights[j];
		})
		$.each(new_weights, function(j){
			new_weights[j] = new_weights[j]/sum_new_weight;
		})
		weights = new_weights;
	};
	
	return iterators;
}

function simple_classifier(dataset, weights){
	classiferResult = {"a": 0, "b": 0, "predicted_labels": [], "error": 0};
	mean_group_1  = {"total_weight": 0, "sum_x": 0, "sum_y": 0, "x": 0, "y": 0};
	mean_group_2 = {"total_weight": 0, "sum_x": 0, "sum_y": 0, "x": 0, "y": 0};
	// compute mean of groups
	$.each(dataset, function(i){
		if (dataset[i].label == -1) {
			mean_group_1.total_weight += weights[i];
			mean_group_1.sum_x += dataset[i].x * weights[i];
			mean_group_1.sum_y += dataset[i].y * weights[i];
		} else {
			mean_group_2.total_weight += weights[i];
			mean_group_2.sum_x += dataset[i].x * weights[i];
			mean_group_2.sum_y += dataset[i].y * weights[i];
		}
	})
	
	mean_group_1.x = mean_group_1.sum_x/mean_group_1.total_weight;
	mean_group_1.y = mean_group_1.sum_y/mean_group_1.total_weight;
	mean_group_2.x = mean_group_2.sum_x/mean_group_2.total_weight;
	mean_group_2.y = mean_group_2.sum_y/mean_group_2.total_weight;
	
	// compute classification line	
	mean_point = {"x": (mean_group_1.x + mean_group_2.x)/2, "y": (mean_group_1.y + mean_group_2.y)/2};
	mm1_vector = {"x": (mean_point.x + (mean_group_1.y - mean_group_2.y)), "y": (mean_point.y + (mean_group_2.x - mean_group_1.x))};
	
	classiferResult.a = (mm1_vector.y - mean_point.y)/(mm1_vector.x - mean_point.x);
	classiferResult.b = -mean_point.x * (mm1_vector.y - mean_point.y)/(mm1_vector.x - mean_point.x) + mean_point.y;
	
	// we use temporary labels: -2 for points which have a*x + b - y < 0 and 2 for ones which have a*x + b - y > 0 
	count_predicted_labels = [[0,0],[0,0]];
	$.each(dataset, function(i){
		if (dataset[i].x * classiferResult.a + classiferResult.b - dataset[i].y < 0){
			classiferResult.predicted_labels.push(-2);
			if (dataset[i].label == -1)
				count_predicted_labels[0][0] += 1;
			else
				count_predicted_labels[0][1] += 1;
		} else {
			classiferResult.predicted_labels.push(2);
			if (dataset[i].label == -1)
				count_predicted_labels[1][0] += 1;
			else
				count_predicted_labels[1][1] += 1;
		}
	})
	
	// update true label
	if (count_predicted_labels[0][0] > count_predicted_labels[0][1]){
		true_label_1 = -1;
		classiferResult.negative_region = color_point.blue;
		classiferResult.positive_region = color_point.red;
	} else {
		true_label_1 = 1;
		classiferResult.negative_region = color_point.red;
		classiferResult.positive_region = color_point.blue;
	}
	
	$.each(classiferResult.predicted_labels, function(i){
		if (classiferResult.predicted_labels[i] == -2){
			classiferResult.predicted_labels[i] = true_label_1;
		} else {
			classiferResult.predicted_labels[i] = true_label_1 * -1;
		}
		classiferResult.error += weights[i] * classiferResult.predicted_labels[i] * dataset[i].label;		
	})
	
	classiferResult.error = 0.5 - 0.5 * classiferResult.error;
	
	return classiferResult;
}

$("#btnExportData").on('click', function() {
	var export_data = $.map(data, function(item) {
		return {"x": item.x, "y": item.y, "label": item.fill == color_point.blue ? 1 : -1}
	});
	saveText(JSON.stringify(export_data), 'export_data.json');
});

function saveText(text, fileName) {
	var a = document.createElement('a');
	a.setAttribute('href', 'data:text/plain;charset=utf-u,' + encodeURIComponent(text));
	a.setAttribute('download', fileName);
	a.click();
}