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
