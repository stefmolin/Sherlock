/**************************************************
******    DATA PROCESSING RULES FUNCTIONS    ******
**    Functions for Sherlock to make decisions   **
**    on the data without needing human input.   **
**************************************************/

/* Change in the count of a column and return date of first change and values

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            columnToCount = the col_name to be checked

Returns:   The day and values on the first day that is different or false for no change

Examples:
detectChangeInCount([{'day' : 1, 'test' : 2}, {'day' : 1, 'test': 1},
                    {'day' : '2017-08-02', 'test' : 3}, {'day' : '2017-08-02', 'test' : 23},
                    {'day' : '2017-08-02', 'test' : 'changed!'}], 'test')
*/
function detectChangeInCount(json, columnToCount){
  return changeInCount(getCounts(json, columnToCount));
}

function getCounts(json, columnToCount) {
  var current_date = 0;
  var entry = -1;
  var counts = [];
  for (var i = 0; i < json.length; i ++) {
    if (json[i].day === current_date) {
      counts[entry].count += 1;
      counts[entry].values.push(json[i][columnToCount]);
    } else {
      entry += 1;
      current_date = json[i].day;
      counts[entry] = {day : current_date, count : 1 , values : [json[i][columnToCount]]};
    }
  }
  return counts;
}

function changeInCount(json){
  var current_count = 0;
  for (var i = 0; i < json.length; i ++) {
    if (i === 0) {
      current_count = json[i].count;
    } else {
      if (json[i].count !== current_count) {
        return {day : json[i].day, values : json[i].values.join(', ')};
      }
    }
  }
  return false;
}

function rule2(){
  //TODO
}
