function makeResponsive(){

    var svgArea = d3.select("#scatter").select("svg");

    if (!svgArea.empty()) {
      svgArea.remove();
    }  

    var svgHeight = window.innerHeight;
    var svgWidth = window.innerWidth - 100;

    var margin = {
        top: 20,
        right: 100,
        bottom: 80,
        left: 100
    };

    var width = svgWidth - margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;

    // Create an SVG wrapper, append an SVG group that will hold our chart,
    // and shift the latter by left and top margins.
    var svg = d3
        .select("#scatter")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Append an SVG group
    var chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Initial Params
    var chosenXAxis = "poverty";
    var chosenYAxis = "obesity";

    // function used for updating x-scale var upon click on axis label
    function xScale(censusData, chosenXAxis) {
        // create scales
        var xLinearScale = d3.scaleLinear()
            .domain([d3.min(censusData, d => d[chosenXAxis]),
            d3.max(censusData, d => d[chosenXAxis])
            ])
            .range([0, width]);

        return xLinearScale;
    }

    function yScale(censusData, chosenYAxis) {
        // create scales
        var yLinearScale = d3.scaleLinear()
            .domain([d3.min(censusData, d => d[chosenYAxis]),
            d3.max(censusData, d => d[chosenYAxis])
            ])
            .range([height, 0]);

        return yLinearScale;
    }

    // function used for updating xAxis var upon click on axis label
    function renderAxesX(newXScale, xAxis) {
        var bottomAxis = d3.axisBottom(newXScale);

        xAxis.transition()
            .duration(1000)
            .call(bottomAxis);

        return xAxis;
    }

    // function used for updating yAxis var upon click on axis label
    function renderAxesY(newYScale, yAxis) {
        var leftAxis = d3.axisLeft(newYScale);

        yAxis.transition()
            .duration(1000)
            .call(leftAxis);

        return yAxis;
    }

    // function used for updating circles with a transition to new circles
    function renderCircles(circlesGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {

        circlesGroup.transition()
            .duration(1000)
            .attr("cx", d => newXScale(d[chosenXAxis]))
            .attr("cy", d => newYScale(d[chosenYAxis]));

        return circlesGroup;
    }

    // function used for updating state abbr with a transition to new locations
    function renderAbbr(abbrGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {

        abbrGroup.transition()
            .duration(1000)
            .attr("x", d => newXScale(d[chosenXAxis]))
            .attr("y", d => newYScale(d[chosenYAxis]) + 4);

        return abbrGroup;
    }

    // function used for updating circles group with new tooltip
    function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

        var labelX;
        if (chosenXAxis === "poverty") {
            labelX = "Poverty:";
        } else if (chosenXAxis === "age") {
            labelX = "Age:";
        } else {
            labelX = "Income:";
        }

        var labelY;
        if (chosenYAxis === "obesity") {
            labelY = "Obesity:";
        } else if (chosenYAxis === "smokes") {
            labelY = "Smokers:";
        } else {
            labelY = "Lacks Healthcare:";
        }

        var toolTip = d3.tip()
            .attr("class", "tooltip")
            .offset([80, -60])
            .html(function (d) {
                return (`${d.state}<br>${labelX} ${d[chosenXAxis]}<br>${labelY} ${d[chosenYAxis]}%`);
            });

        circlesGroup.call(toolTip);

        circlesGroup.on("mouseover", function (data) {
            toolTip.show(data);
        })
            // onmouseout event
            .on("mouseout", function (data, index) {
                toolTip.hide(data);
            });

        return circlesGroup;
    }

    // Retrieve data from the CSV file and execute everything below
    d3.csv("assets/data/data.csv").then(function (censusData, err) {
        if (err) throw err;

        // parse data
        censusData.forEach(function (data) {
            data.poverty = +data.poverty;
            data.age = +data.age;
            data.income = +data.income;
            data.obesity = +data.obesity;
            data.smokes = +data.smokes;
            data.healthcare = +data.healthcare;
        });

        // xLinearScale function above csv import
        var xLinearScale = xScale(censusData, chosenXAxis);

        // Create y scale function
        var yLinearScale = yScale(censusData, chosenYAxis);

        // Create initial axis functions
        var bottomAxis = d3.axisBottom(xLinearScale);
        var leftAxis = d3.axisLeft(yLinearScale);

        // append x axis
        var xAxis = chartGroup.append("g")
            .classed("x-axis", true)
            .attr("transform", `translate(0, ${height})`)
            .call(bottomAxis);

        // append y axis
        var yAxis = chartGroup.append("g")
            .classed("y-axis", true)
            .call(leftAxis);

        // append initial circles
        var circlesGroup = chartGroup.selectAll("circle")
            .data(censusData)
            .enter()
                .append("circle")
                .attr("cx", d => xLinearScale(d[chosenXAxis]))
                .attr("cy", d => yLinearScale(d[chosenYAxis]))
                .attr("r", 12)
                .attr("fill", "#64d1cc")
        
        var stateAbbr = chartGroup.append("g")
        
        // append initial abbreviations
        var abbrGroup = stateAbbr.selectAll("text")
            .data(censusData)
            .enter()
                .append("text")
                .text(d => d.abbr)
                .attr("x", d => xLinearScale(d[chosenXAxis]))
                .attr("y", d => yLinearScale(d[chosenYAxis]) + 3)
                .attr("text-anchor", "middle")
                .style("color", "white")
                .style("font-size", "8px")

        // Create group for x-axis labels
        var labelsGroupX = chartGroup.append("g")
            .attr("transform", `translate(${width / 2}, ${height + 20})`);

        var labelsGroupY = chartGroup.append("g")
            .attr("transform", "rotate(-90)")
            .attr("dy", "1em")
            .classed("axis-text", true);

        var povertyLabel = labelsGroupX.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("value", "poverty") // value to grab for event listener
            .classed("active", true)
            .text("In Poverty (%)");

        var ageLabel = labelsGroupX.append("text")
            .attr("x", 0)
            .attr("y", 40)
            .attr("value", "age") // value to grab for event listener
            .classed("inactive", true)
            .text("Age (Median)");

        var incomeLabel = labelsGroupX.append("text")
            .attr("x", 0)
            .attr("y", 60)
            .attr("value", "income") // value to grab for event listener
            .classed("inactive", true)
            .text("Household Income (Median) ($)");

        var obeseLabel = labelsGroupY.append("text")
            .attr("x", 0 - (height / 2))
            .attr("y", 20 - margin.left)
            .attr("value", "obesity") // value to grab for event listener
            .classed("active", true)
            .text("Obese (%)");

        var smokesLabel = labelsGroupY.append("text")
            .attr("x", 0 - (height / 2))
            .attr("y", 40 - margin.left)
            .attr("value", "smokes") // value to grab for event listener
            .classed("inactive", true)
            .text("Smokes (%)");

        var healthcareLabel = labelsGroupY.append("text")
            .attr("x", 0 - (height / 2))
            .attr("y", 60 - margin.left)
            .attr("value", "healthcare") // value to grab for event listener
            .classed("inactive", true)
            .text("Lacks Healthcase (%)");

        // updateToolTip function above csv import
        var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

        // x axis labels event listener
        labelsGroupX.selectAll("text")
            .on("click", function () {
                // get value of selection
                var value = d3.select(this).attr("value");
                if (value !== chosenXAxis) {

                    // replaces chosenXAxis with value
                    chosenXAxis = value;

                    // functions here found above csv import
                    // updates x scale for new data
                    xLinearScale = xScale(censusData, chosenXAxis);

                    // updates x axis with transition
                    xAxis = renderAxesX(xLinearScale, xAxis);

                    // updates circles with new x and y values
                    circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

                    // updates abbr with new x amd y values
                    abbrGroup = renderAbbr(abbrGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

                    // updates tooltips with new info
                    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                    // changes classes to change bold text
                    if (chosenXAxis === "age") {
                        ageLabel
                            .classed("active", true)
                            .classed("inactive", false);
                        povertyLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        incomeLabel
                            .classed("active", false)
                            .classed("inactive", true);
                    } else if (chosenXAxis === "income") {
                        ageLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        povertyLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        incomeLabel
                            .classed("active", true)
                            .classed("inactive", false);
                    } else {
                        ageLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        povertyLabel
                            .classed("active", true)
                            .classed("inactive", false);
                        incomeLabel
                            .classed("active", false)
                            .classed("inactive", true);
                    }
                }
            });

        // y axis labels event listener
        labelsGroupY.selectAll("text")
            .on("click", function () {
                // get value of selection
                var value = d3.select(this).attr("value");
                if (value !== chosenYAxis) {

                    // replaces chosenYAxis with value
                    chosenYAxis = value;

                    // functions here found above csv import
                    // updates y scale for new data
                    yLinearScale = yScale(censusData, chosenYAxis);

                    // updates y axis with transition
                    yAxis = renderAxesY(yLinearScale, yAxis);

                    // updates circles with new x and y values
                    circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

                    // updates abbr with new x amd y values
                    abbrGroup = renderAbbr(abbrGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

                    // updates tooltips with new info
                    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                    // changes classes to change bold text
                    if (chosenYAxis === "smokes") {
                        smokesLabel
                            .classed("active", true)
                            .classed("inactive", false);
                        obeseLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        healthcareLabel
                            .classed("active", false)
                            .classed("inactive", true);
                    } else if (chosenYAxis === "healthcare") {
                        smokesLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        obeseLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        healthcareLabel
                            .classed("active", true)
                            .classed("inactive", false);
                    } else {
                        smokesLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        obeseLabel
                            .classed("active", true)
                            .classed("inactive", false);
                        healthcareLabel
                            .classed("active", false)
                            .classed("inactive", true);
                    }
                }
            });

    }).catch(function (error) {
        console.log(error);
    });
};

makeResponsive()

d3.select(window).on("resize", makeResponsive);