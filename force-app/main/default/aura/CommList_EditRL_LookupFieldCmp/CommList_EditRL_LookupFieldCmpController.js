({
  /**
   * Search records for a match
   */
  search: function(cmp, event, helper) {
    helper.doSearch(cmp, event);
  },
  /**
   * Select a record from a list
   */
  select: function(cmp, event, helper) {
    helper.handleSelection(cmp, event);
  },
  /**
   * Clear the currently selected SObject
   */
  clear: function(cmp, event, helper) {
    helper.clearSelection(cmp);
  },
  autoClear: function(cmp, event, helper) {
    //if autoClear was wrongly called by lightning, then return
    if (cmp.get('v.prevSelectedItemId') == cmp.get('v.selectedItemId')) {
      return;
    }
    if (cmp.get('v.selectedItemId') == null || cmp.get('v.selectedItemId') == '') {
      helper.clearSelection(cmp);
    } else {
      cmp.refreshLookup();
    }
    cmp.set('v.prevSelectedItemId', cmp.get('v.selectedItemId'));
  },
  initLookup: function(cmp, event, helper) {
    helper.handleInitialSelection(cmp);
  },
  inputBlur: function(cmp, event, helper) {
    var lookupDiv = cmp.find('lookup-div');
    $A.util.removeClass(lookupDiv, 'slds-is-open');
  },

  checkIfArrowKey: function(component, event, helper) {
    var searchResults = component.get('v.matches');
    var currentSelectedIndex = component.get('v.selectedIndex');

    if (searchResults && searchResults.length) {
      if (helper.isArrowKeyUp(event) || helper.isArrowKeyDown(event)) {
        if (currentSelectedIndex !== -1) {
          searchResults[currentSelectedIndex].selected = false;
        }
        currentSelectedIndex = helper.findNextSelectedIndex(event, currentSelectedIndex, searchResults.length);
        searchResults[currentSelectedIndex].selected = true;

        component.set('v.selectedIndex', currentSelectedIndex);
        component.set('v.matches', searchResults);
      } else if (helper.isEnterKey(event) && currentSelectedIndex !== -1) {
        const selectedItem = searchResults[currentSelectedIndex];
        helper.setSelectedValueAndCloseSearchResultPanel(component, selectedItem.recId, selectedItem.recLabel, selectedItem.objectIcon);
      }
    }
  },
});