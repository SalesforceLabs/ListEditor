({
  doSearch: function(cmp, event) {
    // Get the search string, input element and the selection container
    var searchString = cmp.get('v.searchString');
    var lookupDiv = cmp.find('lookup-div');

    // We need at least 2 characters for an effective search
    if (event.getParam('keyCode') === 27) {
      // Hide the lookuplist
      $A.util.removeClass(lookupDiv, 'slds-is-open');
      return;
    }

    // Show the lookuplist
    $A.util.addClass(lookupDiv, 'slds-is-open');

    // Get the API Name
    var objectsToSearch = cmp.get('v.objectsToSearch');

    // Create an Apex action
    var action = cmp.get('c.lookup');

    // Mark the action as abortable, this is to prevent multiple events from the keyup executing
    action.setAbortable();

    // Set the parameters
    action.setParams({ searchString: searchString, objectsToSearch: objectsToSearch });

    // Define the callback
    action.setCallback(this, function(response) {
      // Callback succeeded
      var state = response.getState();
      if (cmp.isValid() && state === 'SUCCESS') {
        // Get the search matches
        var matches = response.getReturnValue();

        // If we have no matches, return nothing
        if (matches.length == 0) {
          cmp.set('v.matches', null);
          return;
        }

        // Store the results
        cmp.set('v.matches', matches);
      }
    });

    // Enqueue the action if 2 characters at least for an effective search
    if (!(typeof searchString === 'undefined' || searchString.length < 2)) {
      $A.enqueueAction(action);
      var objname = objectsToSearch[0];

      if (objectsToSearch.length > 1) {
        objname += ' and ' + objectsToSearch[1];
      }
      cmp.set('v.searchMessage', '"' + searchString + '" in ' + objname);
    } else {
      cmp.set('v.matches', null);
      cmp.set('v.searchMessage', $A.get('$Label.c.CommList_SearchHelp'));
    }
  },

  /**
   * Handle the Selection of an Item
   */
  handleSelection: function(cmp, event) {
    var objectId = this.resolveId(event.currentTarget.id);
    var objectLabel = event.currentTarget.innerText;
    var iconName = event.currentTarget.dataset.iconname;
    this.setSelectedValueAndCloseSearchResultPanel(cmp, objectId, objectLabel, iconName);
  },

  setSelectedValueAndCloseSearchResultPanel: function(cmp, objectId, objectLabel, iconName) {
    // update the selectedItemId and selectedItemLabel attributes
    cmp.set('v.selectedItemId', objectId);
    cmp.set('v.selectedItemLabel', objectLabel);
    cmp.set('v.searchString', objectLabel);
    cmp.set('v.iconName', iconName);
    cmp.set('v.selectedIndex', -1);

    // Hide search result panel
    var lookupDiv = cmp.find('lookup-div');
    $A.util.removeClass(lookupDiv, 'slds-is-open');
    var inputElement = cmp.find('lookup');
    $A.util.addClass(inputElement, 'slds-hide');
    var lookupPill = cmp.find('lookup-pill');
    $A.util.removeClass(lookupPill, 'slds-hide');
    var inputElement = cmp.find('lookup-div');
    $A.util.addClass(inputElement, 'slds-has-selection');
    //Trigger event change
    this.firechangedValuesEvent();
  },

  handleInitialSelection: function(cmp, event) {
    // Resolve the Object Id from the events Element Id (this will be the <a> tag)
    var objectsToSearch = cmp.get('v.objectsToSearch');
    var objectId = cmp.get('v.selectedItemId');

    //Exit init action if no selectedItemId was provided
    if (typeof objectId === 'undefined' || objectId == '' || objectId == null) {
      return;
    }

    if (typeof objectsToSearch === 'undefined' || objectsToSearch == null) {
      return;
    }
    var action = cmp.get('c.getRecordName');
    action.setParams({ recordId: objectId, objectsToSearch: objectsToSearch });

    action.setCallback(this, function(response) {
      var state = response.getState();

      // Callback succeeded
      if (cmp.isValid() && state === 'SUCCESS') {
        // The Object label is the response of the query)
        var queryResult = response.getReturnValue();

        // update the selectedItemId and selectedItemLabel attributes
        cmp.set('v.selectedItemLabel', queryResult.recLabel);

        // Update the Searchstring with the Label
        cmp.set('v.searchString', queryResult.recLabel);

        //update the icon
        cmp.set('v.iconName', queryResult.objectIcon);

        var lookupDiv = cmp.find('lookup-div');
        $A.util.removeClass(lookupDiv, 'slds-is-open');

        // Hide the Input Element
        var inputElement = cmp.find('lookup');
        $A.util.addClass(inputElement, 'slds-hide');

        // Show the Lookup pill
        var lookupPill = cmp.find('lookup-pill');
        $A.util.removeClass(lookupPill, 'slds-hide');

        // Lookup Div has selection
        var inputElement = cmp.find('lookup-div');
        $A.util.addClass(inputElement, 'slds-has-selection');
      } else if (state === 'ERROR') {
        // Handle any error by reporting it
        var errors = response.getError();
        if (errors) {
          if (errors[0] && errors[0].message) {
            this.displayToast('Error', errors[0].message);
          }
        } else {
          this.displayToast('Error', 'Unknown error.');
        }
      }
    });

    // Enqueue the action
    $A.enqueueAction(action);
    cmp.set('v.prevSelectedItemId', objectId);
  },
  /**
   * Clear the Selection
   */
  clearSelection: function(cmp) {
    // Clear the Searchstring
    cmp.set('v.searchString', '');

    var selectedId = cmp.get('v.selectedItemId');
    if (typeof selectedId === 'undefined' || selectedId == '' || selectedId == null) {
      return;
    } else {
      cmp.set('v.selectedItemId', '');
    }
    cmp.set('v.selectedItemLabel', '');

    // Hide the Lookup pill
    var lookupPill = cmp.find('lookup-pill');
    $A.util.addClass(lookupPill, 'slds-hide');

    // Show the Input Element
    var inputElement = cmp.find('lookup');
    $A.util.removeClass(inputElement, 'slds-hide');

    // Lookup Div has no selection
    var inputElement = cmp.find('lookup-div');
    $A.util.removeClass(inputElement, 'slds-has-selection');

    cmp.set('v.selectedItemLabel', '');
    //Trigger event change
    this.firechangedValuesEvent();
  },

  /**
   * Resolve the Object Id from the Element Id by splitting the id at the _
   */
  resolveId: function(elmId) {
    var i = elmId.lastIndexOf('_');
    return elmId.substr(i + 1);
  },
  /**
   * Display a message
   */
  displayToast: function(title, message) {
    // For lightning1 show the toast
    var toast = $A.get('e.force:showToast');
    if (toast) {
      //fire the toast event in Salesforce1
      toast.setParams({
        title: title,
        message: message
      });

      toast.fire();
    } else {
      // otherwise throw an alert
      console.log(title + ': ' + message);
    }
  },

  isArrowKeyUp: function(event) {
    return event.which === 38;
  },

  isArrowKeyDown: function(event) {
    return event.which === 40;
  },

  isEnterKey: function(event) {
    return event.which === 13;
  },

  findNextSelectedIndex: function(event, currentSelectedIndex, arrayLength) {
    const maxIndex = arrayLength - 1;
    if (this.isArrowKeyDown(event)) {
      return currentSelectedIndex === maxIndex ? 0 : currentSelectedIndex + 1;
    } else {
      return currentSelectedIndex === 0 ? maxIndex : currentSelectedIndex - 1;
    }
  },
  firechangedValuesEvent: function() {
    var fieldChangedEvent = $A.get('e.c:CommList_EditInputChangeEvent');
    fieldChangedEvent.fire();
  }
});
