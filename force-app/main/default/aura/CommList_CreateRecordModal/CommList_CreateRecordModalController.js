// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  closeModal: function(component, event, helper) {
    component.set('v.isOpen', false);
  },
  showToast: function(component, event, helper) {
    var toastEvent = $A.get('e.force:showToast');
    toastEvent.setParams({
      title: 'Success!',
      message: 'The record has been updated successfully.',
      type: 'success',
    });
    toastEvent.fire();
    component.set('v.isOpen', false);
  },
});
