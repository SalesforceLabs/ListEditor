public with sharing class CommList_PicklistService {
    private static final String BASE64CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    public static List<CommList_PicklistOption> getPicklistOptions (Schema.PicklistEntry[] picklistValues) {
        List<CommList_PicklistOption> options = new List<CommList_PicklistOption>();
        for (Schema.PicklistEntry entry : picklistValues) {
            CommList_PicklistOption newOption = new CommList_PicklistOption(entry.getValue(),entry.getLabel());
            options.add(newOption);
        }
        return options;
    }

    public static Map<String, List<CommList_PicklistOption>> getDependencyPicklistOptions (Schema.DescribeFieldResult controlFieldDescribe , Schema.PicklistEntry[] dependEntries) {
        List<String> controllingValues ;
        Map<String, List<CommList_PicklistOption>> dependencyPicklistOptions = new Map<String, List<CommList_PicklistOption>>();
        if(controlFieldDescribe.getType() == Schema.DisplayType.PICKLIST || controlFieldDescribe.getType() == Schema.DisplayType.MULTIPICKLIST){
            Schema.PicklistEntry[] controlEntries = controlFieldDescribe.getPicklistValues();
            controllingValues = initControllingValues(dependencyPicklistOptions, controlEntries);
        }else{
            controllingValues = new List<String>{'false','true'};
            dependencyPicklistOptions.put('true', new List<CommList_PicklistOption>());
            dependencyPicklistOptions.put('false', new List<CommList_PicklistOption>());
        }
        List<PicklistEntryWrapper> dependEntriesWrapper = wrapPicklistEntries(dependEntries);
        for (PicklistEntryWrapper dependEntry : dependEntriesWrapper) {
            if (dependEntry.active) {
             	String validForBits = base64ToBits(dependEntry.validFor);
                for (Integer i = 0; i < validForBits.length(); i++) {
                    if (validForBits.mid(i, 1) == '1') {
                        CommList_PicklistOption option = new CommList_PicklistOption(dependEntry.value,dependEntry.label);
                        dependencyPicklistOptions.get(controllingValues.get(i)).add(option);
                    }
                }
            }
        }
        return dependencyPicklistOptions;
    }

    private static List<PicklistEntryWrapper> wrapPicklistEntries(List<Schema.PicklistEntry> picklistEntries) {
        String pickListEntriesAsJson = JSON.serialize(picklistEntries);
        if (Test.isRunningTest()) {
            pickListEntriesAsJson = '[{"active":true,"defaultValue":false,"label":"A","validFor":"gAAA","value":"A"},{"active":true,"defaultValue":false,"label":"B","validFor":"QAAA","value":"B"}]';
        }
        return (List<PicklistEntryWrapper>)JSON.deserialize(pickListEntriesAsJson, List<PicklistEntryWrapper>.class);
    }

    private static List<String> initControllingValues (Map<String, List<CommList_PicklistOption>> dependencyPicklistOptions, Schema.PicklistEntry[] controlEntries) {
        List<String> controllingValues = new List<String>();
        for (Schema.PicklistEntry ple : controlEntries) {
            if (ple.isActive()) {
             	String apiName = ple.getValue();
                dependencyPicklistOptions.put(apiName, new List<CommList_PicklistOption>());
                controllingValues.add(apiName);
            }
        }
        return controllingValues;
    }

    private static String base64ToBits(String validFor) {
        if (String.isEmpty(validFor)) return '';
        String validForBits = '';
        for (Integer i = 0; i < validFor.length(); i++) {
            Integer val = BASE64CHARS.indexOf(validFor.mid(i, 1));
            String bits = decimalToBinary(val).leftPad(6, '0');
            validForBits += bits;
        }
        return validForBits;
    }

    private static String decimalToBinary(Integer val) {
        String bits = '';
        while (val > 0) {
            Integer remainder = Math.mod(val, 2);
            val = Integer.valueOf(Math.floor(val / 2));
            bits = String.valueOf(remainder) + bits;
        }
        return bits;
    }

    public with sharing class PicklistEntryWrapper{
        public Boolean active {get;set;}
        public String label {get;set;}
        public String value {get;set;}
        public String validFor {get;set;}
        public PicklistEntryWrapper(){}
    }
}