/**************************************************
********          DISPLAY FUNCTIONS       *********
**************************************************/
function toggleElement(id){
  var element = document.getElementById(id);
  if (element.style.display === "none") {
      element.style.display = "inline-block";
  } else {
      element.style.display = "none";
  }
}

function hideAllButtons() {
  const buttons = ['left_action_button', 'center_action_button', 'right_action_button'];
  turnOff(buttons);
}

function turnOffCardExtras() {
  const elements = ['loading_indicator', 'chart'];
  turnOff(elements);
}

function turnOff(elements) {
  for (var e in elements) {
    document.getElementById(elements[e]).style.display = "none";
  }
}

function setCardTitle(title) {
  document.getElementById("card_title").innerHTML = title;
}

function setCardDescription(description) {
  document.getElementById("card_description").innerHTML = description;
}

/**************************************************
********      DECISION TREE FUNCTIONS     *********
****   Functions for traversing the decision   ****
****   trees, maniuplating and transitioning   ****
****   between cards.                          ****
**************************************************/
function startTraversal(json, client_id, campaign_id, start_date, end_date) {
  // hide all the buttons
  hideAllButtons();

  // get the first card
  const initialCard = getStartNode(json);

  // display the parts for loading
  setCardTitle(initialCard.title);
  setCardDescription(initialCard.description);
  toggleElement("loading_indicator");
  makeRequest(initialCard.query_url.format({client_id : client_id, campaign_id : campaign_id,
                                            start_date : start_date, end_date : end_date}),
              "POST", populateCard, dataUnavailable, initialCard,
              json, client_id, campaign_id, start_date, end_date);
}

function populateButton(card, buttonPath, client_id, campaign_id, start_date, end_date) {
  const nextCardId = card.action.result[buttonPath].next_card;
  if (nextCardId !== undefined && nextCardId !== null) {
    if (card.action.result[buttonPath].button_location !== undefined && card.action.result[buttonPath].button_location !== null) {
      const buttonLocation = card.action.result[buttonPath].button_location + "_action_button";
      const buttonText = card.action.result[buttonPath].button_text;
      var button = document.getElementById(buttonLocation);
      button.setAttribute("onClick", "changeCard(decision_tree, '" + nextCardId + "', " + client_id + ", " + campaign_id + ", '" + start_date + "', '" + end_date + "');");
      button.innerHTML = buttonText;
      toggleElement(buttonLocation);
    }
  }
}

function populateCard(data, card, json, client_id, campaign_id, start_date, end_date) {
  var resultOfCheck = null;
  if (card.action.function !== 'undefined' && card.action.function !== null) {
    if (card.action.additional_arguments.length > 1) {
      resultOfCheck = window[card.action.function](data, ...card.action.additional_arguments);
    } else {
      resultOfCheck = window[card.action.function](data, card.action.additional_arguments);
    }
  }
  toggleElement("loading_indicator");
  if (card.action.ask_user == true) {
    // populate the buttons bc user needs to move the process forward
    var buttonPaths = [true, false];
    for (var i in buttonPaths) {
      populateButton(card, buttonPaths[i], client_id, campaign_id, start_date, end_date);
    }
  } else {
    if (resultOfCheck !== null && resultOfCheck !== false) {
      if (card.action.result.true.description !== undefined && card.action.result.true.description !== null) {
        setCardDescription(card.action.result.true.description.format(resultOfCheck));
      }
      if (card.action.result.true.follow_up !== 'undefined' && card.action.result.true.follow_up !== undefined) {
        const followUpResults = window[card.action.result.true.follow_up.function](data, ...card.action.result.true.follow_up.additional_arguments);
      }
      const nextCardId = card.action.result.true.next_card;
      if (nextCardId !== undefined && nextCardId !== null) {
        if (card.action.result.true.button_location !== undefined && card.action.result.true.button_location !== null) {
          const buttonLocation = card.action.result.true.button_location + "_action_button";
          const buttonText = card.action.result.true.button_text;
          var button = document.getElementById(buttonLocation);
          button.setAttribute("onClick", "changeCard(decision_tree, '" + nextCardId + "', " + client_id + ", " + campaign_id + ", '" + start_date + "', '" + end_date + "');");
          button.innerHTML = buttonText;
          toggleElement(buttonLocation);
        } else {
          // automatically advance since this card has no buttons
          changeCard(json, nextCardId, client_id, campaign_id, start_date, end_date);
        }
      }
    } else {
      // automatically go to the next card
      const nextCardId = card.action.result.false.next_card;
      if (nextCardId !== undefined) {
        changeCard(json, nextCardId, client_id, campaign_id, start_date, end_date);
      }
    }
  }
}

