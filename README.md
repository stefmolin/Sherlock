<img src="screenshots/sherlock_logo_white_on_black.png?raw=true" align="center" width="300" alt="Sherlock: Performance Troubleshooting Web App">

# Sherlock: Performance Troubleshooting Wizard
Flask + JavaScript web app for investigating performance issues.

## Defining a Decision Tree

1. First card must have ID "start".                                          
2. Last card must have ID "end".    
3. `function` is the JavaScript function that will be used on the data. Note that this must be spelled exactly as the function is defined.       
4. `additional_arguments` lists (in order) arguments besides the data itself to the function in `#3`.                                            
5. `ask_user` indicates whether Sherlock should wait for user input or not.
6. `description` after the result is calculated can only use replacements that will be in the JavaScript function's return value.                          
7. Buttons that only define `next_card` will automatically advance.         
8. Buttons that define `button_location`, but not `button_text` will have the last text they were set with. However, it's best to be explicit and define your own.                                                         
9. If you take advantage of the `follow_up` section, note that this will only show the data, not act as a new card. Use this to graph the values after Sherlock makes a decision so the user can see what Sherlock saw and accept it. Note that if you need a user response on the same data afterwards, you will need to define a separate card.                     
10. Title and description in the outer section of the card will show when the data loads. The description will change when the data has been retrieved if it is provided again in the result section.                 
11. To properly switch cards, the ID's for `next_card` and that card being referenced must match exactly.                                           
12. The `query_url` must match the API endpoint for that query resource and must have a query string appended with all the values that need to be replaced.                                                                
13. Cards that are meant to display text only and require buttons should define `ask_user` to true, since the user needs to answer to move forward to the next card.

### Sample Decision Tree
Here is an example of a decision tree defined in YAML. Note that Sherlock needs the decision tree as a JSON, so you will need to convert it first.
```
cards:
    - id: 'start'
      title: 'Checking Number of Campaigns...'
      query_url: http://127.0.0.1:53865/api/v1/query/sherlock/setup/new_campaign?client_id={client_id}&start_date={start_date}&end_date={end_date}
      description:
      action:
        ask_user: false
        function: detectChangeInCount
        additional_arguments: campaign_name
        result:
          true:
              description: "Seems that someone launched/paused (a) campaign(s): {values} on this account on {day}. This can affect your campaign's CR."
              next_card: 'cr_setup_sampling_ratio_rule'
              button_location: center
              button_text: Acknowledge
          false:
              next_card: 'cr_setup_sampling_ratio_rule'

    ...

    - id: 'end'
      title: 'Finished!'
      description: "We hope you enjoyed using Sherlock for the investigation; feel free to discuss it with your TAM or AX if needed."
```                                            

### Converting YAML Decision Tree into JSON Decision Trees
1. Convert your YAML into JSON. There are many converters available online; I like [this one](https://codebeautify.org/yaml-to-json-xml-csv). This will won't let you convert it until your YAML is valid.
2. Either create a new JSON decision tree file in `static/decision_trees` by copying one of the other ones, or modify a current one by pasting your JSON from line 3 down, but make sure you keep the last line. DO NOT CHANGE ANYTHING ELSE. Note that the name of the tree variable cannot be changed or Sherlock won't be able to use it. You can name the file whatever you want though.
3. If you are adding a new metric, you will need to make sure that Sherlock can allow people to select that metric (see `templates/parameter_entry.html`) and that Sherlock can then read in the metric (see `templates/investigate.html`).

## Functions
The following JavaScript functions are defined and available for use. Take note of their signatures and remember the first argument will always be passed in by Sherlock. Should you need to define more, put them in the `static/js/sherlock_rules.js` file.

### detectChangeInCount
```
Change in the count of a column and return date of first change and values

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            columnToCount = the col_name to be checked

Returns:   The day and values on the first day that is different or false for no change

Examples:
detectChangeInCount([{'day' : 1, 'test' : 2}, {'day' : 1, 'test': 1},
                    {'day' : '2017-08-02', 'test' : 3}, {'day' : '2017-08-02', 'test' : 23},
                    {'day' : '2017-08-02', 'test' : 'changed!'}], 'test')
```

### detectChangeInValue
```
Check change in a value from day to day

Parameters: json = the query result from the API where each row of the result is
                   an entry in the outer array and each row is represented as
                   {col_name : value}
            columns = the col_name's to be checked

Returns:   The day and values on the first day that is different or false for no change

Note that this is relying on the data being sorted by day already.
```

### isRecent
Check if max date is more than threshold days ago. Additional argument is `threshold` as a percent (decimal).

### isPercentChangeStable
Check if percent change day over day for a specific column is too much. Additional arguments are `column` for the column to check from the data and `threshold` as a percent (decimal).

### checkMaxValue
Checks if the max value is equal to the provided value. Additional arguments are `column` for the column to check from the data and `value`.

### graphData
This isn't a rule, but it can also be used in the `function` attribute of the card definition. Additional arguments are `columnToGraph` for the column of the data you want to graph (dates must be the column `day`) and `yAxisFormat` for the type of formatting to use on the y-axis values (i.e. percent, currency, number, etc.)

## Requirements
Python 3, Flask, [Watson API](https://github.com/stefmolin/watson-api)

## Disclaimer
This is a work-in-progress and is being anonymized for GitHub.

## Screenshots
|Login|Data Collection|
| :---: | :---: |
|<img src="screenshots/sherlock_login_page.png?raw=true" align="center" width="600" alt="Sherlock Login">|<img src="screenshots/sherlock_sample_loading_data_page.png?raw=true" align="center" width="600" alt="Collecting data to troubleshoot issue">|

## Related Project
- [Watson API](https://github.com/stefmolin/watson-api)
