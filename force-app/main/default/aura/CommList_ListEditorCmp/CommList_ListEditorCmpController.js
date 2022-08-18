// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
({
  doInit: function(component, event, helper) {
    const wrapper = component.find('ListEditorWrapper');
    const globalId = component.getGlobalId();
    const flowName = component.get('v.flowName');

    const flowItem = flowName && flowName.split(',').map(data => data.trim()) || null;
    helper.getFlowInfo(component, flowItem);

    $A.util.addClass(wrapper, 'comm-list-' + globalId.replace(/[;:]/g, '-'));
    helper.getRecordList(component, event, helper, false);
  },

  reloadAction: function(component, event, helper) {
    let reflesh = false;
    const loadType = event.getParam('type');
    const parentField = event.getParam('parentField');

    if (loadType === 'save') {
      component.set('v.loadMoreOffset', 0);
      reflesh = true;
    } else if (loadType === 'changeParent') {
      component.set('v.loadMoreOffset', 0);
      component.set('v.parentField', parentField);
      reflesh = true;
    } else if (loadType === 'refresh') {
      component.set('v.loadMoreOffset', 0);
      reflesh = true;
    }

    helper.getRecordList(component, event, helper, reflesh);
  },

  loadMoreData: function (component, event, helper) {
    helper.getRecordList(component, event, helper, false);
  },

  sortChangeRecordList: function(component, event, helper) {
    component.set('v.loadMoreOffset', 0);
    component.set('v.parentField', event.getParam('parentField'));
    helper.getRecordList(component, event, helper, true);
  },

  searchRecordList: function(component, event, helper) {
    component.set('v.loadMoreOffset', 0);
    component.set('v.searchText', event.getParam('searchText'));
    helper.getRecordList(component, event, helper, true);
  },

  resetDataList: function (component, event, helper) {
    const isEditMode = component.get('v.isEditMode');

    if (!isEditMode) {
      let originalRecordList = component.get('v.originalRecordList');
      originalRecordList = JSON.parse(JSON.stringify(originalRecordList));

      component.set('v.recordList', originalRecordList);
    }
  }
});
