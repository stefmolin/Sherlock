/**************************************************
******    DATA PROCESSING RULES FUNCTIONS    ******
**    Functions for Sherlock to make decisions   **
**    on the data without needing human input.   **
**************************************************/

/* Change in the count of a column and return date of first change and values

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            options = a dictionary with one entry "columnToCount" the col_name to be checked

Returns:   The day and values on the first day that is different or false for no change

Examples:
detectChangeInCount([{'day' : 1, 'test' : 2}, {'day' : 1, 'test': 1},
                    {'day' : '2017-08-02', 'test' : 3}, {'day' : '2017-08-02', 'test' : 23},
                    {'day' : '2017-08-02', 'test' : 'changed!'}], {columnToCount:'test'})
*/
function detectChangeInCount(json, options){
  return changeInCount(getCounts(json, options.columnToCount));
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
      counts[entry] = {day : current_date, count : 1, values : [json[i][columnToCount]]};
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

/* Check change in a value from day to day

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            options = dictionary with key "columns" containing the col_name's to be checked

Returns:   Dictionary with keys 'changes' which is a String version of the columns changed to what value and on what day; and 'change_list' which can be used for debugging

Note that this is relying on the data being sorted by day already.
*/
function detectChangeInValue(json, options) {
  var changes_list = [];
  let columns = options.columns;
  for (var i in columns) {
    var col = columns[i];
    var check = changeInValue(json, col);
    if (check !== false) {
      changes_list.push({col_name : col, day : check.day, value : check.value});
    }
  }
  if (changes_list.length == 0) {
    return false;
  } else {
    var print_strings = [];
    for (var i in changes_list) {
      print_strings.push(changes_list[i].col_name + ' changed to ' + changes_list[i].value + ' on ' + changes_list[i].day);
    }
    return {changes : print_strings.join(', '), change_list : changes_list};
  }
}

function changeInValue(json, columnToCheck) {
  var current_value;
  for (var i = 0; i < json.length; i ++) {
    if (i === 0) {
      current_value = json[0][columnToCheck];
    }
    var next_value = json[i][columnToCheck];
    if (current_value !== next_value) {
      return {day : json[i].day, value : json[i][columnToCheck]};
    }
  }
  return false;
}

/* Check if max date is more than threshold days ago.

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            options = dictionary with key "threshold": number of days ago that the max date must be greater than be considered recent.

Returns: True if the data is considered recent, false otherwise.*/
function isRecent(json, options) {
  var dates = [];
  for (var i in json) {
    dates.push(new Date(json[i].day));
  }
  var maxDate = new Date(Math.max.apply(null, dates));
  const oneDay = 24*60*60*1000;
  var difference = (new Date() - maxDate)/oneDay;
  if (difference > options.threshold) {
    return false;
  } else {
    return true;
  }
}

/*Check if percent change day over day for a specific column is too much.

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            options = dictionary with key "column" for the column to check from the data and "threshold" as a percent (decimal).

Returns: True if the percent change is stable, false otherwise.*/
function isPercentChangeStable(json, options) {
  let column = options.column;
  let threshold = options.threshold;
  for (var i = 1; i < json.length; i++) {
    let old_value = json[i - 1][column];
    let new_value = json[i][column];
    if (Math.abs(percentChange(new_value, old_value)) > threshold) {
      return false;
    }
  }
  return true;
}

function percentChange(new_value, old_value) {
  return (new_value - old_value) / old_value;
}

/*Checks if the max value is equal to the provided value.

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            options = a dictionary with keys "column" for the column to check from the data and "value" for the value to check if it is equal to the max.

Returns: True if max value is equal to the provided value, false otherwise.*/
function checkMaxValue(json, options) {
  let column = options.column;
  let value = options.value;
  var values = [];
  for (var i in json) {
    values.push(json[i][column]);
  }
  var maxValue = Math.max.apply(null, values);
  if (maxValue == value) {
    return true;
  } else {
    return false;
  }
}
