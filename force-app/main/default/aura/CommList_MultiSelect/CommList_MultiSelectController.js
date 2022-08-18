// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  handleClick: function(component, event, helper) {
    var mainDiv = component.find('main-div');
    $A.util.addClass(mainDiv, 'slds-is-open');
    if (component.get('v.isInit')) {
      helper.setDefaultSelectedItems(component);
      component.get('v.isInit', false);
    }
  },

  handleSelection: function(component, event, helper) {
    var item = event.currentTarget;
    if (item && item.dataset) {
      var value = item.dataset.value;
      var options = component.get('v.options');
      var selectedItems = [];
      options.forEach(function(element) {
        if (element.value == value) {
          element.selected = !element.selected;
        }
        if (element.selected) {
          selectedItems.push(element.value);
        }
      });
      component.set('v.options', options);
      component.set('v.selectedItems', selectedItems.join(';'));
      helper.firechangedValuesEvent();
    }
  },

  handleMouseLeave: function(component, event, helper) {
    component.set('v.dropdownOver', false);
    var mainDiv = component.find('main-div');
    $A.util.removeClass(mainDiv, 'slds-is-open');
  },

  handleMouseEnter: function(component, event, helper) {
    component.set('v.dropdownOver', true);
  },

  handleMouseOutButton: function(component, event, helper) {
    window.setTimeout(
      $A.getCallback(function() {
        if (component.isValid()) {
          if (component.get('v.dropdownOver')) {
            return;
          }
          var mainDiv = component.find('main-div');
          $A.util.removeClass(mainDiv, 'slds-is-open');
        }
      }),
      200
    );
  },
});
