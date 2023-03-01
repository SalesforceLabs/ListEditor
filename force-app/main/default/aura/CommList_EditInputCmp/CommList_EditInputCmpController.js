// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  doInit: function(component, event, helper) {
    const objectFields = component.get('v.objectFields');
    const colIndex = component.get('v.colIndex');
    const isEdited = component.get('v.isEdited');

    if (objectFields && objectFields.length > 0 && colIndex != undefined && colIndex != null) {
      component.set('v.label', objectFields[colIndex].fieldName);
    }

    if (isEdited) {
      component.set('v.inputWrappedClass', 'slds-form-element item-changed');
      component.set('v.inputClass', 'slds-input item-changed');
    }

    component.set('v.noPicklistMatch', !helper.isValueInPicklistOptions(component));
  },
  refresh: function(component, event, helper) {
    //enable or disable the components
    helper.enableOrDisableFields(component);
  },
  initEditDataForm: function(component, event, helper) {
    helper.checkAndFormatTimeInput(component);
    component.set('v.noPicklistMatch', !helper.isValueInPicklistOptions(component));
    //helper.fireEventChange(component,component.get("v.value"));
  },
  handleInputNumber: function(component, event, helper) {
    let subType = component.get('v.subType');
    let input = component.find('myStandardInput');
    let valueChanged = input.get('v.value');
    let currentScale = component.get('v.scale');
    let decimalLength = Math.log10(1 / currentScale);

    if (subType === 'number' && currentScale) {
      //currentScale = 1 / currentScale / 10;
      //valueChanged = valueChanged * currentScale;

      //if (!Number.isInteger(valueChanged)) {
      //  valueChanged = parseInt(input.get('v.value') * Math.pow(10, decimalLength)) / Math.pow(10, decimalLength);
      //  input.set('v.value', valueChanged);
      //}

      component.set('v.errorMsg', '');
      $A.util.removeClass(component.find('myStandardInput'), 'slds-has-error');
    }

    $A.util.addClass(component.find('myStandardInput'), 'item-changed');
    helper.fireEventChange(component, component.get('v.value'));
  },
  onChange: function(component, event, helper) {
    // Incase not a textbox
    let subType = component.get('v.subType');

    if (typeof event.currentTarget.type !== 'undefined') {
      let valueChanged;

      if (event.currentTarget.type === 'checkbox') {
        valueChanged = event.currentTarget.checked;
      } else {
        valueChanged = event.currentTarget.value;
      }

      component.set('v.value', valueChanged);
    } else {
      let valueChanged = component.get('v.value');

      // Checking by type
      if (subType === 'tel') {
        let regexTel = RegExp(/^[0-9]{2,3}-[0-9]{0,4}-[0-9]{0,4}/);

        if (!regexTel.test(valueChanged) && valueChanged !== '') {
          component.set('v.errorMsg', $A.get('$Label.c.CommList_InputPhoneHelp'));
          $A.util.addClass(component.find('myStandardInput'), 'slds-has-error');
        } else {
          component.set('v.errorMsg', '');
          $A.util.removeClass(component.find('myStandardInput'), 'slds-has-error');
        }
      } else if (subType === 'email') {
        let regexMail = RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

        if (!regexMail.test(valueChanged) && valueChanged !== '') {
          component.set('v.errorMsg', $A.get('$Label.c.CommList_InputEmailHelp'));
        } else {
          component.set('v.errorMsg', '');
          $A.util.removeClass(component.find('myStandardInput'), 'slds-has-error');
        }
      } else if (subType === 'number') {
        // var regexNumb = RegExp(/^(\+|-)?\d*\.?\d*$/);
        // if(!regexNumb.test(valueChanged)){
        // 	component.set('v.errorMsg', '半角数字で入力してください。 ');
        // 	valueChanged = 0;
        // } else {
        // 	//Round with scale
        // 	var currentScale = component.get("v.scale");
        // 	valueChanged = Math.round(Number(valueChanged) * (1/currentScale))/(1/currentScale).toFixed(Math.log10(1/currentScale));
        // 	component.set('v.errorMsg', '');
        // 	$A.util.removeClass(component.find('myStandardInput'), 'slds-has-error');
        // }
      } else if (subType === 'url') {
        let regexUrl = RegExp(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g);

        if (!regexUrl.test(valueChanged) && valueChanged !== '') {
          component.set('v.errorMsg', $A.get('$Label.c.CommList_InputUrlHelp'));
        } else {
          component.set('v.errorMsg', '');
        }
      }

      component.set('v.value', valueChanged);
      $A.util.addClass(component.find('myPicklist'), 'item-changed');
      $A.util.addClass(component.find('myStandardInput'), 'item-changed');
    }
    helper.fireEventChange(component, component.get('v.value'));
  },
  lostFocus: function(component) {
    if (component.get('v.subType') === 'number' && component.get('v.value') === '') {
      component.set('v.value', 0);
    }
  },
  clearText: function(component, event, helper) {
    if (event && typeof event.currentTarget.type !== 'undefined') {
      let newValue = '';
      let subType = component.get('v.subType');

      if (subType === 'number') {
        newValue = null;
      }

      component.set('v.value', newValue);
      $A.util.addClass(component.find('myStandardInput'), 'item-changed');
    }
    helper.fireEventChange(component, component.get('v.value'));
  },
  counter_inc: function(component, event, helper) {
    let value = component.get('v.value');
    value = value == null || value == 'NaN' ? 0 : parseFloat(value);
    let scale = component.get('v.scale');
    component.set('v.value', helper.formatNumber(component, value + scale));
    $A.util.addClass(component.find('myStandardInput'), 'item-changed');
    helper.fireEventChange(component, component.get('v.value'));
  },
  counter_desc: function(component, event, helper) {
    let value = component.get('v.value');
    value = value == null || value == 'NaN' ? 0 : parseFloat(value);
    let scale = component.get('v.scale');
    component.set('v.value', value - scale);
    component.set('v.value', helper.formatNumber(component, value - scale));
    $A.util.addClass(component.find('myStandardInput'), 'item-changed');
    helper.fireEventChange(component, component.get('v.value'));
  },
  onCommitNumber: function(component, event, helper) {
    let valueChanged = component.find('myStandardInput').get('v.value');
    component.set('v.value', helper.formatNumber(component, valueChanged));
  },
  handleKeyUp: function(component, event, helper) {
    if (event.keyCode >= 64 && event.keyCode <= 126) {
      event.preventDefault();
    }
  }
});
