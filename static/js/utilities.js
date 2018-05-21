/**************************************************
********        UTILITY FUNCTIONS         *********
**************************************************/
String.prototype.format = function() {
   var content = this;
   for (var key in arguments[0]) { // replace arguments using a dictionary provided as the first argument
      var replacement = '{' + key + '}';
      content = content.replace(replacement, arguments[0][key]);
   }
   return content;
};

function filterDates(dates){
  var start_date = dates[0];
  var date_break = 14;
  dates.reverse();
  for(i = 0; i < dates.length; i++){
  	if(i % date_break !== 0){
      	dates[i] = "";
    }
  }

  if(dates.length < date_break){
    dates[dates.length - 1] = start_date;
  }
  return dates.reverse();
}

/**************************************************
********         GRAPH FUNCTIONS          *********
**************************************************/
// Note that you need Chart.js, Numeral.js, and Moment.js for this function
function graphData(data, columnToGraph, yAxisFormat, graphType, isDatetime){
  var chart = document.getElementById('graph-1');
  var ctx = chart.getContext('2d');
  chart.style.display = "inline-block";

  var date_list = [];
  var values = [];
  for (var i = 0; i < data.length; i ++) {
    date_list.push(data[i].day);
    values.push(data[i][columnToGraph]);
  }
  var myChart = new Chart(ctx, {
    type: graphType,
    data: {
      // x-axis
      labels: date_list,
      datasets: [{
        data: values,
        // line style
        fill: false,
        borderColor: "#FFFFFF",
        borderWidth: 1.25,
        backgroundColor: "#FFFFFF"
      }]
    },
    options: {
      events: [], // don't listen to any events
      legend: {
        display: false // don't show legend since it is just 1 series
      },
      tooltips: {
        enabled: false // don't show tooltips bc they are not needed
      },
      scales: { // don't show x or y axis
        xAxes: [{
          display: true,
          gridLines: {
            display: true,
            color: "rgba(255, 255, 255, 1)",
            drawOnChartArea: false,
          },
          ticks: {
            maxRotation: 0,
            fontColor: "#FFFFFF", // white labels
            autoSkip: false,
            callback: function(value, index){ //value is the first argument used with this function index is second; can't change
              var x_axis_ticks = [];
              x_axis_ticks = filterDates(date_list);
              if(x_axis_ticks[index] == ""){
                var entry;
                entry = null;
              } else if(isDatetime) {
                entry = moment(x_axis_ticks[index], "YYYY-MM-DD H:mm:ss").format('H:mm dd, MMM D');
              } else {
                entry = moment(x_axis_ticks[index], "YYYY-MM-DD").format('dd, MMM D');
              }
              return entry;
            }
          }
        }],
        yAxes: [{
          display: true,
          afterFit: function(scale) {
            scale.width = 60  //<-- set value as you wish
          },
          scaleLabel: {
            display: true,
            labelString: columnToGraph.replace(/_/g, " "),
            fontColor: '#ffffff',
            fontSize: 16,
          },
          ticks: {
            fontColor: "#FFFFFF", // white labels
            suggestedMin: 0, // minimum will be 0, unless there is a lower value.
            callback: function(label, index, labels) {
              if(index % 2 == 0){ // write the label for every other gridline
                if(yAxisFormat.toLowerCase() === 'percent'){
                  // percentages
                  format_string = '0,0.[00]a%';
                } else if(yAxisFormat.toLowerCase() === 'currency'){
                  // currency, show decimals
                  format_string = '0,0.[00]a';
                }
                else {
                  // site events alerts, no decimals
                  format_string = '0,0a';
                }
                return numeral(label).format(format_string);
              } else {
                return "";
              }
            }
          },
          gridLines: {
            display: true,
            drawBorder: false,
            color: "rgba(255, 255, 255, 1)", // color for the horizontal grid lines
            lineWidth: 0.25,
            tickMarkLength: 5, // how far the gridlines extend into the y-axis; they push the labels further left
            zeroLineColor: "rgba(255, 255, 255, 0.3)",  // color the horizontal grid line at y = 0 (black default)
          }
        }]
      },
      layout: {
        // add padding so the red x on the last point doesn't get cut off
        padding: {
            left: 20,
            right: 40,
            top: 40,
            bottom: 0
        }
      },
      responsive: true,
      // to load quickly, remove animations:
      animation: {
        duration: 0, // general animation time
      },
      hover: {
          animationDuration: 0, // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      elements: {
        line: {
            tension: 0, // disables bezier curves
        }
      }
    }
  });
}
