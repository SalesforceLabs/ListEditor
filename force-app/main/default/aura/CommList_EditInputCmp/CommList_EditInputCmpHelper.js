// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  isValueInPicklistOptions: function(component) {
    let selectOptions = component.get('v.selectOptions');
    let value = component.get('v.value');

    if (typeof selectOptions !== 'undefined') {
      for (let i = 0; i < selectOptions.length; i++) {
        if (selectOptions[i].value == value) return true;
      }
    }
    return false;
  },

  checkAndFormatTimeInput: function(component) {
    if (component.get('v.type') === 'time') {
      let value = component.get('v.value');

      if (value !== null && value !== undefined) {
        let splValue = value.split(':');

        if (splValue[0].length === 1) {
          value = '0' + value;
        }

        component.set('v.value', value);
      }
    }
  },

  enableOrDisableFields: function(component) {
    var allInputTypes = [];
    allInputTypes.push(component.find('myCheckbox'));
    allInputTypes.push(component.find('myPicklist'));
    allInputTypes.push(component.find('myStandardInput'));

    for (let i = 0; i < allInputTypes.length; i++) {
      if (typeof allInputTypes[i] !== 'undefined' && typeof allInputTypes[i].getElement === 'function') {
        allInputTypes[i].getElement().disabled = component.get('v.disabled');
      }
    }
  },

  fireEventChange: function(component, value) {
    let fieldChangedEvent = $A.get('e.c:CommList_EditInputChangeEvent');

    fieldChangedEvent.setParams({
      fieldName: component.get('v.name'),
      fieldType: component.get('v.type'),
      rowIndex: component.get('v.rowIndex'),
      newValue: value,
    });

    fieldChangedEvent.fire();
  },

  formatNumber: function(component, valueNumber) {
    valueNumber = valueNumber == null || valueNumber == 'NaN' ? 0 : Number(valueNumber);
    let currentScale = component.get('v.scale');

    return valueNumber.toFixed(Math.log10(1 / currentScale));
  },
});
