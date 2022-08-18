// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  setSearchValue: function(component, event, helper) {
    const searchVal = component.find('searchText').get('v.value');
    component.set('v.searchText', searchVal);
  },
  searchRecord: function(component, event, helper) {
    const searchText = component.get('v.searchText');

    const compEvent = component.getEvent('searchRecordEvent');
    compEvent.setParams({
      searchText: searchText,
    });
    compEvent.fire();
  },
});
