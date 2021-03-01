({
  afterRender: function(component, helper) {
    this.superAfterRender();

    let recordList = component.get('v.recordList');
    const isHaveNoError = component.get('v.isHaveNoError');
    let condition = component.get('v.conditionsFilterList');
    component.set('v.originCondition', condition);

    if (recordList.length > 0 && isHaveNoError) {
      helper.getColumnDefinitions(component, recordList);
      helper.getObjectLabel(component);
      helper.getRelationshipName(component);
      helper.getTabStyle(component);
    } else {
      let defaultObjectLabel = component.get('v.defaultLabel');

      if (defaultObjectLabel !== '') {
        component.set('v.title', defaultObjectLabel);
      }
    }
  },
});