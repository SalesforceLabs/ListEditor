public with sharing class CommList_PicklistOption {
    @AuraEnabled
    public String value;
    @AuraEnabled
    public String label;
    public CommList_PicklistOption(String value, String label){
        this.value=value; this.label=label;
    }
}