/******************************************************************************/
/*** Utility functions ********************************************************/
// We will store all graphical parameters globally
function s_(p, x) {
    window.params[p] = x;
    return x;
}

function g_(p) {
    return window.params[p];
}

function init_params() {
    INIT_PARAMS = {
        SHIFT    : [0,0],
        SCALE_X  : 10,
        SCALE_Y  : 10,
        TH       : 0,
        LEFT_SEL : 0,
        RIGHT_SEL: 41,
        MAP_X    : 600,
        MAP_Y    : 600,
        T_PUMPS  : true,
        T_LABELS : false,
        T_STREET : true,
        T_DEATHS : true,
        T_GRID   : false,
        DTH_COL  : 0,
    }
    window.params = {};
    for (y in INIT_PARAMS) {
        s_(y, INIT_PARAMS[y]);
    }
}

function init_ui() {
    function toggle_redraw(param) {
        s_(param, toggle(g_(param)));
        draw_all();
    }
    
    d3.select("#tog_pumps").on("click", function(d) { toggle_redraw("T_PUMPS") });
    d3.select("#tog_streets").on("click", function(d) { toggle_redraw("T_STREET") });
    d3.select("#tog_labels").on("click", function(d) { toggle_redraw("T_LABELS") });
    d3.select("#tog_deaths").on("click", function(d) { toggle_redraw("T_DEATHS") });
    d3.select("#tog_grid").on("click", function(d) { toggle_redraw("T_GRID") });
    
    d3.select("#dc_none").on("click", function(d) {s_("DTH_COL", 0); draw_all()});
    d3.select("#dc_gender").on("click", function(d) {s_("DTH_COL", 1); draw_all()});
    d3.select("#dc_age").on("click", function(d) {s_("DTH_COL", 2); draw_all()});
}

// k and th are scaling and rotation parameters. straightforward linear algebra
function coord_xform(xy_, grid = false) {
    var shift_ = g_("SHIFT");
    var scale_x = g_("SCALE_X");
    var scale_y = g_("SCALE_Y");
    
    scale_x = g_("MAP_X")/g_("SIZE_X");
    scale_y = g_("MAP_Y")/g_("SIZE_Y");
    
    var x1 = xy_[0] - g_("MIN_X");
    var y1 = xy_[1] - g_("MIN_Y");
    var x2 = x1*scale_x;
    var y2 = g_("MAP_Y") - y1*scale_y;
    
    if (grid == true) {
        console.log("Grid draw")
        var k = 0.05;
        x2 = Math.floor(k * x2)/k;
        y2 = Math.floor(k * y2)/k;
    }

    return [x2, y2];
}

// death data for tooltip formatting
function death_to_tooltip(d) {
    var text = 
        "Age: " + d.Age + "<br />" + 
        "Gender: " + d.Gender + "<br />" + 
        "Date: " + d.death_str;
    return text;
}

function toggle(x) {
    if (x == true) {
        return false;
    }
    else {
        return true;
    }
}

/******************************************************************************/
/*** Main Rendering ***********************************************************/
// draw the bottom left corner
function draw_debug() {
    var a1 = {x:g_("MIN_X"), y:g_("MAX_Y")};
    var a2 = {x:g_("MIN_X"), y:g_("MIN_Y")};
    var a3 = {x:g_("MAX_X"), y:g_("MIN_Y")};
    var X = [[a1, a2], [a2, a3]];
    
    d3.select("#debug").selectAll("*").remove();
    
    d3
        .select("#debug")
        .selectAll("polygon")
        .data(X)
        .enter()
        .append('polygon')
        .attr('points', function(d) {
            var z = d.map(function(u) {
                    var v = coord_xform(xy_ = [u.x, u.y]);
                    return String(v[0]) + "," + String(v[1]);
            }).reduce(function(a, b) {return a + " " + b});
            return z;
        })
        .attr("stroke","green");
}

