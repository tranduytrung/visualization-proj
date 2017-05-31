var data = [{"date": "2013-01", value: 53}, 
			{"date": "2013-02", value: 165}, 
			{"date": "2013-03", value: 269},
			{"date": "2013-04", value: 344},
			{"date": "2013-05", value: 376},
			{"date": "2013-06", value: 410},
			{"date": "2013-07", value: 421}];


var margin = {top: 20, right: 20, bottom: 60, left: 60};
var width = 960;
var height = 500;

var x = d3.scale.ordinal()
				.domain(data.map(function(d) { return d.date; }))
				.rangeRoundBands([0, width], 0.1);

var y = d3.scale.linear()
				.range([height, 0])
				.domain([0, d3.max(data, function(d) { return d.value; })]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

var svg = d3.select('body')
	.append('svg')
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom);

// g: group all elements
var g = svg.append("g")
			// move from (0,0) to (margin.left, margin.top)
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// group: y Axis
g.append("g")
	// apply css .axis to "y Axis"
	.attr("class", "y axis")
	.call(yAxis);

// group: x Axis
g.append("g")
	// apply css .axis to "x Axis"
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

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
