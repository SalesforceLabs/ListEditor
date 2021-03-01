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