function draw_streets() {
    d3
        .select("#streets")
        .selectAll("polyline")
        .data(streets)
        .enter()
        .append('polyline')
        .attr('points', function(d) {
            var z = d.map(function(u) {
                    var v = coord_xform(xy_ = [u.x, u.y]);
                    return String(v[0]) + "," + String(v[1]);
            }).reduce(function(a, b) {return a + " " + b});
            return z;
        })
        .attr("class", "street");
}

function draw_labels() {
    // hardcode some place names
    var places = [
        {name: "Work House", x: 9.5 , y: 13.5},
        {name: "Golden Square", x: 10 , y: 8},
        {name: "Oxford Street", x: 9.75, y: 16.75},
        {name: "Broad Street", x: 12, y: 12},
        {name: "Regent Street", x: 6, y: 11}
    ];
    
    var places_coords = places.map(function(d) {
        d.coords = coord_xform(xy_ = [d.x, d.y]);
        return d;
    })
    
    d3
        .select("#labels")
        .selectAll("text")
        .data(places_coords)
        .enter()
        .append("text")
        .attr("x", function(d) {return d.coords[0]})
        .attr("y", function(d) {return d.coords[1]})
        .text(function(d) {return d.name})
        
}

function draw_pumps() {
    var pump_coords = pumps.map(function(d) {
        return coord_xform(xy_ = [d.x, d.y]);
    });
    
    d3
        .select("#pumps")
        .selectAll("circle")
        .data(pump_coords)
        .enter()
        .append("circle")
        .attr('cx', function(d) {return d[0]})
        .attr('cy', function(d) {return d[1]})
        .attr("stroke", "black")
        .attr("fill", "black")
        .attr("r", "8")
        .on("mouseover", function(d) {
            var xPosition = parseFloat(d3.select(this).attr("cx") + 14);
            var yPosition = parseFloat(d3.select(this).attr("cy") + 14);

            d3
                .select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .select("#value")
                .text("Pump");
            
            d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function() {
            d3.select("#tooltip").classed("hidden", true);
        })
}

function draw_deaths() {
    d3
        .select("#deaths")
        .selectAll("circle")
        .data(death_coords)
        .enter()
        .append("circle")
        .attr('cx', function(d) {return d.xy[0]})
        .attr('cy', function(d) {return d.xy[1]})
        .attr("class", function(d) {
            if (g_("DTH_COL") == 0) {
                return "Death";    
            }
            else if (g_("DTH_COL") == 1) {
                return d.Gender;
            }
            else {
                return "Age" + d.age;
            }
                
        })
        .attr("r", "4")
        .on("click", function(d) {
            // console.log(d)
        })
        // this part leans on Chapter 10 of the Murray book
        .on("mouseover", function(d) {
            var xPosition = parseFloat(d3.select(this).attr("cx") + 14);
            var yPosition = parseFloat(d3.select(this).attr("cy") + 14);

            d3
                .select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .select("#value")
                .html(death_to_tooltip(d));
            
            d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function() {
            d3.select("#tooltip").classed("hidden", true);
        })
        
}

function draw_gender() {
    var Width = 125;
    var Height = 250;
    var Pad = 50;
    
    var c_male = 0;
    var c_female = 0;
    for (let i = 0; i < death_coords.length; i++) {
        if (death_coords[i].Gender == "Male") {
            c_male++;
        }
        else {
            c_female++;
        }
    }
    
    gender_data = [{i:0, count:c_male},{i:1, count:c_female}];

    x_scale = d3.scale.linear().range([Pad, Width]).domain([0, 1]);
    var y_scale = d3.scale.linear().domain([0, d3.max([c_male, c_female])]).range([200, Pad]);
    var y_axis = d3.svg.axis().scale(y_scale).orient("left");
    var x_axis = d3.svg.axis().scale(x_scale).tickFormat(function(i) {return ["Male" , "Female"][i];})

    d3
        .select("#gaxis")
        .append("g")
        .attr("transform", "translate(" + Pad +",0)")
        .call(y_axis);
        
    d3
        .select("#gaxis")
        .append("g")
        .attr("transform", "translate(0, 200)")
        .call(x_axis);
        
    d3
        .select("#male")
        .selectAll("rect")
        .data(gender_data)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {return x_scale(d.i)})
        .attr("width", 75)
        .attr("y", function(d) {return y_scale(d.count)})
        .attr("height", function(d) {return y_scale(0) - y_scale(d.count)})
        .attr("class", function(d, i) {return ["Male", "Female"][i]})
    
}

function draw_ages() {
    var Width = 350;
    var Height = 250;
    var Pad = 50;
    
    var age_counts = Array(6).fill(0);
    var d;
    for (let i = 0; i < death_coords.length; i++) {
        d = death_coords[i];
        age_counts[d.age] = age_counts[d.age] + 1;
    }
    var ages = ["0-10", "11-20", "21-40", "41-60", "61-80", "> 80"];
    age_data = [];
    for (let i = 0; i < 6; i++) {
        age_data[i] = {
            age : ages[i],
            count : age_counts[i]
        }
    }
    
    var x_scale = d3.scale.linear().range([Pad, Width - Pad]).domain([0, 5]);
    var y_scale = d3.scale.linear().domain([0, d3.max(age_counts)]).range([200, Pad]);
    var x_axis = d3.svg.axis().scale(x_scale)
        .tickValues([0,1,2,3,4,5])
        .tickFormat(function(i) {return ages[i]})
        .orient("bottom");
    var y_axis = d3.svg.axis().scale(y_scale).orient("left");
    
    d3
        .select("#ageaxis")
        .append("g")
        .attr("transform", "translate(" + Pad +",0)")
        .call(y_axis)
        
    d3
        .select("#ageaxis")
        .append("g")
        .attr("transform", "translate(0, 200)")
        .call(x_axis)
        
    d3
        .select("#ages")
        .selectAll("rect")
        .data(age_data)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {return x_scale(i)})
        .attr("width", 50)
        .attr("y", function(d) {return y_scale(d.count)})
        .attr("height", function(d) {return y_scale(0) - y_scale(d.count)})
        .attr("class", function(d, i) {return "Age" + i})
}

