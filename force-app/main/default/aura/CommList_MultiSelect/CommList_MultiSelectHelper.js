// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  setDefaultSelectedItems: function(component) {
    var selectedItems = this.getSelectedItemsAsArray(component.get('v.selectedItems'));
    var options = component.get('v.options');
    if (selectedItems && options) {
      options.forEach((option) => {
        option.selected = selectedItems.some((item) => option.value === item);
      });
      component.set('v.options', options);
    }
  },

  getSelectedItemsAsArray: function(selectedItemsAsString) {
    if (selectedItemsAsString) {
      return selectedItemsAsString.split(';');
    }
    return [];
  },

  firechangedValuesEvent: function() {
    var fieldChangedEvent = $A.get('e.c:CommList_EditInputChangeEvent');
    fieldChangedEvent.fire();
  },
});
