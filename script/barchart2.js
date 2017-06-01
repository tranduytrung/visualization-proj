var margin = {top: 20, right: 20, bottom: 60, left: 60};
var width = 960;
var height = 500;

// Parse the date / time
var	parseDate = d3.time.format("%Y-%m").parse;

// using CSV file
// because downloading is asynchronous, chart definition in put in the callback function of downloading file
var data = d3.csv("input/data.barchart.csv", function(error, data) {
	
    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.value = +d.value;
    });

    var svg = d3.select('body')
		.append('svg')
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom);

	// g: group all elements
	var g = svg.append("g")
				// move from (0,0) to (margin.left, margin.top)
				.attr("transform", 
					"translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scale.ordinal()
					.domain(data.map(function(d) { return d.date; }))
					.rangeRoundBands([0, width], 0.1);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .tickFormat(d3.time.format("%Y-%m"));

	// group: x Axis
	g.append("g")
		// apply css .axis to "x Axis"
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.attr("dx", "-.8em")
      	.attr("dy", "-.55em")
		.style("text-anchor", "end")
		.attr("transform", "rotate(-90)" );

	var y = d3.scale.linear()
					.range([height, 0])
					.domain([0, d3.max(data, function(d) { return d.value; })]);

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(10);

	// group: y Axis
	g.append("g")
		// apply css .axis to "y Axis"
		.attr("class", "y axis")
		.call(yAxis);

	// draw bar chart
	g.selectAll('bar')
		.data(data)
		.enter()
		.append('rect')
		.attr("class", "bar")
		.attr("x", function(d) {return x(d.date)})
		.attr("width", x.rangeBand())
		.attr("y", function(d) {return y(d.value)})
		.attr("height", function(d) { return height - y(d.value); });
});


// // using tab-seperated values TSV
// var data
// d3.csv("input/data.barchart.tsv", function(error, tsvdata) {