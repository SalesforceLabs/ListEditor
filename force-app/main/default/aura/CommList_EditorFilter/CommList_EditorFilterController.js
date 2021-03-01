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