function dataUnavailable() {
  setCardTitle("Red Herring (!)");
  setCardDescription("Well, this is truly embarrassing! Sherlock got fooled by a red herring. Please come back and try again later when he's gotten his act together.");
  turnOffCardExtras();
  hideAllButtons();
  turnOff(['investigation_info']);
}

function getStartNode(json) {
  return getCardById(json, "start");
}

function changeCard(json, id, client_id, campaign_id, start_date, end_date) {
  const nextCard = getCardById(json, id);
  setCardTitle(nextCard.title);
  setCardDescription(nextCard.description);
  hideAllButtons(); // change this when we have the JIRA ticket creation available
  if (id.toLowerCase() === 'end') {
    turnOff(['investigation_info']);
    turnOffCardExtras();
  }
  if (nextCard.query_url !== 'undefined' && nextCard.query_url !== undefined && nextCard.query_url !== null) {
    turnOffCardExtras();
    toggleElement('loading_indicator');
    makeRequest(nextCard.query_url.format({client_id : client_id, campaign_id : campaign_id,
                                              start_date : start_date, end_date : end_date}),
                "POST", populateCard, dataUnavailable, nextCard, json,
                client_id, campaign_id, start_date, end_date);
  } else {
    turnOffCardExtras();
    if (nextCard.action !== undefined && nextCard.action.result !== undefined){
      for (var button in nextCard.action.result) {
        populateButton(nextCard, button, client_id, campaign_id, start_date, end_date);
      }
    }
  }
}

function getCardById(json, id) {
  const cards = json.cards;
  for (var i = 0; i < cards.length; i ++) {
    if (cards[i].id === id) {
      return cards[i];
    }
  }
  throw new Error("That card doesn't exist!");
}

/**************************************************
********        REQUEST FUNCTIONS         *********
******   Interactions with the Watson API   *******
**************************************************/
function makeRequest(url, method, dataProcessor, errorHandler, ...dataProcessorArgs){ // wrapper function for the requests
  method = method.toUpperCase();
  if (method === "GET") {
    return getRequest(url, 0, dataProcessor, errorHandler, ...dataProcessorArgs);
  } else if (method === "POST"){
    return postRequest(url, 0, dataProcessor, errorHandler, ...dataProcessorArgs);
  } else {
    throw new Error('Request method not supported');
  }
}

// this function should make the post request and return the URL where the results can be found
function postRequest(url, attempts, dataProcessor, errorHandler, ...dataProcessorArgs) {
  const max_attempts_allowed = 5;
  const time_between_attempts_ms = 5000;
  fetch(url, {
    method: 'post'
  })
  .then(function(response) {
    console.log(response.status);
    if (response.ok) {
      return response.json();
    } else if (attempts >= max_attempts_allowed) {
      throw new TimeoutError('Exhausted available attempts to request the data');
    } else {
      throw new Error('Something went wrong!');
    }
  })
  .then((data) => setTimeout(getRequest, 1000, data.result, 0, dataProcessor, errorHandler, ...dataProcessorArgs))
  .catch(function(error){
    console.log(error);
    attempts += 1;
    if (error instanceof TimeoutError || attempts >= max_attempts_allowed) {
      // no attempts left; show error
      toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
      errorHandler();
    } else {
      // wait and try request again
      console.log('Trying POST again ' + url);
      setTimeout(postRequest, time_between_attempts_ms,
        url, attempts, dataProcessor, errorHandler, ...dataProcessorArgs);
    }
  })
}

