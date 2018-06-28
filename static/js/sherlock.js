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
  let elements = ['loading_indicator'];
  let graphNodes = document.querySelectorAll('[id^="graph-"]');
  for (var i = 0; i < graphNodes.length; i ++) {
    elements.push(graphNodes[i].id);
  }
  turnOff(elements);
}

function turnOff(elements) {
  for (var e in elements) {
    document.getElementById(elements[e]).style.display = "none";
  }
}

function turnOn(elements) {
  for (var e in elements) {
    document.getElementById(elements[e]).style.display = "inline-block";
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
function startTraversal(json, partner_id, client_id, campaign_id, start_date, end_date) {
  // hide all the buttons
  hideAllButtons();

  // get the first card
  const initialCard = getStartNode(json);

  // display the parts for loading
  setCardTitle(initialCard.title);
  setCardDescription(initialCard.description);
  toggleElement("loading_indicator");
  makeRequest(initialCard.query_url.format({partner_id : partner_id,
                                            client_id : client_id, campaign_id : campaign_id,
                                            start_date : start_date, end_date : end_date}),
              "POST", populateCard, dataUnavailable, initialCard,
              json, partner_id, client_id, campaign_id, start_date, end_date);
}

function populateButton(card, buttonPath, partner_id, client_id, campaign_id, start_date, end_date) {
  const nextCardId = card.action.result[buttonPath].next_card;
  if (nextCardId !== undefined && nextCardId !== null) {
    if (card.action.result[buttonPath].button_location !== undefined && card.action.result[buttonPath].button_location !== null) {
      const buttonLocation = card.action.result[buttonPath].button_location + "_action_button";
      const buttonText = card.action.result[buttonPath].button_text;
      var button = document.getElementById(buttonLocation);
      button.setAttribute("onClick", "changeCard(decision_tree, '" + nextCardId + "', " + partner_id + ", " + client_id + ", " + campaign_id + ", '" + start_date + "', '" + end_date + "');");
      button.innerHTML = buttonText;
      toggleElement(buttonLocation);
    }
  }
}

function populateCard(data, card, json, partner_id, client_id, campaign_id, start_date, end_date) {
  var resultOfCheck = null;
  if (card.action.function !== 'undefined' && card.action.function !== null) {
    resultOfCheck = window[card.action.function](data, card.action.additional_arguments);
  }
  turnOff(["loading_indicator"]);
  if (resultOfCheck == 'error') {
    return;
  }
  if (card.action.ask_user == true) {
    // populate the buttons bc user needs to move the process forward
    var buttonPaths = [true, false];
    for (var i in buttonPaths) {
      populateButton(card, buttonPaths[i], partner_id, client_id, campaign_id, start_date, end_date);
    }
  } else {
    if (resultOfCheck !== null && resultOfCheck !== false) {
      if (card.action.result.true.description !== undefined && card.action.result.true.description !== null) {
        setCardDescription(card.action.result.true.description.format(resultOfCheck));
      }
      if (card.action.result.true.follow_up !== 'undefined' && card.action.result.true.follow_up !== undefined) {
        const followUpResults = window[card.action.result.true.follow_up.function](data, card.action.result.true.follow_up.additional_arguments);
      }
      const nextCardId = card.action.result.true.next_card;
      if (nextCardId !== undefined && nextCardId !== null) {
        if (card.action.result.true.button_location !== undefined && card.action.result.true.button_location !== null) {
          const buttonLocation = card.action.result.true.button_location + "_action_button";
          const buttonText = card.action.result.true.button_text;
          var button = document.getElementById(buttonLocation);
          button.setAttribute("onClick", "changeCard(decision_tree, '" + nextCardId + "', " + partner_id + ", " + client_id + ", " + campaign_id + ", '" + start_date + "', '" + end_date + "');");
          button.innerHTML = buttonText;
          toggleElement(buttonLocation);
        } else {
          // automatically advance since this card has no buttons
          changeCard(json, nextCardId, partner_id, client_id, campaign_id, start_date, end_date);
        }
      }
    } else {
      // automatically go to the next card
      const nextCardId = card.action.result.false.next_card;
      if (nextCardId !== undefined) {
        changeCard(json, nextCardId, partner_id, client_id, campaign_id, start_date, end_date);
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

function changeCard(json, id, partner_id, client_id, campaign_id, start_date, end_date) {
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
    makeRequest(nextCard.query_url.format({partner_id : partner_id,
                                           client_id : client_id, campaign_id : campaign_id,
                                           start_date : start_date, end_date : end_date}),
                "POST", populateCard, dataUnavailable, nextCard, json,
                partner_id, client_id, campaign_id, start_date, end_date);
  } else {
    turnOffCardExtras();
    if (nextCard.action !== undefined && nextCard.action.result !== undefined){
      for (var button in nextCard.action.result) {
        populateButton(nextCard, button, partner_id, client_id, campaign_id, start_date, end_date);
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
  const min_time_between_attempts_ms = 1000;
  const host = "http://watson.yourcompany.com";
  fetch(host + url, {
    method: 'post'
  })
  .then(function(response) {
    //console.log(response.status);
    if (response.ok) {
      return response.json();
    } else if (attempts >= max_attempts_allowed) {
      throw new TimeoutError('Exhausted available attempts to request the data');
    } else {
      throw new Error('Something went wrong!');
    }
  })
  .then((data) => setTimeout(getRequest, 500, data.result, 0, dataProcessor, errorHandler, ...dataProcessorArgs))
  .catch(function(error){
    //console.log(error);
    attempts += 1;
    if (error instanceof TimeoutError || attempts >= max_attempts_allowed) {
      // no attempts left; show error
      toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
      errorHandler();
    } else {
      // wait and try request again
      //console.log('Trying POST again ' + host + url);
      // increase time between attempts after each failure (1 second then 2, 3, 4, 5 seconds)
      setTimeout(postRequest, attempts * min_time_between_attempts_ms,
        url, attempts, dataProcessor, errorHandler, ...dataProcessorArgs);
    }
  })
}

// this function would retrieve the data and run the function passed in on it
function getRequest(url, attempts, dataProcessor, errorHandler, ...dataProcessorArgs) {
  const max_attempts_allowed = 5;
  const min_time_between_attempts_ms = 1000;
  const host = "http://watson.yourcompany.com";
  fetch(host + url)
  .then(function(response) {
    //console.log(response.status);
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
    //console.log(error);
    attempts += 1;
    if (error instanceof TimeoutError || attempts >= max_attempts_allowed) {
      // no attempts left; show error
      toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
      errorHandler();
    } else {
      // wait and try request again
      //console.log("Trying GET request again " + host + url);
      // increase time between attempts after each failure (1, 2, 3, 4, 5 seconds)
      setTimeout(getRequest, attempts * min_time_between_attempts_ms,
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

// For formatting the request URLs with the proper parameters
String.prototype.format = function() {
   var content = this;
   for (var key in arguments[0]) { // replace arguments using a dictionary provided as the first argument
      var replacement = '{' + key + '}';
      content = content.replace(replacement, arguments[0][key]);
   }
   return content;
};

/**************************************************
********     CARD-SPECIFIC FUNCTIONS    ***********
****  Response processing and error handling   ****
****  functions for specific card layouts.     ****
**************************************************/
function conditionalButtons(button, field, current_button, current_field) {
    let fieldToFill = document.getElementById(field);
    if (fieldToFill.value == null || fieldToFill.value === undefined || fieldToFill.value == "") {
      turnOn([button]);
    } else {
      // if the field we are going to show the button for is already filled, don't show the button again
      turnOff([button]);
    }

    // if we have filled a field that needs a button showing, remove the button
    let currentField = document.getElementById(current_field);
    if (currentField.value == null || currentField.value === undefined || currentField.value == "") {
      turnOn([current_button]);
    } else {
      // if the field we are going to show the button for is already filled, don't show the button again
      turnOff([current_button]);
    }

    // if both client and partner are filled, show campaign
    if (fieldToFill.value != "" && currentField.value != "") {
      turnOn(['campaign_lookup_button']);
    } else {
      turnOff(['campaign_lookup_button']);
    }

    // make sure only 1 button shows at once
    let partnerButtonShowing = document.getElementById('partner_lookup_button').style.display != "none";
    let clientButtonShowing = document.getElementById('client_lookup_button').style.display != "none";
    let campaignButtonShowing = document.getElementById('campaign_lookup_button').style.display != "none";
    if ((partnerButtonShowing + clientButtonShowing + campaignButtonShowing) >= 2) {
      // at least 2 buttons are on; show the highest level: partner > client > campaign
      if (partnerButtonShowing) {
        turnOff(['client_lookup_button', 'campaign_lookup_button']);
      } else if (clientButtonShowing) {
        turnOff(['campaign_lookup_button']);
      }
    }
}

function performLookup(id, selector, type) {
  const fieldValue = document.getElementById(id).value;
  if (/\d+/.test(fieldValue) && fieldValue > 0){
    const startDate = document.getElementById("start_date").value;
    const endDate = document.getElementById("end_date").value;
    if (type == "campaign") {
      // need to check if start_date and end_date are filled in otherwise don't allow the lookup
      if (startDate == "" || startDate == undefined) {
        focusOnMissingField("start_date");
        return;
      }
      if (endDate == "" || endDate == undefined) {
        focusOnMissingField("end_date");
        return;
      }
    }
    console.log('field is valid, looking up IDs...');
    toggleElement("loading_indicator"); // show loading indicator
    if (document.getElementById(selector).style.display !== "none") {
      toggleElement(selector); // show the options
    }
    if (type == "partner"){
      const url = "/api/v1/query/sherlock/partner_lookup?client_id=" + fieldValue;
      makeRequest(url, "POST", fillInPartnerOptions, partnersUnavailable);
    } else if (type == "client"){
      const url = "/api/v1/query/sherlock/client_lookup?partner_id=" + fieldValue;
      makeRequest(url, "POST", fillInClientOptions, clientsUnavailable);
    } else {
      // type == "campaign"
      const url = "/api/v1/query/sherlock/campaign_lookup?client_id={client_id}&start_date={start_date}&end_date={end_date}"
                  .format({client_id : fieldValue, start_date : startDate, end_date : endDate});
      makeRequest(url, "POST", fillInCampaignOptions, campaignsUnavailable);
    }
  } else {
    console.log(fieldValue);
    focusOnMissingField(id);
  }
}

function focusOnMissingField(id) {
  document.getElementById(id).focus();
  document.getElementById(id).reportValidity();
}

function partnersUnavailable() {
  optionsUnavailable('partner_selector', 'partner_lookup_button');
}

function clientsUnavailable() {
  optionsUnavailable('client_selector', 'client_lookup_button');
}

function campaignsUnavailable() {
  optionsUnavailable('campaign_selector', 'campaign_lookup_button');
}

function optionsUnavailable(selector, button) {
  var option_selector = document.getElementById(selector);
  var option = document.createElement("option");
  option.text = "[ERROR] Unable to pull data."; // show users the campaign name
  option.value = null; // grab the ID when we pull in this field on Sherlock's end
  option_selector.add(option);
  toggleElement(selector); // show the options
  toggleElement(button); // don't show the button anymore
}

function fillInPartnerOptions(partners) {
  try {
    if (partners != null) {
      var partner_selector = document.getElementById("partner_selector");
      for (var i = 0; i < partners.length; i++){
        var option = document.createElement("option");
        option.text = partners[i].partner_name; // show users the partner name
        option.value = partners[i].partner_id; // grab the ID when we pull in this field on Sherlock's end
        partner_selector.add(option);
      }
      if (partner_selector.options.length == 1) {
        // this is most likely not a valid advertiser, so show that in the dropdown hint
        partner_selector.options[0].text = "No partners for that client";
        partner_selector.selectedIndex = 0;
      } else {
        // only update the buttons if we actually got partners back
        toggleElement("partner_lookup_button"); // don't show the button anymore
        console.log('Successfully retrieved data!');
        toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
        if (partner_selector.options.length == 2) {
          document.getElementById('partner_id').value = partner_selector.options[1].value;
        } else {
          partner_selector.options[0].text = "Select a partner";
          if (partner_selector.options.length > 2) {
            /* the selector has 2 options, one is the non-selectable one and the other is valid so only need to move
            the selector when we have more than 2 to to the non-selectable one */
            partner_selector.selectedIndex = 0; // set the selector to something that prompts selecting the proper value
          }
        }
        if (document.getElementById('partner_id').value != "" && document.getElementById('client_id').value != ""){
          toggleElement("campaign_lookup_button"); // show the button to lookup campaigns
        }
      }
      if (partner_selector.style.display === "none" && partner_selector.options.length != 2) {
        toggleElement("partner_selector"); // show the button to lookup campaigns
      }
    }
  } catch (error) {
    // TODO something is wrong with the data, should we request it again or just fail?
    toggleElement("loading_indicator");
    partnersUnavailable();
  }
}

function fillInClientOptions(clients) {
  try {
    if (clients != null) {
      var client_selector = document.getElementById("client_selector");
      for (var i = 0; i < clients.length; i++){
        var option = document.createElement("option");
        option.text = clients[i].client_name; // show users the client name
        option.value = clients[i].client_id; // grab the ID when we pull in this field on Sherlock's end
        client_selector.add(option);
      }
      if (client_selector.options.length == 1) {
        // this is most likely not a valid advertiser, so show that in the dropdown hint
        client_selector.options[0].text = "No clients for that partner";
        client_selector.selectedIndex = 0;
      } else {
        // only update the buttons if we actually got clients back
        toggleElement("client_lookup_button"); // don't show the button anymore
        toggleElement("campaign_lookup_button"); // show the button to submit the form
        toggleElement("loading_indicator"); // turn off the loading indicator now that we have the data
        console.log('Successfully retrieved data!');
        if (client_selector.options.length == 2) {
          document.getElementById('client_id').value = client_selector.options[1].value;
        } else {
          client_selector.options[0].text = "Select a client";
          if (client_selector.options.length > 2) {
            /* the selector has 2 options, one is the non-selectable one and the other is valid so only need to move
            the selector when we have more than 2 to to the non-selectable one */
            client_selector.selectedIndex = 0; // set the selector to something that prompts selecting the proper value
          }
        }
      }
      if (document.getElementById("client_selector").style.display === "none" && client_selector.options.length != 2) {
        toggleElement("client_selector"); // show the options
      }
    }
  } catch (error) {
    // TODO something is wrong with the data, should we request it again or just fail?
    toggleElement("loading_indicator");
    clientsUnavailable();
  }
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

function setValue(id, selector) {
  let item = document.getElementById(id);
  let item_selector = document.getElementById(selector);
  // copy over value
  let selected = item_selector.options[item_selector.selectedIndex].value;
  item.value = selected;
  // hide selector
  item_selector.style.display = "none";
  let partner_id = document.getElementById("partner_id").value;
  let client_id = document.getElementById("client_id").value;
  initializeButtons({partnerID : partner_id, clientID : client_id});
}


// show proper buttons based on initial input
function initializeButtons(values) {
  let partner_id = values.partnerID;
  let client_id = values.clientID;
  if (partner_id && client_id) {
    turnOff(['partner_lookup_button', 'client_lookup_button']);
    turnOn(['campaign_lookup_button']);
  } else if (!partner_id && client_id) {
    turnOff(['client_lookup_button', 'campaign_lookup_button']);
    turnOn(['partner_lookup_button']);
  } else if (partner_id && !client_id) {
    turnOff(['partner_lookup_button', 'campaign_lookup_button']);
    turnOn(['client_lookup_button']);
  } else {
    turnOff(['campaign_lookup_button']);
    turnOn(['partner_lookup_button']);
  }
}