function draw_ts() {
    var Width = 600;
    var Height = 150;
    var Pad = 50;
    
    var N = deathdays.length;
    var day_names = deathdays.map(function(x) {return x.date});
    var x_scale = d3.scale.linear()
        .domain([0, N])
        .range([Pad, Width])
    var y_scale = d3.scale.linear()
        .domain([0, d3.max(deathdays.map(function(x) {return +x.deaths}))])
        .range([Height, Pad]);
    var x_axis = d3.svg.axis().scale(x_scale)
        .tickFormat(function(i) {return day_names[i];})
    var y_axis = d3.svg.axis().scale(y_scale).orient("left");
    
    d3
        .select("#tsaxis")
        .append("g")
        .attr("transform", "translate(" + 50 +",0)")
        .call(y_axis);
        
    d3
        .select("#tsaxis")
        .append("g")
        .attr("transform", "translate(" + 0 +",150)")
        .call(x_axis);
        
    d3
        .select("#days")
        .selectAll("rect")
        .data(deathdays)
        .enter()
        .append("rect")
        .attr("x", function(d, i) { return x_scale(i)})
        .attr("width", Width/N)
        .attr("y", function(d) {return y_scale(+d.deaths)})
        .attr("height", function(d) {return Height - y_scale(+d.deaths)})
        .attr("fill", "black")
        
    // create an invisible layer for interacting
    d3
        .select("#fg")
        .selectAll("rect")
        .data(deathdays)
        .enter()
        .append("rect")
        .attr("x", function(d, i) { return x_scale(i)})
        .attr("width", Width/N)
        .attr("y", 0)
        .attr("height", Height)
        .attr("class", function(d) {
            if (d.j >= g_("LEFT_SEL") & d.j <= g_("RIGHT_SEL")) {
                return "selected";
            }
            else {
                return "hidden";
            }
        })
        .on("click", function(d) {
            s_("SELECTED", d.j);
            var left = g_("LEFT_SEL");
            var right = g_("RIGHT_SEL");
            if (d.j <= left) {
                s_("LEFT_SEL", d.j);
            }
            else if (d.j >= right) {
                s_("RIGHT_SEL", d.j)
            }
            else {
                var diff_l = Math.abs(left - d.j);
                var diff_r = Math.abs(right - d.j);
                if (diff_l < diff_r) {
                    s_("LEFT_SEL", d.j);
                }
                else {
                    s_("RIGHT_SEL", d.j);
                }
            }
            draw_all();
        })
}