// this function would retrieve the data and run the function passed in on it
function getRequest(url, attempts, dataProcessor, errorHandler, ...dataProcessorArgs) {
  const max_attempts_allowed = 5;
  const time_between_attempts_ms = 5000;
  fetch(url)
  .then(function(response) {
    console.log(response.status);
    if (response.status === 200) {
      return response.json();
    } else if (attempts >= max_attempts_allowed) {
      throw new TimeoutError('Exhausted available attempts to get the data');
    } else {
      throw new Error('Something went wrong!');
    }
  })
  .then((data) => dataProcessor(data.results, ...dataProcessorArgs))
  .catch(function(error){
    console.log(error);
    attempts += 1;
    if (error instanceof TimeoutError || attempts >= max_attempts_allowed) {
      // no attempts left; show error
      toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
      errorHandler();
    } else {
      // wait and try request again
      console.log("Trying GET request again " + url);
      setTimeout(getRequest, time_between_attempts_ms,
        url, attempts, dataProcessor, errorHandler, ...dataProcessorArgs);
    }
  })
}

// Custom error for failures to work with Watson API
class TimeoutError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

/**************************************************
********     CARD-SPECIFIC FUNCTIONS    ***********
****  Response processing and error handling   ****
****  functions for specific card layouts.     ****
**************************************************/
function lookupCampaigns() {
  const client_id = document.getElementById("client_id").value;
  if (/\d+/.test(client_id) && client_id > 0){
    console.log('client_id is valid, looking up campaigns...');
    toggleElement("loading_indicator"); // show loading indicator
    if (document.getElementById("campaign_selector").style.display !== "none") {
      toggleElement("campaign_selector"); // show the options
    }
    // TODO this will need to be changed to the Docker version to access Watson
    const url = "http://127.0.0.1:53865/api/v1/query/sherlock/campaign_lookup?client_id=" + client_id;
    makeRequest(url, "POST", fillInCampaignOptions, campaignsUnavailable);
  } else {
    console.log(client_id);
    document.getElementById('client_id').focus();
    document.getElementById('client_id').reportValidity();
  }
}

function campaignsUnavailable() {
  var campaign_selector = document.getElementById("campaign_selector");
  var option = document.createElement("option");
  option.text = "[ERROR] Unable to pull data."; // show users the campaign name
  option.value = null; // grab the ID when we pull in this field on Sherlock's end
  campaign_selector.add(option);
  toggleElement("campaign_selector"); // show the options
  toggleElement("campaign_lookup_button"); // don't show the button anymore
}

function fillInCampaignOptions(campaigns) {
  try {
    if (campaigns != null) {
      var campaign_selector = document.getElementById("campaign_selector");
      for (var i = 0; i < campaigns.length; i++){
        var option = document.createElement("option");
        option.text = campaigns[i].campaign_name; // show users the campaign name
        option.value = campaigns[i].campaign_id; // grab the ID when we pull in this field on Sherlock's end
        campaign_selector.add(option);
      }
      if (campaign_selector.options.length == 1) {
        // this is most likely not a valid advertiser, so show that in the dropdown hint
        campaign_selector.options[0].text = "No campaigns for that client";
        campaign_selector.selectedIndex = 0;
      } else {
        campaign_selector.options[0].text = "Select a campaign";
        if (campaign_selector.options.length > 2) {
          /* the selector has 2 options, one is the non-selectable one and the other is valid so only need to move
          the selector when we have more than 2 to to the non-selectable one */
          campaign_selector.selectedIndex = 0; // set the selector to something that prompts selecting the proper value
        }
        // only update the buttons if we actually got campaigns back
        toggleElement("campaign_lookup_button"); // don't show the button anymore
        toggleElement("submit_parameters"); // show the button to submit the form
      }
      console.log('Successfully retrieved data!');
      toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
      if (document.getElementById("campaign_selector").style.display === "none") {
        toggleElement("campaign_selector"); // show the options
      }
    }
  } catch (error) {
    // TODO something is wrong with the data, should we request it again or just fail?
    toggleElement("loading_indicator");
    campaignsUnavailable();
  }
}
