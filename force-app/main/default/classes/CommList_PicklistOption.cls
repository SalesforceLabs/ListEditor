// Copyright 2020 salesforce.com, inc
// All rights reserved.
// SPDX-License-Identifier: BSD-3-Clause
// For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
public with sharing class CommList_PicklistOption {
  @AuraEnabled
  public String value;
  @AuraEnabled
  public String label;
  public CommList_PicklistOption(String value, String label) {
    this.value = value;
    this.label = label;
  }
}
