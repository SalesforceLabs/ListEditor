// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause

({
  doInit: function(component, event, helper) {
    const errortipHelp = component.find('errortip-help');
    const tipBGColor = component.get('v.tipBGColor');

    if (errortipHelp && errortipHelp.getElement()) {
      errortipHelp.getElement().style.background = tipBGColor;
    }
  }
});