function draw_all() {
    
    // transform coordinates and filter
    death_coords = deaths.flatMap(function(d) {
        d.xy = coord_xform(xy_ = [d.x, d.y], grid = g_("T_GRID"));
        
        if (d.j >= g_("LEFT_SEL") & d.j <= g_("RIGHT_SEL")) {
            return d;
        }
        else {
            return [];
        }
    });
    d3.select("#total").text("Total Deaths: " + death_coords.length);
    
    ["#tsaxis", "#days", "#fg", "#pumps", "#labels", "#streets", 
    "#ages", "#ageaxis", "#male", "#female", "#gaxis", "#deaths"]
        .map(function(x){ d3.select(x).selectAll("*").remove()});
    
    // draw everything
    if (g_("T_STREET") == true) {draw_streets(); }
    if (g_("T_LABELS") == true) {draw_labels(); }
    if (g_("T_DEATHS") == true) {draw_deaths(); }
    if (g_("T_PUMPS") == true) {draw_pumps(); }
    draw_gender();
    draw_ages();
    //draw_debug();
    draw_ts();
}

/******************************************************************************/
/*** Data Transformation ******************************************************/
// This is kept seperate from data loading so we always know all data is loaded
function xform_data() {
    console.log("Transforming data...")

    // get x and y range from streets data, to help with scaling
    var X = streets.flatMap(function(u) { return u.map(function(v) {return v.x})});
    var Y = streets.flatMap(function(u) { return u.map(function(v) {return v.y})});
    s_("MIN_X", d3.min(X));
    s_("MAX_X", d3.max(X));
    s_("SIZE_X", d3.max(X) - d3.min(X));
    s_("MIN_Y", d3.min(Y));
    s_("MAX_Y", d3.max(Y));
    s_("SIZE_Y", d3.max(Y) - d3.min(Y));
    
    var map_gender = {"0":"Male", "1":"Female"};
    var map_age = {"0":"0-10", "1":"11-20", "2":"21-40", "3":"41-60", "4":"61-80", "5":"> 80"};
    
    // the deathdays and deaths_age_sex datasets need to be joined 
    // also, store an integer version of the date
    var j = 0;
    deathdays = deathdays.map(function(x) {
        x.j = j;
        j ++;
        return x;
    })
    var d_str = deathdays.flatMap(function(x) {return Array(+x.deaths).fill(x.date) });
    var d_int = deathdays.flatMap(function(x) {return Array(+x.deaths).fill(x.j) });
    var i = 0;
    deaths = deaths.map(function (x) {
        x['death_str'] = d_str[i];
        x['j'] = d_int[i];
        x['Age'] = map_age[x.age];
        x['Gender'] = map_gender[x.gender];
        i ++;
        return x;
    })
    
    draw_all();
}

/******************************************************************************/
/*** Data Loading *************************************************************/
function load_csv(file_name, data_name, callback) {
    d3.csv(file_name, function(data) {
        window[data_name] = data;
        console.log("Loaded " + data_name);
        callback();
    })
}

function load_deaths()    { load_csv("deaths_age_sex.csv", "deaths", xform_data) }
function load_deathdays() { load_csv("deathdays.csv", "deathdays", load_deaths) }
function load_pumps()     { load_csv("pumps.csv", "pumps", load_deathdays) }

// this function loads the data and kicks off the entire visualization
function start_viz() {
        d3.json('streets.json', function(data) {
        streets = data;
    	console.log("Loaded streets");
    	load_pumps();
    })
}
