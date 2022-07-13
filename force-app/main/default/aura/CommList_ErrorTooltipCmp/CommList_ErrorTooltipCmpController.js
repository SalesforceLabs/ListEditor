({
  doInit: function(component, event, helper) {
    const errortipHelp = component.find('errortip-help');
    const tipBGColor = component.get('v.tipBGColor');

    if (errortipHelp && errortipHelp.getElement()) {
      errortipHelp.getElement().style.background = tipBGColor;
    }
  }
});
